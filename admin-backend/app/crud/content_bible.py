"""CRUD operations for the Bible."""
from typing import Dict, List,Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import UploadFile
import db_models
import schema
from schema import BibleEntrySchema
from custom_exceptions import (
    AlreadyExistsException,
    NotAvailableException,
    BadRequestException,
    TypeException,
)
from crud.utils import (
    extract_book_code_from_usfm,
    _parse_usfm_to_usj,
    _count_chapters,
    parse_usfm_to_clean_verses,
    # touch_resource,
    _clean_build_navigation,
    _compute_previous_verse,
    _compute_next_verse,

)

def validate_chapter_count(db_session: Session,
    book_code: str, chapter_count: int):
    """Validate chapter count against DB table"""
    book = (
        db_session.query(db_models.BookLookup)
        .filter(db_models.BookLookup.book_code == book_code.lower())
        .first()
    )

    if not book:
        raise NotAvailableException(detail=f"Book {book_code} not found")

    if chapter_count > book.chapter_count:
        raise BadRequestException(
            detail=(
            f"Invalid chapter count {chapter_count} for book {book_code}. "
            f"Max allowed: {book.chapter_count}"
            )
        )

def upload_bible_book(
    db_session: Session,
    resource_id: int,
    usfm_file: UploadFile,
    # actor_user_id: int,
    pre_parsed_usj_data: Dict[str, Any] = None,
    usfm_content: str = None
) -> Dict[str, str]:
    """Upload and process a new bible book"""

    # Check if resource exists and validate content type
    resource = _get_resource(db_session, resource_id)

    if resource.content_type.lower() != "bible":
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'bible' "
                f"(found '{resource.content_type}')"
            )
        )

    # Read file if not already provided
    if usfm_content is None:
        usfm_content = _read_usfm_file(usfm_file)

    # Extract book code
    book_code = extract_book_code_from_usfm(usfm_content)
    book = _lookup_book_or_404(db_session, book_code)

    _check_book_not_exists(db_session, resource_id, book.book_id)

    # Parse USFM if not already parsed
    if pre_parsed_usj_data is not None:
        usj_data = pre_parsed_usj_data
    else:
        usj_data = _parse_usfm_to_usj(usfm_content)

    content_items = usj_data.get("content", [])
    chapter_count = _count_chapters(content_items)
    validate_chapter_count(db_session, book_code, chapter_count)

    entry_data = BibleEntrySchema(
        resource_id=resource_id,
        book_id=book.book_id,
        usfm_content=usfm_content,
        usj_data=usj_data,
        chapter_count=chapter_count
    )

    bible_record = _create_bible_entry(db_session, entry_data)

    _save_clean_verses(
        db_session=db_session,
        resource_id=resource_id,
        book_id=book.book_id,
        usj_data=usj_data
    )

    # touch_resource(db_session, resource_id=bible_record.resource_id, actor_user_id=actor_user_id)
    db_session.commit()

    return {
        "message": "Bible book uploaded successfully",
        "bible_book_id": bible_record.bible_book_id
    }
def _get_resource(db_session: Session, resource_id: int):
    resource = db_session.query(db_models.Resource).filter_by(resource_id=resource_id).first()
    if not resource:
        raise NotAvailableException(detail="Resource not found")
    if resource.content_type.lower() != "bible":
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'bible' "
                f"(found '{resource.content_type}')"
            )
        )
    return resource
def _read_usfm_file(usfm_file: UploadFile) -> str:
    return usfm_file.file.read().decode("utf-8")


def _lookup_book_or_404(db_session: Session, book_code: str):
    book = db_session.query(db_models.BookLookup).filter(
        func.lower(db_models.BookLookup.book_code) == book_code.lower()
    ).first()
    if not book:
        raise NotAvailableException(detail=f"Book {book_code} not found")
    return book


def _check_book_not_exists(db_session: Session, resource_id: int, book_id: int):
    existing = db_session.query(db_models.Bible).filter_by(
        resource_id=resource_id,
        book_id=book_id
    ).first()
    if existing:
        raise AlreadyExistsException(
            detail=f"Book already exists for resource {resource_id}"
        )

