from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.crud import isl_videos
from app.schemas import isl_video as schemas

router = APIRouter(prefix="/video", tags=["ISL Videos"])

@router.post("/upload", response_model=schemas.MessageResponse, status_code=201)
def upload_video(video: schemas.VideoCreate, db: Session = Depends(get_db)):
    try:
        isl_videos.upload_video(db, video.book_code, video.chapter, video.video_id)
        return {"status": "success", "message": f"Video uploaded for {video.book_code} chapter {video.chapter}"}
    except HTTPException as e:
        raise e

@router.put("/{book_code}/{chapter}", response_model=schemas.MessageResponse)
def update_video(book_code: str, chapter: int, video: schemas.VideoUpdate, db: Session = Depends(get_db)):
    try:
        isl_videos.update_video(db, book_code, chapter, video.video_id)
        return {"status": "success", "message": f"Video updated for {book_code} chapter {chapter}"}
    except HTTPException as e:
        raise e

@router.delete("/bulk", response_model=schemas.MessageResponse)
def delete_videos_by_books(data: schemas.BooksDelete, db: Session = Depends(get_db)):
    try:
        result = isl_videos.delete_videos_by_books(db, data.books)
        return {"status": "success", "message": f"{result['deleted_count']} videos deleted for books: {', '.join(data.books)}"}
    except HTTPException as e:
        raise e

@router.delete("/{book_code}/{chapter}", response_model=schemas.MessageResponse)
def delete_video(book_code: str, chapter: int, db: Session = Depends(get_db)):
    try:
        isl_videos.delete_single_video(db, book_code, chapter)
        return {"status": "success", "message": f"Video deleted for {book_code} chapter {chapter}"}
    except HTTPException as e:
        raise e

@router.get("/{book_code}", response_model=schemas.VideosListResponse)
def get_videos_for_book(book_code: str, db: Session = Depends(get_db)):
    try:
        videos = isl_videos.get_videos_by_book(db, book_code)
        videos_list = [
            schemas.VideoResponse(book_code=book_code, chapter=v.chapter, video_id=v.video_id)
            for v in videos
        ]
        return {"status": "successfully fetched", "videos": videos_list}
    except HTTPException as e:
        raise e
