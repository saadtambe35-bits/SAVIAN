from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlmodel import Field, SQLModel
from app.core.database import Base

def get_current_utc_time() -> datetime:
    return datetime.now(timezone.utc)

class AuditLogModel(Base):
    __tablename__ = "rdso_audit_ledger"

    id = Column(Integer, primary_key=True, index=True)
    token_id = Column(String(100), unique=True, index=True, nullable=False)
    demand_code = Column(String(50), index=True, nullable=False)
    event_type = Column(String(50), nullable=False)  # LINE_CLEAR_GRANTED, KAVACH_SIL4_CHECK, COALIGN_HARMONIZED
    kavach_hash = Column(String(128), nullable=False)
    section = Column(String(50), nullable=False)
    operator = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    payload_snapshot = Column(Text, nullable=True)


class AuditLog(SQLModel, table=True):
    __tablename__ = "lifecycle_audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    demand_id: int = Field(default=0, index=True)
    demand_code: str = Field(index=True)
    from_stage: str = Field(description="Previous lifecycle stage")
    to_stage: str = Field(description="New lifecycle stage")
    actor_id: str = Field(description="Actor ID")
    actor_role: str = Field(description="Operational role")
    timestamp: datetime = Field(default_factory=get_current_utc_time)
    justification: str = Field(description="Operational justification")
    delta_json: str = Field(description="JSON snapshot of transition delta")

