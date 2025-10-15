import csv
import io
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from app.models.ISL_Video_model import ISLVideo  
from app.models.book_model import Book

def upload_video(db: Session, book_code: str, chapter: int, video_id: str):
    """Create a single video entry"""
    book = db.query(Book).filter(Book.book_code == book_code).first()
    if not book:
        raise HTTPException(status_code=404, detail=f"Book not found for code: {book_code}")
    
    # Check if video already exists
    existing = (
        db.query(ISLVideo)
        .filter(ISLVideo.book_id == book.book_id, ISLVideo.chapter == chapter)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Video already exists for book {book_code} chapter {chapter}. Use update endpoint instead."
        )
    
    new_video = ISLVideo(book_id=book.book_id, chapter=chapter, video_id=video_id)
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    return new_video
def update_video(db: Session, book_code: str, chapter: int, video_id: str):
    """Update an existing video"""
    book = db.query(Book).filter(Book.book_code == book_code).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    video = db.query(ISLVideo).filter(
        ISLVideo.book_id == book.book_id,
        ISLVideo.chapter == chapter
    ).first()

    if not video:
        raise HTTPException(
            status_code=404, 
            detail=f"Video not found for book {book_code} chapter {chapter}. Use create endpoint instead."
        )

    video.video_id = video_id
    db.commit()
    db.refresh(video)
    return video

def delete_videos_by_books(db: Session, books: list[str]):
    """Delete all videos for given book codes"""
    book_ids = [
        b.book_id for b in db.query(Book).filter(Book.book_code.in_(books)).all()
    ]
    deleted_count = db.query(ISLVideo).filter(ISLVideo.book_id.in_(book_ids)).delete(synchronize_session=False)
    db.commit()
    return {
        "message": f"Videos deleted for books: {books}",
        "deleted_count": deleted_count
    }

def delete_single_video(db: Session, book_code: str, chapter: int):
    """Delete a specific video by book code and chapter"""
    book = db.query(Book).filter(Book.book_code == book_code).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    video = db.query(ISLVideo).filter(
        ISLVideo.book_id == book.book_id,
        ISLVideo.chapter == chapter
    ).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    db.delete(video)
    db.commit()
    return {"message": f"Video deleted for book {book_code}, chapter {chapter}"}

def get_videos_by_book(db: Session, book_code: str):
    """Get all videos for a specific book"""
    book = db.query(Book).filter(Book.book_code == book_code).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    videos = db.query(ISLVideo).filter(ISLVideo.book_id == book.book_id).order_by(ISLVideo.chapter).all()
    return videos