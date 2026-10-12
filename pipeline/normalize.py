"""Deterministic offline baseline normalization; GitHub Actions only."""
import os
import json
from pathlib import Path
from models import QualifiedIntermediary, CostSegProvider, StateRules
ROOT = Path(__file__).resolve().parents[1]
MODELS = {"qi": QualifiedIntermediary, "costseg": CostSegProvider, "states": StateRules}

def normalize():
    if os.environ.get("GITHUB_ACTIONS") != "true":
        raise RuntimeError("Remote-only: normalization requires GitHub Actions")
    staged = {}
    for kind, model in MODELS.items():
        records = json.loads((ROOT / "data/raw" / f"{kind}.json").read_text())
        seen = set()
        staged[kind] = {}
        for record in records:
            validated = model.model_validate(record)
            key = getattr(validated, "entity_id", None) or validated.state_code.lower()
            if key in seen:
                raise ValueError(f"Duplicate {kind} ID: {key}")
            seen.add(key)
            staged[kind][key] = validated.model_dump(mode="json")
    # Validate everything before writing anything.
    for kind, records in staged.items():
        folder = ROOT / "data/normalized" / kind
        folder.mkdir(parents=True, exist_ok=True)
        for path in folder.glob("*.json"):
            if path.stem not in records:
                path.unlink()
        for key, record in sorted(records.items()):
            path = folder / f"{key}.json"
            content = json.dumps(record, indent=2, ensure_ascii=False) + "\n"
            temp = path.with_suffix(".tmp")
            temp.write_text(content)
            temp.replace(path)

if __name__ == "__main__":
    normalize()
