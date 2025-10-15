import csv
import io
import zipfile
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from app.models.ISL_Video_model import ISLVideo
from app.models.ISL_VerseMarker_model import ISLVerseMarker
from app.models.book_model import Book


def upload_verse_markers_zip(db: Session, file: UploadFile):
    """
    Upload a ZIP file containing multiple CSV files for verse markers.
    
    FLOW:
    1. User uploads ZIP file (e.g., verse_markers.zip)
    2. ZIP contains CSVs: Genesis_1.csv, Exodus_2.csv, etc.
    3. Each CSV has: verse_number, time_marker columns
    4. Data is extracted and saved to PostgreSQL database
    5. ZIP file is NOT saved - only data goes to DB
    
    Expected CSV format:
    verse_number,time_marker
    1,00:00:18:23
    2,00:00:53:28
    """
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="File must be a ZIP archive")
    
    content = file.file.read()
    created_count = 0
    processed_files = []
    skipped_files = []
    errors = []
    
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zip_file:
            csv_files = [f for f in zip_file.namelist() 
                        if f.endswith('.csv') and not f.startswith('__MACOSX')]
            
            if not csv_files:
                raise HTTPException(
                    status_code=400, 
                    detail="No CSV files found in ZIP archive"
                )
            
            for filename in csv_files:
                try:
                    # Parse filename: Genesis_1.csv -> book_name=Genesis, chapter=1
                    base_name = filename.replace('.csv', '').split('/')[-1]
                    parts = base_name.rsplit('_', 1)
                    
                    if len(parts) != 2:
                        skipped_files.append(f"{filename} (invalid format)")
                        continue
                    
                    book_name = parts[0]
                    chapter = int(parts[1])
                    
                    # Step 1: Find Book by name or code
                    book = db.query(Book).filter(Book.book_name == book_name).first()
                    if not book:
                        book = db.query(Book).filter(Book.book_code == book_name.lower()).first()
                    
                    if not book:
                        skipped_files.append(f"{filename} (book '{book_name}' not found)")
                        continue
                    
                    # Step 2: Find ISL Video Chapter (this has the chapter_id we need)
                    isl_video = db.query(ISLVideo).filter(
                        ISLVideo.book_id == book.book_id,
                        ISLVideo.chapter == chapter
                    ).first()
                    
                    if not isl_video:
                        skipped_files.append(
                            f"{filename} (chapter {chapter} not found for book '{book_name}')"
                        )
                        continue
                    
                    # Step 3: Delete existing verse markers for this chapter
                    deleted = db.query(ISLVerseMarker).filter(
                        ISLVerseMarker.chapter_id == isl_video.chapter_id
                    ).delete(synchronize_session=False)
                    
                    # Step 4: Read CSV and insert new markers
                    csv_content = zip_file.read(filename).decode('utf-8')
                    csv_reader = csv.DictReader(io.StringIO(csv_content))
                    
                    verse_count = 0
                    for row in csv_reader:
                        # Handle different column name variations
                        verse_number = (
                            row.get('verse_number') or 
                            row.get('verse') or 
                            row.get('Verse Number')
                        )
                        time_marker = (
                            row.get('time_marker') or 
                            row.get('time') or 
                            row.get('Time Marker')
                        )
                        
                        if not verse_number or not time_marker:
                            continue
                        
                        try:
                            verse_num = int(str(verse_number).strip())
                            time_val = str(time_marker).strip()
                            
                            if verse_num > 0 and time_val:
                                new_marker = ISLVerseMarker(
                                    chapter_id=isl_video.chapter_id,
                                    verse_number=verse_num,
                                    time_marker=time_val
                                )
                                db.add(new_marker)
                                verse_count += 1
                        except (ValueError, TypeError):
                            continue
                    
                    if verse_count > 0:
                        created_count += verse_count
                        processed_files.append(
                            f"{book_name}_{chapter} ({verse_count} verses, {deleted} replaced)"
                        )
                    else:
                        skipped_files.append(f"{filename} (no valid verses found)")
                    
                except Exception as e:
                    errors.append(f"{filename}: {str(e)}")
                    continue
        
        # Commit all changes to database
        db.commit()
        
        response = {
            "message": "Verse markers ZIP processed",
            "files_processed": len(processed_files),
            "total_verses_created": created_count,
            "processed_files": processed_files
        }
        
        if skipped_files:
            response["skipped_files"] = skipped_files
        if errors:
            response["errors"] = errors
            
        return response
    
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing ZIP: {str(e)}")


