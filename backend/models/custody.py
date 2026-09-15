from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from database.connection import Base

class CustodyEvent(Base):
    __tablename__ = "custody_events"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    
    # Optional evidence link
    evidence_id = Column(String, nullable=True)
    evidence_name = Column(String, nullable=True)

    action = Column(String, nullable=False)
    action_label = Column(String, nullable=False)
    
    actor = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    
    timestamp = Column(String, nullable=False)
    
    previous_hash = Column(String, nullable=False)
    current_hash = Column(String, nullable=False)
    
    payload_data = Column(JSON, nullable=True)
    
    is_tampered = Column(Boolean, default=False)