def _create_bible_entry(db_session: Session, data: BibleEntrySchema):
    bible_record = db_models.Bible(
        resource_id=data.resource_id,
        book_id=data.book_id,
        usfm=data.usfm_content,
        json=data.usj_data,
        chapters=data.chapter_count,
    )
    db_session.add(bible_record)
    db_session.flush()
    return bible_record

def _save_clean_verses(
    db_session: Session,
    resource_id: int,
    book_id: int,
    usj_data: Dict[str, Any]
):
    verses = parse_usfm_to_clean_verses(usj_data)
    for verse in verses:
        db_session.add(
            db_models.CleanBible(
                resource_id=resource_id,
                book_id=book_id,
                chapter=verse["chapter"],
                verse=verse["verse"],
                text=verse["text"],
            )
        )


def update_bible_book(
    db_session: Session,
    bible_book_id: int,
    usfm_file: UploadFile,
    # actor_user_id: int,
    pre_parsed_usj_data: Dict[str, Any] = None,
    usfm_content: str = None
) -> Dict[str, str]:
    """Update an existing bible book"""

    bible_record = _get_bible_record_or_404(db_session, bible_book_id)

    # Read file if not already provided
    if usfm_content is None:
        usfm_content = _read_usfm_file(usfm_file)

    book_code = extract_book_code_from_usfm(usfm_content)
    _validate_book_code_matches(db_session, bible_record.book_id, book_code)

    # Parse USFM if not already parsed
    if pre_parsed_usj_data is not None:
        usj_data = pre_parsed_usj_data
    else:
        usj_data = _parse_usfm_to_usj(usfm_content)

    content_items = usj_data.get("content", [])
    chapter_count = _count_chapters(content_items)
    validate_chapter_count(db_session, book_code, chapter_count)

    _update_bible_entry(
        bible_record=bible_record,
        usfm_content=usfm_content,
        usj_data=usj_data,
        chapter_count=chapter_count,
    )

    _replace_clean_verses(
        db_session=db_session,
        resource_id=bible_record.resource_id,
        book_id=bible_record.book_id,
        usj_data=usj_data
    )

    # touch_resource(db_session, resource_id=bible_record.resource_id, actor_user_id=actor_user_id)
    db_session.commit()

    return {"message": "Bible book updated successfully"}
def _get_bible_record_or_404(db_session: Session, bible_book_id: int):
    record = db_session.query(db_models.Bible).filter_by(bible_book_id=bible_book_id).first()
    if not record:
        raise NotAvailableException(detail=f"Bible book {bible_book_id} not found")
    return record
def _validate_book_code_matches(db_session: Session, book_id: int, new_code: str):
    book = db_session.query(db_models.BookLookup).filter_by(book_id=book_id).first()
    if book.book_code.lower() != new_code.lower():
        raise BadRequestException(
            detail=f"Book code mismatch: {new_code} != {book.book_code}"
        )
def _update_bible_entry(
    bible_record,
    usfm_content: str,
    usj_data: Dict[str, Any],
    chapter_count: int
):
    bible_record.usfm = usfm_content
    bible_record.json = usj_data
    bible_record.chapters = chapter_count
def _replace_clean_verses(
    db_session: Session,
    resource_id: int,
    book_id: int,
    usj_data: Dict[str, Any]
):
    db_session.query(db_models.CleanBible).filter_by(
        resource_id=resource_id,
        book_id=book_id
    ).delete()

    verses = parse_usfm_to_clean_verses(usj_data)
    for v in verses:
        db_session.add(
            db_models.CleanBible(
                resource_id=resource_id,
                book_id=book_id,
                chapter=v["chapter"],
                verse=v["verse"],
                text=v["text"]
            )
        )
