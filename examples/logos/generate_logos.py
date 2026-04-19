"""Generate logo images for company names using OpenAI image generation."""

from __future__ import annotations

import argparse
import base64
import os
import random
import re
from pathlib import Path

from openai import OpenAI

STYLES = [
    "minimalist vector logo",
    "geometric modern logo",
    "flat icon logo",
    "retro badge logo",
    "sleek monoline logo",
    "futuristic abstract logo",
    "clean corporate emblem",
    "dynamic angular mark",
    "friendly rounded symbol",
    "luxury serif monogram",
]

COLOR_PALETTES = [
    "navy and gold",
    "teal and charcoal",
    "orange and deep blue",
    "emerald and silver",
    "crimson and black",
    "sky blue and white",
    "indigo and coral",
    "forest green and cream",
    "burgundy and beige",
    "cyan and graphite",
]

BACKGROUND_TREATMENTS = [
    "transparent background",
    "white background",
    "light gray background",
]

ICON_MOTIFS = [
    "abstract lettermark",
    "symbolic globe motif",
    "arrow and motion motif",
    "interlocking shapes motif",
    "wave-inspired motif",
    "shield-inspired motif",
    "hexagon-inspired motif",
    "path and route motif",
    "spark and innovation motif",
    "network node motif",
]


def slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value.strip().lower())
    return cleaned.strip("-") or "company"


def build_logo_prompt(company_name: str) -> str:
    style = random.choice(STYLES)
    colors = random.choice(COLOR_PALETTES)
    background = random.choice(BACKGROUND_TREATMENTS)
    motif = random.choice(ICON_MOTIFS)

    return (
        f"Create a professional {style} for a company named '{company_name}'. "
        f"Use a {motif}. "
        f"Color palette: {colors}. "
        f"Background: {background}. "
        "The logo should be clean, high-contrast, and suitable for web and print branding. "
        "No extra text beyond the company name. Center composition."
    )


def read_company_names(path: Path) -> list[str]:
    if not path.exists():
        raise FileNotFoundError(f"Company names file not found: {path}")

    names = [line.strip() for line in path.read_text(encoding="utf-8").splitlines()]
    names = [name for name in names if name]

    if not names:
        raise ValueError("No company names found in input file")

    return names


def generate_logo_bytes(client: OpenAI, model: str, prompt: str, size: str) -> bytes:
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
    parser = argparse.ArgumentParser(description="Generate logo images from company names.")
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("company_names.txt"),
        help="Input file containing one company name per line (default: company_names.txt)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("logos"),
        help="Directory where generated logos are stored (default: logos)",
    )
    parser.add_argument(
        "--model",
        default="gpt-image-1-mini",
        help="Image model to use (default: gpt-image-1)",
    )
    parser.add_argument(
        "--size",
        default="1024x1024",
        help="Image size for generation (default: 1024x1024)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Optional random seed for reproducible style choices",
    )
    return parser.parse_args()


def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY is not set")

    args = parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    if args.output_dir is None:
        args.output_dir = Path("logos")

    company_names = read_company_names(args.input)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    client = OpenAI()

    for i, company_name in enumerate(company_names, start=1):

        file_name = f"{i:02d}_{slugify(company_name)}.png"

        if not os.path.exists(args.output_dir / file_name):
            prompt = build_logo_prompt(company_name)
            image_bytes = generate_logo_bytes(client, args.model, prompt, args.size)
            output_path = args.output_dir / file_name
            output_path.write_bytes(image_bytes)

        print(f"[{i}/{len(company_names)}] Saved {output_path}")


if __name__ == "__main__":
    main()
