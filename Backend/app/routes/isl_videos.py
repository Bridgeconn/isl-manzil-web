from fastapi import APIRouter, Depends, UploadFile, Form, Body
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.crud import isl_videos

router = APIRouter(prefix="/video", tags=["ISL Videos"])

# Pydantic models for request validation
class VideoCreate(BaseModel):
    book_code: str
    chapter: int
    video_id: str

class VideoUpdate(BaseModel):
    video_id: str

class BooksDelete(BaseModel):
    books: List[str]


@router.post("/upload", status_code=201)
def upload_video(video: VideoCreate, db: Session = Depends(get_db)):
    """Create a single video entry"""
    return isl_videos.upload_video(db, video.book_code, video.chapter, video.video_id)


@router.put("/{book_code}/{chapter}")
def update_video(
    book_code: str, 
    chapter: int, 
    video: VideoUpdate,
    db: Session = Depends(get_db)
):
    """Update video_id for a specific book and chapter"""
    return isl_videos.update_video(db, book_code, chapter, video.video_id)


@router.delete("/bulk")
def delete_videos_by_books(data: BooksDelete, db: Session = Depends(get_db)):
    """Delete all videos for specified book codes"""
    return isl_videos.delete_videos_by_books(db, data.books)


@router.delete("/{book_code}/{chapter}")
def delete_video(book_code: str, chapter: int, db: Session = Depends(get_db)):
    """Delete a specific video by book code and chapter"""
    return isl_videos.delete_single_video(db, book_code, chapter)


@router.get("/{book_code}")
def get_videos_for_book(book_code: str, db: Session = Depends(get_db)):
    """Get all videos for a specific book"""
    return isl_videos.get_videos_by_book(db, book_code)