def delete_bible_books(
    db_session: Session,
    resource_id: int,
    book_codes: List[str]
):
    """Delete multiple Bible books in a standardized structure."""

    # Check if resource exists
    resource = (
        db_session.query(db_models.Resource)
        .filter_by(resource_id=resource_id)
        .first()
    )
    if not resource:
        raise NotAvailableException(detail=f"Resource {resource_id} not found")
    if resource.content_type.lower() != "bible":
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'bible' "
                f"(found '{resource.content_type}')"
            )
        )
    deleted_ids = []
    errors = []
    processed = set()

    for code in book_codes:
        code_lower = code.lower()

        # Duplicate check
        if code_lower in processed:
            errors.append(f"Duplicate book code: {code}")
            continue

        processed.add(code_lower)

        # Lookup the book
        book = (
            db_session.query(db_models.BookLookup)
            .filter(func.lower(db_models.BookLookup.book_code) == code_lower)
            .first()
        )

        if not book:
            errors.append(f"Book code '{code}' not found in lookup")
            continue

        # Check bible table
        bible_row = (
            db_session.query(db_models.Bible)
            .filter_by(resource_id=resource_id, book_id=book.book_id)
            .first()
        )

        if not bible_row:
            errors.append(f"Book '{code}' not found for resource {resource_id}")
            continue

        # Delete clean bible rows
        db_session.query(db_models.CleanBible).filter_by(
            resource_id=resource_id, book_id=book.book_id
        ).delete()

        # Delete bible entry
        db_session.delete(bible_row)
        deleted_ids.append(code)

    if deleted_ids:
        db_session.commit()

    # Standardized flags
    all_failed = len(deleted_ids) == 0 and len(errors) > 0
    has_errors = len(errors) > 0

    return {
        "data": {"deletedCount": len(deleted_ids),
            "deletedIds": deleted_ids,
            "errors": errors if errors else None,
        },"all_failed": all_failed,
        "has_errors": has_errors,
    }

def build_bulk_delete_response(result: dict):
    """Delete helper function."""
    deleted_count = result["data"]["deletedCount"]

    if result["all_failed"]:
        status_code = 404

    elif result["has_errors"]:
        status_code = 207
    else:
        status_code = 200

    message=(
        f"Successfully deleted {deleted_count} book(s)"
        if deleted_count > 0
        else "No books were deleted"
    )

    response_data = {
        **result["data"],
        "message": message,
    }
    return status_code, response_data

def get_bible_books(
    db_session: Session,
    resource_id: int | None = None
):
    """Get list of books for one or all bible resources"""

    # Base query
    query = (
        db_session.query(
            db_models.Bible,
            db_models.BookLookup
        )
        .join(
            db_models.BookLookup,
            db_models.Bible.book_id == db_models.BookLookup.book_id
        )
    )

    # If resource_id provided → validate + filter
    if resource_id is not None:
        resource = (
            db_session.query(db_models.Resource)
            .filter_by(resource_id=resource_id)
            .first()
        )
        if not resource:
            raise NotAvailableException(
                detail=f"Resource {resource_id} not found"
            )
        if resource.content_type.lower() != "bible":
            raise BadRequestException(
                detail=(
                    f"Resource {resource_id} is not of type 'bible' "
                    f"(found '{resource.content_type}')"
                )
            )

        query = query.filter(db_models.Bible.resource_id == resource_id)

    else:
        # Only bible type resources
        query = query.join(
            db_models.Resource,
            db_models.Bible.resource_id == db_models.Resource.resource_id
        ).filter(
            db_models.Resource.content_type == "bible"
        )

    books = query.all()

    grouped = {}

    for bible, book_lookup in books:
        rid = bible.resource_id

        if rid not in grouped:
            grouped[rid] = []

        grouped[rid].append(
            schema.BibleBookResponse(
                bible_book_id=bible.bible_book_id,
                book_code=book_lookup.book_code,
                book_id=book_lookup.book_id,
                short=book_lookup.book_code,
                long=book_lookup.book_name,
                abbr=book_lookup.book_code[:3]
            )
        )

    return [
        schema.BibleBooksListResponse(
            resource_id=rid,
            books=books_list
        )
        for rid, books_list in grouped.items()
    ]


