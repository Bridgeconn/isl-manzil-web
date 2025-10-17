from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import isl_verse_markers
from app.crud.isl_verse_markers import get_verse_markers_by_chapter
from app.schemas.isl_verse_marker_schema import BooksDelete, VerseMarkerResponse

router = APIRouter(prefix="/verse_markers", tags=["ISL Verse Markers"])


@router.post("/upload_zip", response_model=VerseMarkerResponse, status_code=201)
def upload_verse_markers_zip(
    file: UploadFile = File(..., description="ZIP file containing verse marker CSV files"),
    db: Session = Depends(get_db)
):
    """
    📦 Upload a ZIP file containing multiple verse marker CSV files.

    **Expected CSV format:**
    ```csv
    verse_number,time_marker
    1,00:00:18:23
    2,00:00:53:28
    3,00:01:07:28
    ```

    **Filename format:** `BookName_Chapter.csv` (e.g., `Genesis_1.csv`)
    """
    result = isl_verse_markers.upload_verse_markers_zip(db, file)
    return VerseMarkerResponse(
        status="success",
        message="Verse markers ZIP processed successfully.",
        data=result
    )


@router.put("/update_chapter", response_model=VerseMarkerResponse)
def update_chapter_verse_markers(
    file: UploadFile = File(..., description="CSV file with verse markers for a chapter"),
    db: Session = Depends(get_db)
):
    """
    📝 Update verse markers for a single chapter.
    
    - Old markers for the chapter are **deleted**
    - New markers are **inserted**
    - CSV filename must be in format: `BookName_Chapter.csv`
    """
    result = isl_verse_markers.update_chapter_verse_markers(db, file)
    return VerseMarkerResponse(
        status="success",
        message="Chapter verse markers updated successfully.",
        data=result
    )


@router.delete("/delete_books", response_model=VerseMarkerResponse)
def delete_verse_markers_by_books(data: BooksDelete, db: Session = Depends(get_db)):
    """
    🗑️ Delete all verse markers for specified book codes.

    Example request:
    ```json
    {
        "books": ["GEN", "EXO", "LEV"]
    }
    ```
    """
    result = isl_verse_markers.delete_verse_markers_by_books(db, data.books)
    return VerseMarkerResponse(
        status="success",
        message="Verse markers deleted for specified books.",
        data=result
    )


@router.get("/chapter/{book_code_chapter}", response_model=VerseMarkerResponse)
def get_verse_markers_for_chapter(book_code_chapter: str, db: Session = Depends(get_db)):
    """
    📖 Get verse markers for a specific chapter.
    
    **Format:** `BOOKCODE_CHAPTER` (e.g., `GEN_1`)
    """
    parts = book_code_chapter.strip().split("_")
    if len(parts) != 2:
        raise HTTPException(status_code=400, detail="Invalid format. Use BOOKCODE_CHAPTER (e.g., GEN_1)")

    book_code, chapter_str = parts[0], parts[1]
    if not chapter_str.isdigit():
        raise HTTPException(status_code=400, detail="Chapter must be numeric.")

    result = get_verse_markers_by_chapter(db, book_code.upper(), int(chapter_str))
    return VerseMarkerResponse(
        status="success",
        message=f"Verse markers for {book_code.upper()} {chapter_str} fetched successfully.",
        data=result
    )
