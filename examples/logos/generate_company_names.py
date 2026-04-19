"""Generate company names with OpenAI and save them to disk."""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path

from openai import OpenAI

SECTORS = [
    "software development",
    "data science",
    "AI",
    "IT consulting",
    "manufacturing",
    "chemical processing",
    "bus travel",
    "vacation on ships",
    "logistics",
    "mail",
]

NAMES_PER_SECTOR = 20


def build_prompt() -> str:
    sectors_text = "\n".join(f"- {sector}" for sector in SECTORS)
    total_names = len(SECTORS) * NAMES_PER_SECTOR
    return (
        "You are naming specialist for B2B and consumer companies. "
        f"Generate exactly {total_names} unique, brandable company names: "
        f"{NAMES_PER_SECTOR} names for each listed sector.\n\n"
        "Sectors:\n"
        f"{sectors_text}\n\n"
        "Return only valid JSON with this exact schema:\n"
        '{"companies": [{"sector": "...", "name": "..."}]}\n'
        "Requirements:\n"
        f"- Exactly {NAMES_PER_SECTOR} company names per sector\n"
        "- Names should be concise (1-3 words), easy to pronounce, and distinctive\n"
        "- Avoid existing famous brands\n"
        "- No explanations outside JSON"
    )


def extract_names(raw_text: str) -> list[str]:
    data = parse_json_payload(raw_text)
    companies = data.get("companies", [])

    expected_total = len(SECTORS) * NAMES_PER_SECTOR
    if len(companies) != expected_total:
        raise ValueError(f"Expected {expected_total} companies, got {len(companies)}")

    valid_sectors = set(SECTORS)
    names_by_sector: dict[str, list[str]] = {sector: [] for sector in SECTORS}

    names: list[str] = []
    for item in companies:
        sector = str(item.get("sector", "")).strip()
        if sector not in valid_sectors:
            raise ValueError(f"Encountered unknown sector in response: {sector!r}")

        name = str(item.get("name", "")).strip()
        if not name:
            raise ValueError("Encountered an empty company name in response")

        names_by_sector[sector].append(name)
        names.append(name)

    for sector, sector_names in names_by_sector.items():
        if len(sector_names) != NAMES_PER_SECTOR:
            raise ValueError(
                f"Expected {NAMES_PER_SECTOR} names for sector {sector!r}, got {len(sector_names)}"
            )

        # Keep output deterministic and clean per sector: unique, in original order.
        deduped_sector_names = list(dict.fromkeys(sector_names))
        if len(deduped_sector_names) != NAMES_PER_SECTOR:
            raise ValueError(f"Model returned duplicate names within sector {sector!r}; try running again")

    # Keep output deterministic and clean: unique, in original order.
    deduped = list(dict.fromkeys(names))


    return deduped


def parse_json_payload(raw_text: str) -> dict:
    text = raw_text.strip()
    if not text:
        raise ValueError("Model returned an empty response")

    # Try direct parse first.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Common case: JSON wrapped in markdown code fences.
    fenced_match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text, flags=re.IGNORECASE)
    if fenced_match:
        try:
            return json.loads(fenced_match.group(1))
        except json.JSONDecodeError:
            pass

    # Fallback: parse the first balanced JSON object found in text.
    start = text.find("{")
    if start != -1:
        depth = 0
        in_string = False
        escape = False
        for i in range(start, len(text)):
            ch = text[i]

            if in_string:
                if escape:
                    escape = False
                elif ch == "\\":
                    escape = True
                elif ch == '"':
                    in_string = False
                continue

            if ch == '"':
                in_string = True
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[start : i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    preview = text[:300].replace("\n", "\\n")
    raise ValueError(
        "Could not parse JSON from model response. "
        f"Response preview: {preview}"
    )


def write_names(path: Path, names: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(names) + "\n", encoding="utf-8")


def generate_names(model: str) -> list[str]:
    client = OpenAI()
    response = client.responses.create(
        model=model,
        input=build_prompt(),
        temperature=0.9,
    )

    raw_text = response.output_text.strip()
    if not raw_text:
        raise RuntimeError("Received empty text response from OpenAI")

    return extract_names(raw_text)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            f"Generate {NAMES_PER_SECTOR} company names per sector "
            f"({len(SECTORS) * NAMES_PER_SECTOR} total) and save to disk."
        )
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("company_names.txt"),
        help="Output file for generated names (default: company_names.txt)",
    )
    parser.add_argument(
        "--model",
        default="gpt-4.1-mini",
        help="LLM model for name generation (default: gpt-4.1-mini)",
    )
    return parser.parse_args()


def main() -> None:
    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY is not set")

    args = parse_args()
    names = generate_names(args.model)
    write_names(args.output, names)

    print(f"Saved {len(names)} names to {args.output}")
    for idx, name in enumerate(names, start=1):
        print(f"{idx:02d}. {name}")


if __name__ == "__main__":
    main()