def get_full_bible_content(
    db_session: Session,
    resource_id: int,
    output_format: str
) -> schema.BibleFullContentResponse:
    """Get full content of all books in a resource in specified format"""

    # Find resource
    resource = db_session.query(db_models.Resource).filter_by(resource_id=resource_id).first()
    if not resource:
        raise NotAvailableException(detail=f"Resource {resource_id} not found")
    if resource.content_type.lower() != "bible":
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'bible' "
                f"(found '{resource.content_type}')"
            )
        )
    # Find all bible records for this resource, ordered by book_id
    bible_records = db_session.query(db_models.Bible).join(
        db_models.BookLookup, db_models.Bible.book_id == db_models.BookLookup.book_id
    ).filter(
        db_models.Bible.resource_id == resource_id
    ).order_by(db_models.BookLookup.book_id).all()

    if not bible_records:
        raise NotAvailableException(detail=f"No bible records found for resource {resource_id}")

    # Prepare books data
    books = []
    for bible_record in bible_records:
        # Get book details
        book = db_session.query(db_models.BookLookup).filter_by(
            book_id=bible_record.book_id
        ).first()

        if output_format.lower() == "json":
            content = bible_record.json
        elif output_format.lower() == "usfm":
            content = bible_record.usfm
        else:
            raise BadRequestException(detail=f"Unsupported format: {format}")

        books.append({
            "bible_book_id": bible_record.bible_book_id,
            "book_id": bible_record.book_id,
            "book_code": book.book_code,
            "book_name": book.book_name,
            "chapters": bible_record.chapters,
            "content": content
        })

    return schema.BibleFullContentResponse(
        resource_id=resource_id,
        total_books=len(books),
        books=books
    )


def get_bible_book_content(
    db_session: Session,
    resource_id: int,
    book_code: str,
    output_format: str
) -> schema.BibleBookContentResponse:
    """Get full content of a book in specified format"""

    # Find resource
    resource = db_session.query(db_models.Resource).filter_by(resource_id=resource_id).first()
    if not resource:
        raise NotAvailableException(detail=f"Resource {resource_id} not found")
    if resource.content_type.lower() != "bible":
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'bible' "
                f"(found '{resource.content_type}')"
            )
        )
    # Find book
    book = db_session.query(db_models.BookLookup).filter(
        func.lower(db_models.BookLookup.book_code) == book_code.lower()
    ).first()

    if not book:
        raise NotAvailableException(detail=f"Book {book_code} not found")

    # Find bible record
    bible_record = db_session.query(db_models.Bible).filter_by(
        resource_id=resource_id,
        book_id=book.book_id
    ).first()

    if not bible_record:
        raise NotAvailableException(
            detail=f"Book {book_code} not found for resource {resource_id}"
        )


    if output_format.lower() == "json":
        content = bible_record.json
    elif output_format.lower() == "usfm":
        content = bible_record.usfm
    else:
        raise TypeException("Format must be 'json' or 'usfm'")


    return schema.BibleBookContentResponse(
        resource_id=resource_id,
        book_id=bible_record.bible_book_id,
        book_code=book_code,
        book_content=content
    )



def get_available_books(db_session: Session, resource_id: int):
    """Get all available books for a resource, ordered by book_id"""
    return db_session.query(db_models.BookLookup).join(
        db_models.Bible, db_models.BookLookup.book_id == db_models.Bible.book_id
    ).filter(
        db_models.Bible.resource_id == resource_id
    ).order_by(db_models.BookLookup.book_id).all()

def get_available_clean_books(db_session: Session, resource_id: int):
    """Get all available books for a resource from clean_bible, ordered by book_id"""
    return db_session.query(db_models.BookLookup).join(
        db_models.CleanBible, db_models.BookLookup.book_id == db_models.CleanBible.book_id
    ).filter(
        db_models.CleanBible.resource_id == resource_id
    ).distinct().order_by(db_models.BookLookup.book_id).all()

