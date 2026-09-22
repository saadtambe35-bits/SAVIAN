from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


def get_current_utc_time() -> datetime:
    return datetime.now(timezone.utc)


class BlockDemand(SQLModel, table=True):
    __tablename__ = "block_demand"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_code: str = Field(
        unique=True,
        index=True,
        description="Unique business demand code, e.g. BDMS/WCR/BPL/2026/08/0492",
    )
    source_system: str = Field(
        description="Originating system: TMS | SMMS | TDMS",
    )
    department: str = Field(
        description="Railway engineering department: P_WAY | OHE | S_AND_T",
    )
    section_from: str = Field(
        description="Originating section station code, e.g. BHS",
    )
    section_to: str = Field(
        description="Terminating section station code, e.g. DWG",
    )
    start_km: float = Field(
        description="Chainage start kilometer",
    )
    end_km: float = Field(
        description="Chainage end kilometer",
    )
    requested_date: str = Field(
        description="Requested maintenance block date in ISO format YYYY-MM-DD",
    )
    requested_start_minutes: int = Field(
        description="Requested start time in minutes from midnight (0-1439)",
    )
    requested_end_minutes: int = Field(
        description="Requested end time in minutes from midnight (0-1439)",
    )
    required_minutes: int = Field(
        description="Minimum block duration required in minutes",
    )
    activity_description: str = Field(
        description="Detailed description of planned maintenance work",
    )
    machinery_type: Optional[str] = Field(
        default=None,
        description="Type of machinery needed, e.g. CSM-924, BCM-machine, Tower wagon",
    )
    machinery_id: Optional[str] = Field(
        default=None,
        description="Specific machinery asset registration or identifier",
    )
    status: str = Field(
        default="PROPOSED",
        description="Status: PROPOSED | REVIEWED | APPROVED | EXECUTED | CLOSED | REJECTED",
    )
    trust_score: float = Field(
        default=1.0,
        description="Data confidence score from source system (0.0 to 1.0)",
    )
    severity_tier: str = Field(
        default="MEDIUM",
        description="Severity classification: CRITICAL | HIGH | MEDIUM | LOW",
    )
    priority_weight: int = Field(
        default=5,
        description="Numerical priority weight for optimization solver",
    )
    power_block_required: bool = Field(
        default=False,
        description="Whether traction power shutdown (OHE isolation) is required",
    )
    disconnection_required: bool = Field(
        default=False,
        description="Whether signalling/telecom disconnection memo is required",
    )
    speed_restriction_kmph: Optional[int] = Field(
        default=None,
        description="Temporary speed restriction (TSR) in km/h post-work if applicable",
    )
    created_at: datetime = Field(
        default_factory=get_current_utc_time,
        description="Timestamp when demand was created or ingested",
    )
