from sqlalchemy import Column, String, Integer
from app.database import Base

class Book(Base):
    __tablename__ = "books"

    book_id = Column(Integer, primary_key=True)  
    book_code = Column(String(10), unique=True, nullable=False)
    book_name = Column(String(100), nullable=False)
    testament = Column(String(2), nullable=False)  # OT or NT
    max_chapter = Column(Integer, nullable=False)
