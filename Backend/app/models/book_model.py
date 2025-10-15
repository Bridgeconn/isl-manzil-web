from sqlalchemy import Column, String, Integer
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class Book(Base):
    __tablename__ = "books"

    # Book IDs like '1'...'66' from CSV, not UUID
    book_id = Column(String(10), primary_key=True)  
    book_code = Column(String(10), unique=True, nullable=False)
    book_name = Column(String(100), nullable=False)
    testament = Column(String(2), nullable=False)  # OT or NT
    max_chapter = Column(Integer, nullable=False)
