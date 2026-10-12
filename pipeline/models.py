"""Contract mirrored in site/src/content/config.ts. Execute only on Actions."""
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import date
import re

class Evidence(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)
    sources: list[str] = Field(min_length=1)
    reviewed_on: str
    verification_status: Literal["baseline", "verified"]
    @field_validator("sources")
    @classmethod
    def https_sources(cls, value):
        if any(not x.startswith("https://") or not x[8:].split("/")[0] for x in value):
            raise ValueError("HTTPS source required")
        return value
    @field_validator("reviewed_on")
    @classmethod
    def iso_date(cls, value):
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            raise ValueError("ISO date required")
        date.fromisoformat(value)
        return value

class FeeRange(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    minimum_usd: float = Field(ge=0)
    maximum_usd: float = Field(ge=0)
    @field_validator("maximum_usd")
    @classmethod
    def ordered(cls, value, info):
        if value < info.data.get("minimum_usd", 0):
            raise ValueError("maximum must be >= minimum")
        return value

class QualifiedIntermediary(Evidence):
    entity_id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: str = Field(min_length=1)
    state: str = Field(pattern=r"^[A-Z]{2}$")
    coverage_type: Literal["National", "Regional"]
    bonded_amount_usd: float | None = Field(ge=0)
    escrow_type: str | None
    services: list[Literal["forward", "reverse", "improvement", "dst"]] | None
    base_fee_range: FeeRange | None
    website: str
    verified_partner: bool
    parent_group: str | None
    @field_validator("website")
    @classmethod
    def https_url(cls, value):
        if not value.startswith("https://") or not value[8:].split("/")[0]:
            raise ValueError("HTTPS URL required")
        return value

class CostSegProvider(Evidence):
    entity_id: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    name: str = Field(min_length=1)
    coverage: list[str] = Field(min_length=1)
    accredited_engineers: bool | None
    audit_defense_included: bool | None
    typical_fee_range: FeeRange | None
    property_specialties: list[str] | None
    contact_endpoint: str
    partner_tier: Literal["anchor", "hybrid", "standard"] | None
    @field_validator("contact_endpoint")
    @classmethod
    def https_url(cls, value):
        if not value.startswith("https://") or not value[8:].split("/")[0]:
            raise ValueError("HTTPS URL required")
        return value

class StateRules(Evidence):
    state_code: str = Field(pattern=r"^[A-Z]{2}$")
    state_name: str = Field(min_length=1)
    capital_gains_tax_rate: float | None = Field(ge=0, le=1)
    clawback_rules: bool
    clawback_form: str | None
    key_statutory_notes: list[str] = Field(min_length=1)
    rate_description: str = Field(min_length=1)
