from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class ISLVerseMarker(Base):
    __tablename__ = "isl_verse_marker"

    verse_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("isl_video.chapter_id"), nullable=False)
    verse_number = Column(Integer, nullable=False)
    time_marker = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