def get_bible_chapter(
    db_session: Session,
    resource_id: int,
    book_code: str,
    chapter: int
) -> schema.BibleChapterResponse:
    """Get chapter content from bible table with cross-book navigation"""

    # Helper: Resource
    def get_resource():
        res = db_session.query(db_models.Resource).filter_by(resource_id=resource_id).first()
        if not res:
            raise NotAvailableException(detail=f"Resource {resource_id} not found")
        if res.content_type.lower() != "bible":
            raise BadRequestException(
                detail=(
                    f"Resource {resource_id} is not of type 'bible' "
                    f"(found '{res.content_type}')"
                )
            )
        return res

    # Helper: Book
    def get_book():
        book_obj = db_session.query(db_models.BookLookup).filter(
            func.lower(db_models.BookLookup.book_code) == book_code.lower()
        ).first()
        if not book_obj:
            raise NotAvailableException(detail=f"Book {book_code} not found")
        return book_obj

    # Helper: Bible record
    def get_bible_record(book_id):
        record = db_session.query(db_models.Bible).filter_by(
            resource_id=resource_id,
            book_id=book_id
        ).first()
        if not record:
            raise NotAvailableException(
                detail=f"Book {book_code} not found for resource {resource_id}"
            )
        return record

    # Helper: Extract chapter content
    def extract_chapter_content(usj_content):
        chapter_items = []
        current_ch_num = None
        chapter_found = False

        for item in usj_content:
            if item.get("type") == "chapter":
                num = item.get("number")
                current_ch_num = int(num) if num and num.isdigit() else None

                if current_ch_num == chapter:
                    chapter_found = True
                    chapter_items = []
                elif chapter_found:
                    break
            elif chapter_found:
                chapter_items.append(item)

        if not chapter_found:
            raise NotAvailableException(detail=f"Chapter {chapter} not found")

        return chapter_items

    # Helper: Build navigation links
    def build_navigation(book, bible_record, available_books):
        current_index = next(
            (i for i, b in enumerate(available_books) if b.book_id == book.book_id),
            None
        )

        # Previous
        if chapter > 1:
            previous = {
            "resourceId": str(resource_id),
                "bibleBookCode": book_code,
                "chapterId": chapter - 1
            }
        elif current_index and current_index > 0:
            prev_book = available_books[current_index - 1]
            previous = {
                "resourceId": str(resource_id),
                "bibleBookCode": prev_book.book_code,
                "chapterId": prev_book.chapter_count
            }
        else:
            previous = None

        # Next
        if chapter < bible_record.chapters:
            nxt = {
                "resourceId": str(resource_id),
                "bibleBookCode": book_code,
                "chapterId": chapter + 1
            }
        elif current_index is not None and current_index < len(available_books) - 1:
            next_book = available_books[current_index + 1]
            nxt = {
                "resourceId": str(resource_id),
                "bibleBookCode": next_book.book_code,
                "chapterId": 1
            }
        else:
            nxt = None

        return previous, nxt

    # Main logic
    get_resource()
    book = get_book()
    bible_record = get_bible_record(book.book_id)

    chapter_items = extract_chapter_content(bible_record.json.get("content", []))
    available_books = get_available_books(db_session, resource_id)
    previous, nxt = build_navigation(book, bible_record, available_books)

    return schema.BibleChapterResponse(
        resource_id=resource_id,
        bible_book_code=book_code,
        chapter=chapter,
        previous=previous,
        next=nxt,
        chapter_content=chapter_items
    )

def _clean_get_resource(db_session, resource_id):
    resource = db_session.query(db_models.Resource).filter_by(resource_id=resource_id).first()
    if not resource:
        raise NotAvailableException(detail=f"Resource {resource_id} not found")
    if resource.content_type.lower() != "bible":
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'bible' "
                f"(found '{resource.content_type}')"
            )
        )
    return resource


def _clean_get_book(db_session, book_code):
    book = db_session.query(db_models.BookLookup).filter(
        func.lower(db_models.BookLookup.book_code) == book_code.lower()
    ).first()
    if not book:
        raise NotAvailableException(detail=f"Book {book_code} not found")
    return book


def _clean_get_verses(db_session, resource_id, book_id, chapter, book_code):
    verses = db_session.query(db_models.CleanBible).filter_by(
        resource_id=resource_id,
        book_id=book_id,
        chapter=chapter
    ).order_by(db_models.CleanBible.verse).all()

    if not verses:
        raise NotAvailableException(
            detail=f"Chapter {chapter} not found for book {book_code}"
        )
    return verses


