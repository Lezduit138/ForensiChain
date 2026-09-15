from sqlalchemy import Column, Integer, String, ForeignKey

from database.connection import Base


class Evidence(Base):
    __tablename__ = "evidence"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, index=True)

    case_id = Column(Integer, ForeignKey("cases.id"))

    file_name = Column(String, nullable=False)

    file_path = Column(String, nullable=False)

    file_type = Column(String)

    file_hash = Column(String, nullable=False)

    status = Column(String, default="Uploaded")