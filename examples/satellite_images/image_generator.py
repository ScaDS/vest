"""Generate satellite images for random pairs of regions using OpenAI image generation."""

from __future__ import annotations

import argparse
import base64
import os
import random
import re
from pathlib import Path

from openai import OpenAI

IMAGE_SIZE = "1024x1024"


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return cleaned.strip("-") or "region"


def build_satellite_prompt(region_a: str, region_b: str) -> str:
    return (
        "Generate a realistic overhead satellite image that blends terrain characteristics "
        f"from these two regions: '{region_a}' and '{region_b}'. "
        "The scene should represent approximately 500x500 meters of ground coverage. "
        "Output dimensions must be exactly 1024x1024 pixels. "
        "No text, labels, branding marks, borders, or watermarks. "
        "Natural colors and high geographic realism."
    )


def build_single_region_satellite_prompt(region: str) -> str:
    return (
        "Generate a realistic overhead satellite image of this region: "
        f"'{region}'. "
        "The scene should represent approximately 500x500 meters of ground coverage. "
        "Output dimensions must be exactly 1024x1024 pixels. "
        "No text, labels, branding marks, borders, or watermarks. "
        "Natural colors and high geographic realism."
    )


def read_region_names(path: Path) -> list[str]:
    if not path.exists():
        raise FileNotFoundError(f"Region names file not found: {path}")

    names = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
    names = [name for name in names if name]

    if not names:
        raise ValueError("No region names found in input file")

    return names


def pick_region_pair(region_names: list[str]) -> tuple[str, str]:
    if len(region_names) >= 2:
        return tuple(random.sample(region_names, 2))
    return region_names[0], region_names[0]


def generate_image_bytes(client: OpenAI, model: str, prompt: str, size: str) -> bytes:
    result = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
    )

    if not result.data:
        raise RuntimeError("Image API returned no data")

    image_base64 = result.data[0].b64_json
    if not image_base64:
        raise RuntimeError("Image API returned empty base64 payload")

    return base64.b64decode(image_base64)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate satellite images from random region pairs.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("region_names.txt"),
        help="Input file containing one region name per line (default: region_names.txt)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("images"),
        help="Directory where generated images are stored (default: satellite_images)",
    )
    parser.add_argument(
        "--model",
        default="gpt-image-1-mini",
        help="Image model to use (default: gpt-image-1)",
    )
    parser.add_argument(
        "--single-count",
        type=int,
        default=100,
        help="Number of single-region images to generate (default: 100)",
    )
    parser.add_argument(
        "--pair-count",
        type=int,
        default=100,
        help="Number of region-pair images to generate (default: 100)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional random seed for reproducible region-pair choices",
    )
    return parser.parse_args()


def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY is not set")

    args = parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    region_names = read_region_names(args.input)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    client = OpenAI()

    total_images = args.single_count + args.pair_count
    image_index = 1

    for _ in range(args.pair_count):
        region_a, region_b = pick_region_pair(region_names)
        file_name = f"{image_index:03d}_{slugify(region_a)}__{slugify(region_b)}.png"
        output_path = args.output_dir / file_name

        if output_path.exists():
            print(f"[{image_index}/{total_images}] Skipped existing {output_path}")
            image_index += 1
            continue

        prompt = build_satellite_prompt(region_a, region_b)
        image_bytes = generate_image_bytes(client, args.model, prompt, IMAGE_SIZE)
        output_path.write_bytes(image_bytes)
        print(f"[{image_index}/{total_images}] Saved {output_path}")
        image_index += 1


    for _ in range(args.single_count):
        region = random.choice(region_names)
        file_name = f"{image_index:03d}_{slugify(region)}.png"
        output_path = args.output_dir / file_name

        if output_path.exists():
            print(f"[{image_index}/{total_images}] Skipped existing {output_path}")
            image_index += 1
            continue

        prompt = build_single_region_satellite_prompt(region)
        image_bytes = generate_image_bytes(client, args.model, prompt, IMAGE_SIZE)
        output_path.write_bytes(image_bytes)
        print(f"[{image_index}/{total_images}] Saved {output_path}")
        image_index += 1

if __name__ == "__main__":
    main()
