from pydantic import BaseModel
from typing import Optional
from datetime import date


class CaseCreate(BaseModel):
    fir_number: str
    case_name: str
    description: str
    police_station: str
    jurisdiction: str
    investigating_officer: str
    forensic_examiner: str
    incident_date: date
    date_opened: date
    priority: str


class CaseUpdate(BaseModel):
    fir_number: Optional[str] = None
    case_name: Optional[str] = None
    description: Optional[str] = None
    police_station: Optional[str] = None
    jurisdiction: Optional[str] = None
    investigating_officer: Optional[str] = None
    forensic_examiner: Optional[str] = None
    incident_date: Optional[date] = None
    date_opened: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class CaseResponse(BaseModel):
    id: int
    fir_number: str
    case_name: str
    description: str
    police_station: str
    jurisdiction: str
    investigating_officer: str
    forensic_examiner: str
    incident_date: Optional[date] = None
    date_opened: Optional[date] = None
    priority: str
    status: str

    model_config = {"from_attributes": True}