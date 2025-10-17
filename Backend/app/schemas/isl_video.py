from pydantic import BaseModel
from typing import List, Optional

# -------------------------
# Request schemas
# -------------------------
class VideoCreate(BaseModel):
    book_code: str
    chapter: int
    video_id: str

class VideoUpdate(BaseModel):
    video_id: str

class BooksDelete(BaseModel):
    books: List[str]

# -------------------------
# Response schemas
# -------------------------
class MessageResponse(BaseModel):
    status: str
    message: str

class VideoResponse(BaseModel):
    book_code: str
    chapter: int
    video_id: str

class VideosListResponse(BaseModel):
    status: str
    videos: List[VideoResponse]
