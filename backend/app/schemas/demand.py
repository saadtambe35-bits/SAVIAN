from pydantic import BaseModel, model_validator
from typing import Optional

class DemandBase(BaseModel):
    demand_code: str
    source_system: str
    department: str
    section_from: str
    section_to: str
    start_km: float
    end_km: float
    requested_date: str
    requested_start_minutes: int
    requested_end_minutes: int
    required_minutes: int
    activity_description: str
    machinery_type: str
    machinery_id: Optional[str] = None
    status: str = "PROPOSED"
    trust_score: float = 90.0
    severity_tier: str = "HIGH"
    priority_weight: float = 7.5
    power_block_required: bool = False
    disconnection_required: bool = False

    @model_validator(mode="after")
    def validate_spatial_and_temporal_boundaries(self):
        if self.start_km < 0.0:
            raise ValueError("start_km cannot be negative")
        if self.end_km < 0.0:
            raise ValueError("end_km cannot be negative")
        if self.start_km >= self.end_km:
            raise ValueError(f"start_km ({self.start_km}) must be strictly less than end_km ({self.end_km})")
        if self.requested_start_minutes < 0:
            raise ValueError("requested_start_minutes cannot be negative")
        if self.requested_end_minutes > 1440:
            raise ValueError("requested_end_minutes cannot exceed 1440 (24:00)")
        if self.requested_start_minutes >= self.requested_end_minutes:
            raise ValueError(f"requested_start_minutes ({self.requested_start_minutes}) must be less than requested_end_minutes ({self.requested_end_minutes})")
        if self.required_minutes <= 0:
            raise ValueError("required_minutes must be greater than zero")
        window_duration = self.requested_end_minutes - self.requested_start_minutes
        if self.required_minutes > window_duration:
            raise ValueError(f"required_minutes ({self.required_minutes}) cannot exceed requested window duration ({window_duration} min)")
        return self

class DemandCreate(DemandBase):
    pass

class DemandUpdate(BaseModel):
    status: Optional[str] = None
    activity_description: Optional[str] = None
    required_minutes: Optional[int] = None
    requested_start_minutes: Optional[int] = None
    requested_end_minutes: Optional[int] = None
    trust_score: Optional[float] = None
    severity_tier: Optional[str] = None

    @model_validator(mode="after")
    def validate_update_bounds(self):
        if self.required_minutes is not None and self.required_minutes <= 0:
            raise ValueError("required_minutes must be greater than zero")
        if self.requested_start_minutes is not None and self.requested_end_minutes is not None:
            if self.requested_start_minutes >= self.requested_end_minutes:
                raise ValueError(f"requested_start_minutes ({self.requested_start_minutes}) must be less than requested_end_minutes ({self.requested_end_minutes})")
            if self.required_minutes is not None and self.required_minutes > (self.requested_end_minutes - self.requested_start_minutes):
                raise ValueError("required_minutes cannot exceed requested window duration")
        return self

class DemandResponse(DemandBase):
    id: int

    class Config:
        from_attributes = True

