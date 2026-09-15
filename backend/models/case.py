from sqlalchemy import Column, Integer, String, Text, Date

from database.connection import Base


class Case(Base):
    __tablename__ = "cases"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)

    # Case identification
    fir_number = Column(String, unique=True, nullable=False)
    case_name = Column(String, nullable=False)
    description = Column(Text, nullable=False)

    # Case details
    police_station = Column(String, nullable=False)
    jurisdiction = Column(String, nullable=False)
    investigating_officer = Column(String, nullable=False)
    forensic_examiner = Column(String, nullable=False)

    # Dates
    incident_date = Column(Date, nullable=False)
    date_opened = Column(Date, nullable=False)

    # Case management
    priority = Column(String, nullable=False)
    status = Column(String, default="Open", nullable=False)