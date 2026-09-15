from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, JSON
from database.connection import Base

class Finding(Base):
    __tablename__ = "findings"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(Integer, ForeignKey("evidence.id"), nullable=False)
    
    channel_id = Column(Integer, default=1)
    channel_name = Column(String, nullable=True)
    
    finding_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    
    timestamp_offset = Column(String, nullable=False)
    timecode_real = Column(String, nullable=True)
    timeline_percentage = Column(Float, nullable=True)
    
    severity = Column(String, default="Low")
    confidence_score = Column(Float, default=95.0)
    add_to_report = Column(Boolean, default=True)
    
    description = Column(String, nullable=True)
    technical_details = Column(String, nullable=True)
    forensic_impact = Column(String, nullable=True)
