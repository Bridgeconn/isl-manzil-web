from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.database import get_db
from app.crud import isl_verse_markers
from app.crud.isl_verse_markers import get_verse_markers_by_chapter


router = APIRouter(prefix="/verse_markers", tags=["ISL Verse Markers"])


class BooksDelete(BaseModel):
    books: List[str]
    
    class Config:
        json_schema_extra = {
            "example": {
                "books": ["gen", "exo", "lev"]
            }
        }


@router.post("/upload_zip")
def upload_verse_markers_zip(
    file: UploadFile = File(..., description="ZIP file containing verse marker CSV files"),
    db: Session = Depends(get_db)
):
    """
    Upload a ZIP file with multiple verse marker CSV files.
    
    **How it works:**
    1. You upload a ZIP file (verse_markers.zip)
    2. ZIP contains CSVs like: Genesis_1.csv, Exodus_2.csv
    3. Data is extracted and saved to PostgreSQL database
    4. ZIP file is NOT saved - only data goes to database
    
    **Expected CSV format:**
    ```csv
    verse_number,time_marker
    1,00:00:18:23
    2,00:00:53:28
    3,00:01:07:28
    ```
    
    **Filename format:** BookName_Chapter.csv (e.g., Genesis_1.csv)
    """
    return isl_verse_markers.upload_verse_markers_zip(db, file)


@router.put("/update_chapter")
def update_chapter_verse_markers(
    file: UploadFile = File(..., description="CSV file with verse markers"),
    db: Session = Depends(get_db)
):
    """
    Update verse markers for a single chapter.
    
    **How it works:**
    1. Upload CSV file named: BookName_Chapter.csv (e.g., Exodus_1.csv)
    2. Old verse markers for that chapter are DELETED
    3. New markers from CSV are inserted into database
    
    **Expected CSV format:**
    ```csv
    verse_number,time_marker
    1,00:00:18:23
    2,00:00:53:28
    ```
    
     This REPLACES all existing markers for the chapter!
    """
    return isl_verse_markers.update_chapter_verse_markers(db, file)


@router.delete("/delete_books")
def delete_verse_markers_by_books(
    data: BooksDelete,
    db: Session = Depends(get_db)
):
    """
    Delete all verse markers for specified book codes.
    
    **How it works:**
    1. You send book codes: ["gen", "exo"]
    2. System finds all chapters for these books
    3. All verse markers are deleted from database
    
    **Example request body:**
    ```json
    {
        "books": ["gen", "exo", "lev"]
    }
    ```
    """
    return isl_verse_markers.delete_verse_markers_by_books(db, data.books)


@router.get("/chapter/{book_code_chapter}")
def get_verse_markers_for_chapter(book_code_chapter: str, db: Session = Depends(get_db)):
    parts = book_code_chapter.strip().split("_")
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid format. Use BOOKCODE_CHAPTER (e.g., GEN_1)")

    book_code, chapter_str = parts[0], parts[1]
    if not chapter_str.isdigit():
        raise HTTPException(status_code=400, detail="Chapter must be numeric.")

    return get_verse_markers_by_chapter(db, book_code.upper(), int(chapter_str))
