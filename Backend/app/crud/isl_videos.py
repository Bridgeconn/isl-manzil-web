from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app.models.ISL_Video_model import ISLVideo  
from app.models.book_model import Book

def upload_video(db: Session, book_code: str, chapter: int, video_id: str):
    """Create a single video entry (case-insensitive book lookup)"""
    try:
        book = db.query(Book).filter(func.lower(Book.book_code) == book_code.lower()).first()
        if not book:
            raise HTTPException(status_code=404, detail=f"Book not found for code: {book_code}")

        existing = db.query(ISLVideo).filter(
            ISLVideo.book_id == book.book_id,
            ISLVideo.chapter == chapter
        ).first()
        if existing:
            raise HTTPException(
                status_code=400, 
                detail=f"Video already exists for book {book_code.upper()} chapter {chapter}. Use update endpoint instead."
            )

        new_video = ISLVideo(book_id=book.book_id, chapter=chapter, video_id=video_id)
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        return new_video

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading video: {str(e)}")


def update_video(db: Session, book_code: str, chapter: int, video_id: str):
    """Update an existing video (case-insensitive book lookup)"""
    try:
        book = db.query(Book).filter(func.lower(Book.book_code) == book_code.lower()).first()
        if not book:
            raise HTTPException(status_code=404, detail=f"Book not found for code: {book_code}")

        video = db.query(ISLVideo).filter(
            ISLVideo.book_id == book.book_id,
            ISLVideo.chapter == chapter
        ).first()

        if not video:
            raise HTTPException(
                status_code=404, 
                detail=f"Video not found for book {book_code.upper()} chapter {chapter}. Use create endpoint instead."
            )

        video.video_id = video_id
        db.commit()
        db.refresh(video)
        return video

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating video: {str(e)}")


def delete_videos_by_books(db: Session, books: list[str]):
    """Delete all videos for given book codes (case-insensitive)"""
    try:
        # Normalize book codes to lowercase and compare case-insensitively
        lowered_books = [b.lower() for b in books]
        book_ids = [
            b.book_id for b in db.query(Book).filter(func.lower(Book.book_code).in_(lowered_books)).all()
        ]
        if not book_ids:
            raise HTTPException(status_code=404, detail=f"No matching books found for codes: {books}")

        deleted_count = db.query(ISLVideo).filter(ISLVideo.book_id.in_(book_ids)).delete(synchronize_session=False)
        db.commit()
        return {"deleted_videos": deleted_count}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting videos: {str(e)}")


def delete_single_video(db: Session, book_code: str, chapter: int):
    """Delete a specific video by book code and chapter (case-insensitive)"""
    try:
        book = db.query(Book).filter(func.lower(Book.book_code) == book_code.lower()).first()
        if not book:
            raise HTTPException(status_code=404, detail=f"Book not found for code: {book_code}")
        
        video = db.query(ISLVideo).filter(
            ISLVideo.book_id == book.book_id,
            ISLVideo.chapter == chapter
        ).first()
        
        if not video:
            raise HTTPException(status_code=404, detail=f"Video not found for {book_code.upper()} chapter {chapter}")
        
        db.delete(video)
        db.commit()
        return {"status": "success", "message": f"Video deleted for {book_code.upper()} chapter {chapter}"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting video: {str(e)}")


def get_videos_by_book(db: Session, book_code: str):
    """Get all videos for a specific book (case-insensitive)"""
    try:
        book = db.query(Book).filter(func.lower(Book.book_code) == book_code.lower()).first()
        if not book:
            raise HTTPException(status_code=404, detail=f"Book not found for code: {book_code}")

        videos = db.query(ISLVideo).filter(
            ISLVideo.book_id == book.book_id
        ).order_by(ISLVideo.chapter).all()
        return videos

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching videos: {str(e)}")
