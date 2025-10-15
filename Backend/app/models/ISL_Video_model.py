from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class ISLVideo(Base):
    __tablename__ = "isl_video"

    chapter_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # book_id references the varchar field in books
    book_id = Column(String(10), ForeignKey("books.book_id"), nullable=False)
    chapter = Column(Integer, nullable=False)
    video_id = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("book_id", "chapter", name="uq_book_chapter"),
    )