def _clean_get_bible_record(db_session, resource_id, book_id):
    return db_session.query(db_models.Bible).filter_by(
        resource_id=resource_id,
        book_id=book_id
    ).first()


def _clean_find_book_index(available_books, book_id):
    for i, b in enumerate(available_books):
        if b.book_id == book_id:
            return i
    return None

def get_clean_bible_chapter(
    db_session: Session,
    resource_id: int,
    book_code: str,
    chapter: int
) -> schema.CleanBibleChapterResponse:
    """Get full content of a chapter with book intro."""

    _clean_get_resource(db_session, resource_id)
    book = _clean_get_book(db_session, book_code)
    verses = _clean_get_verses(db_session, resource_id, book.book_id, chapter, book_code)
    bible_record = _clean_get_bible_record(db_session, resource_id, book.book_id)

    available_books = get_available_clean_books(db_session, resource_id)
    idx = _clean_find_book_index(available_books, book.book_id)

    nav_input = schema.CleanNavigationInput(
        resource_id=resource_id,
        book_code=book_code,
        chapter=chapter,
        bible_record=bible_record,
        available_books=available_books,
        idx=idx
    )

    previous, next_chapter = _clean_build_navigation(nav_input)


    verse_content = [
        schema.CleanVerseContent(verse=v.verse, text=v.text)
        for v in verses
    ]

    return schema.CleanBibleChapterResponse(
        resource_id=resource_id,
        bible_book_code=book_code,
        chapter=chapter,
        previous=previous,
        next=next_chapter,
        chapter_content=verse_content
    )

def get_bible_verse(
    db_session: Session,
    resource_id: int,
    book_code: str,
    chapter: int,
    verse: int
) -> schema.BibleVerseResponse:
    """Get specific verse content with enhanced navigation"""

    _get_resource(db_session, resource_id)
    book = _get_book_or_404(db_session, book_code)
    verse_record = _get_clean_verse_or_404(db_session, resource_id, book.book_id, chapter, verse)
    bible_record = _get_bible_record(db_session, resource_id, book.book_id)

    available_books = get_available_clean_books(db_session, resource_id)
    current_book_index = _find_book_index(available_books, book.book_id)

    prev_input = schema.CleanPreviousVerseInput(
        db_session=db_session,
        resource_id=resource_id,
        book=book,
        chapter=chapter,
        verse=verse,
        available_books=available_books,
        book_index=current_book_index
    )

    previous = _compute_previous_verse(prev_input)


    next_input = schema.CleanNextVerseInput(
        db_session=db_session,
        resource_id=resource_id,
        book=book,
        chapter=chapter,
        verse=verse,
        available_books=available_books,
        book_index=current_book_index,
        bible_record=bible_record
    )

    next_verse = _compute_next_verse(next_input)


    return schema.BibleVerseResponse(
        resource_id=resource_id,
        bible_book_code=book_code,
        chapter=chapter,
        verse_number=verse,
        previous=previous,
        next=next_verse,
        verse_content=verse_record.text
    )

def _get_book_or_404(db_session: Session, book_code: str):
    book = db_session.query(db_models.BookLookup).filter(
        func.lower(db_models.BookLookup.book_code) == book_code.lower()
    ).first()
    if not book:
        raise NotAvailableException(detail=f"Book {book_code} not found")
    return book


def _get_clean_verse_or_404(
    db_session: Session,
    resource_id: int,
    book_id: int,
    chapter: int,
    verse: int
):
    verse_record = db_session.query(db_models.CleanBible).filter_by(
        resource_id=resource_id,
        book_id=book_id,
        chapter=chapter,
        verse=verse
    ).first()

    if not verse_record:
        raise NotAvailableException(
            detail=f"Verse {book_id}.{chapter}.{verse} not found"
        )
    return verse_record


def _get_bible_record(db_session: Session, resource_id: int, book_id: int):
    return db_session.query(db_models.Bible).filter_by(
        resource_id=resource_id,
        book_id=book_id
    ).first()


def _find_book_index(available_books, book_id):
    for i, book in enumerate(available_books):
        if book.book_id == book_id:
            return i
    return None
