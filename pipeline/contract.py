"""Generate acceptance fixtures and schema keys for remote Zod parity checks."""
import json
import os
from copy import deepcopy
from normalize import ROOT, MODELS
if os.environ.get("GITHUB_ACTIONS") != "true":
    raise RuntimeError("Remote-only contract verification")
cases = []
fields = {}
for kind, model in MODELS.items():
    fields[kind] = sorted(model.model_fields)
    for file in sorted((ROOT / "data/normalized" / kind).glob("*.json")):
        record = json.loads(file.read_text())
        model.model_validate(record)
        variants = [record, {**record, "unexpected": True}]
        for key in record:
            missing = deepcopy(record)
            del missing[key]
            variants.append(missing)
        variants.extend([
            {**record, "reviewed_on": "2026-02-30"},
            {**record, "sources": ["http://insecure.example"]},
            {**record, "verification_status": "invented"},
        ])
        if kind == "qi":
            variants.extend([{**record, "coverage_type": "Local"},
                             {**record, "bonded_amount_usd": -1},
                             {**record, "verified_partner": "true"},
                             {**record, "base_fee_range": {"minimum_usd": 500, "maximum_usd": 100}},
                             {**record, "base_fee_range": {"minimum_usd": 100, "maximum_usd": 500}}])
        elif kind == "costseg":
            variants.extend([{**record, "partner_tier": "gold"},
                             {**record, "coverage": []},
                             {**record, "audit_defense_included": "true"}])
        else:
            variants.extend([{**record, "capital_gains_tax_rate": 1.1},
                             {**record, "state_code": "California"}])
        for candidate in variants:
            try:
                model.model_validate(candidate)
                accepted = True
            except ValueError:
                accepted = False
            cases.append({"kind": kind, "record": candidate, "accepted": accepted})
print(json.dumps({"fields": fields, "cases": cases}))