def update_chapter_verse_markers(db: Session, file: UploadFile):
    """
    Update verse markers for a single chapter via CSV file.
    
    FLOW:
    1. User uploads single CSV file (e.g., Exodus_1.csv)
    2. Filename tells us: book name and chapter number
    3. CSV rows are read and saved to database
    4. Old verse markers for that chapter are DELETED first
    5. New markers are inserted
    
    Expected CSV format:
    verse_number,time_marker
    1,00:00:18:23
    2,00:00:53:28
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV file")
    
    # Parse filename
    try:
        base_name = file.filename.replace('.csv', '')
        parts = base_name.rsplit('_', 1)
        if len(parts) != 2:
            raise HTTPException(
                status_code=400, 
                detail="Filename must be in format: BookName_Chapter.csv (e.g., Genesis_1.csv)"
            )
        
        book_name = parts[0]
        chapter = int(parts[1])
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid chapter number in filename")
    
    # Step 1: Find book
    book = db.query(Book).filter(Book.book_name == book_name).first()
    if not book:
        book = db.query(Book).filter(Book.book_code == book_name.lower()).first()
    
    if not book:
        raise HTTPException(status_code=404, detail=f"Book not found: {book_name}")
    
    # Step 2: Find ISL video chapter
    isl_video = db.query(ISLVideo).filter(
        ISLVideo.book_id == book.book_id,
        ISLVideo.chapter == chapter
    ).first()
    
    if not isl_video:
        raise HTTPException(
            status_code=404, 
            detail=f"Video chapter not found for {book_name} chapter {chapter}. "
                   f"Please upload video data first using /video endpoints."
        )
    
    # Step 3: Delete existing markers for this chapter
    deleted_count = db.query(ISLVerseMarker).filter(
        ISLVerseMarker.chapter_id == isl_video.chapter_id
    ).delete(synchronize_session=False)
    
    # Step 4: Read CSV and insert new markers
    content = file.file.read().decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(content))
    
    created_count = 0
    for row in csv_reader:
        # Handle different column name variations
        verse_number = (
            row.get('verse_number') or 
            row.get('verse') or 
            row.get('Verse Number')
        )
        time_marker = (
            row.get('time_marker') or 
            row.get('time') or 
            row.get('Time Marker')
        )
        
        if not verse_number or not time_marker:
            continue
        
        try:
            verse_num = int(str(verse_number).strip())
            time_val = str(time_marker).strip()
            
            if verse_num > 0 and time_val:
                new_marker = ISLVerseMarker(
                    chapter_id=isl_video.chapter_id,
                    verse_number=verse_num,
                    time_marker=time_val
                )
                db.add(new_marker)
                created_count += 1
        except (ValueError, TypeError):
            continue
    
    if created_count == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid verse markers found in CSV. Check column names and data format."
        )
    
    db.commit()
    
    return {
        "message": f"Verse markers updated for {book_name} chapter {chapter}",
        "book": book_name,
        "chapter": chapter,
        "deleted": deleted_count,
        "created": created_count
    }


def delete_verse_markers_by_books(db: Session, books: list[str]):
    """
    Delete all verse markers for given book codes.
    
    FLOW:
    1. User sends: ["gen", "exo", "lev"]
    2. Find all Book records with these codes
    3. Find all ISL Video chapters for these books
    4. Delete all verse markers for those chapters
    5. Data is removed from database
    """
    if not books:
        raise HTTPException(status_code=400, detail="No books provided")
    
    # Step 1: Find all books
    book_records = db.query(Book).filter(Book.book_code.in_(books)).all()
    
    if not book_records:
        raise HTTPException(
            status_code=404, 
            detail=f"No books found with codes: {books}"
        )
    
    book_ids = [book.book_id for book in book_records]
    found_codes = [book.book_code for book in book_records]
    missing_codes = [code for code in books if code not in found_codes]
    
    # Step 2: Find all ISL video chapters for these books
    isl_videos = db.query(ISLVideo).filter(ISLVideo.book_id.in_(book_ids)).all()
    
    if not isl_videos:
        raise HTTPException(
            status_code=404,
            detail=f"No video chapters found for books: {found_codes}"
        )
    
    chapter_ids = [video.chapter_id for video in isl_videos]
    
    # Step 3: Delete verse markers
    deleted_count = db.query(ISLVerseMarker).filter(
        ISLVerseMarker.chapter_id.in_(chapter_ids)
    ).delete(synchronize_session=False)
    
    db.commit()
    
    response = {
        "message": f"Verse markers deleted for books: {found_codes}",
        "books_processed": len(book_records),
        "verses_deleted": deleted_count
    }
    
    if missing_codes:
        response["warning"] = f"Books not found: {missing_codes}"
    
    return response


def get_verse_markers_by_chapter(db: Session, book_code: str, chapter: int):
    """
    Get all verse markers for a specific chapter.
    """

    # 1️Find the book (case-insensitive)
    book = db.query(Book).filter(Book.book_code.ilike(book_code)).first()
    if not book:
        raise HTTPException(
            status_code=404,
            detail=f"Book not found with code: {book_code}"
        )

    # 2️ Find ISL video chapter
    isl_video = db.query(ISLVideo).filter(
    ISLVideo.book_id == book.book_id,
    ISLVideo.chapter == chapter
).first()


    if not isl_video:
        raise HTTPException(
            status_code=404,
            detail=f"Chapter {chapter} not found for book '{book_code}'. Please upload video data first."
        )

    # 3️ Get verse markers
    markers = db.query(ISLVerseMarker).filter(
        ISLVerseMarker.chapter_id == isl_video.chapter_id
    ).order_by(ISLVerseMarker.verse_number).all()

    if not markers:
        return {
            "book_code": book_code.upper(),
            "book_name": book.book_name,
            "chapter": chapter,
            "total_verses": 0,
            "markers": [],
            "message": "No verse markers found for this chapter"
        }

    return {
        "book_code": book_code.upper(),
        "book_name": book.book_name,
        "chapter": chapter,
        "video_id": isl_video.video_id,
        "total_verses": len(markers),
        "markers": [
            {
                "verse_id": str(marker.verse_id),
                "verse_number": marker.verse_number,
                "time_marker": marker.time_marker,
                "created_at": marker.created_at.isoformat() if marker.created_at else None
            }
            for marker in markers
        ]
    }
