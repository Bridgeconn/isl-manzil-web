"""Utilities for CRUD operations."""
import os
from typing import Any, Dict, List,Optional
from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
from usfm_grammar import USFMParser
import db_models
import schema
from dependencies import logger
from custom_exceptions import (
    AlreadyExistsException,
    NotAvailableException,
    UnprocessableException,

)


if os.environ.get("DOCKER_RUN")=='True':
    LOG_DIR = "/app/logs" # will be mounted to docker volume
else:
    LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")

os.makedirs(LOG_DIR, exist_ok=True)

def utcnow():
    """Returns current UTC datetime"""
    return datetime.now(timezone.utc)
def _build_resource_name(language_code: str,
                         version_code: str | None,
                         revision: str | None,
                         content_type_value: str) -> str:
    """
    Format: <language_code>_<version_code>_<revision>_<content>
    e.g., "hin_HINREV_1.1_bible"

    - Skips empty parts.
    - All separated by underscores.
    """
    parts = [language_code or "", version_code or "", revision or "", content_type_value]
    return "_".join([p for p in parts if p])

def _group_resources(rows: List[tuple]) -> List[schema.LanguageGroupOut]:
    groups: Dict[int, Dict[str, Any]] = {}

    for resource, lang, version, lic in rows:
        lid = lang.language_id

        if lid not in groups:
            groups[lid] = {
                "language": schema.LanguageBrief(
                    id=lid,
                    code=lang.language_code,
                    name=lang.language_name,
                ),
                "versions": []
            }

        version_code = getattr(version, "abbreviation", getattr(version, "code", None))
        content_val = schema.ContentTypeEnum(resource.content_type).value

        resource_name = _build_resource_name(
            language_code=lang.language_code,
            version_code=version_code,
            revision=resource.revision,
            content_type_value=content_val,
        )

        groups[lid]["versions"].append(
            schema.ResourceRowResponse(
                resourceId=resource.resource_id,
                resourceName=resource_name,
                revision=resource.revision,
                version=schema.VersionRef(
                    id=version.version_id,
                    name=version.name,
                    code=version_code,
                ),
                content=schema.ContentRef(
                    contentType=schema.ContentTypeEnum(resource.content_type)
                ),
                license=schema.LicenseRef(
                    id=lic.license_id,
                    name=lic.license_name
                ),
                language=schema.LanguageBrief(
                    id=lang.language_id,
                    code=lang.language_code,
                    name=lang.language_name
                ),
                metadata=json.loads(resource.meta_data) if resource.meta_data else None,
                published=bool(resource.published),
                createdBy=resource.created_by,
                createdTime=resource.created_at,
                updatedBy=resource.updated_by,
                updatedTime=resource.updated_at
            )
        )

    return [schema.LanguageGroupOut(**g) for g in groups.values()]
def _resolve_final_values(db_obj, payload):
    return {
        "version_id":   payload.version_id   or db_obj.version_id,
        "language_id":  payload.language_id  or db_obj.language_id,
        "license_id":   payload.license_id   or db_obj.license_id,
        "revision":     payload.revision     or db_obj.revision,
        "content_type": payload.content_type.value.lower()
                        if payload.content_type else db_obj.content_type,
    }
def _validate_uniqueness(db: Session, current_id: int, vals: dict):
    existing = (
        db.query(db_models.Resource)
        .filter(
            db_models.Resource.version_id == vals["version_id"],
            db_models.Resource.language_id == vals["language_id"],
            db_models.Resource.license_id == vals["license_id"],
            db_models.Resource.revision == vals["revision"],
            db_models.Resource.content_type == vals["content_type"],
            db_models.Resource.resource_id != current_id,
        )
        .first()
    )
    if existing:
        raise AlreadyExistsException(detail="Resource already exists")
def _validate_and_get(db, model, id_value, field_name):
    pk_column = model.__mapper__.primary_key[0].name

    obj = db.query(model).filter(getattr(model, pk_column) == id_value).first()
    if not obj:
        raise NotAvailableException(detail=f"{field_name} not found")
    return obj

def _build_response(db_obj, version, language, license_):
    resource_name = _build_resource_name(
        language_code=language.language_code,
        version_code=getattr(version, "abbreviation", getattr(version, "code", None)),
        revision=db_obj.revision,
        content_type_value=schema.ContentTypeEnum(db_obj.content_type).value,
    )
    return schema.ResourceResponse(
        resourceId=db_obj.resource_id,
        resourceName=resource_name,
        revision=db_obj.revision,
        version=schema.VersionRef(
            id=version.version_id,
            name=version.name,
            code=getattr(version, "abbreviation", getattr(version, "code", "")),
        ),
        language=schema.LanguageBrief(
            id=language.language_id,
            code=language.language_code,
            name=language.language_name,
        ),
        content=schema.ContentRef(contentType=schema.ContentTypeEnum(db_obj.content_type)),
        license=schema.LicenseRef(id=license_.license_id, name=license_.license_name),
        metadata=json.loads(db_obj.meta_data) if db_obj.meta_data else None,
        published=bool(db_obj.published),
        createdBy=db_obj.created_by,
        createdTime=db_obj.created_at,
        updatedBy=db_obj.updated_by,
        updatedTime=db_obj.updated_at,
    )

# Utility functions for API operations bible

def extract_book_code_from_usfm(usj_data: Dict[str, Any]) -> str:
    """Extract book code from USFM content using usfm-grammar"""
    try:
        for item in usj_data.get("content", []):
            if item.get("type") == "book" and item.get("marker") == "id":
                return item.get("code")

        raise UnprocessableException("No book code found in USFM content")

    except Exception as e:
        raise UnprocessableException(detail=str(e)) from e
def parse_verse_number(verse_str: str) -> List[int]:
    """
    Parse verse number strings that might contain ranges.

    Examples:
    - "1" -> [1]
    - "23-24" -> [23, 24]
    """
    verses = []

    if not verse_str:
        return verses

    verse_str = str(verse_str).strip()

    try:
        # Split by comma for multiple groups
        groups = verse_str.split(',')

        for group in groups:
            group = group.strip()

            if '-' in group:
                # Handle ranges like "23-24"
                parts = group.split('-')
                if len(parts) == 2:
                    try:
                        start = int(parts[0].strip())
                        end = int(parts[1].strip())
                        verses.extend(range(start, end + 1))
                    except ValueError:
                        # Fallback: treat as single verse
                        verses.append(int(group))
                else:
                    verses.append(int(group))
            else:
                # Single verse
                verses.append(int(group))

        return sorted(set(verses))  # Remove duplicates and sort

    except (ValueError, AttributeError) as e:
        raise ValueError(f"Could not parse verse number: {verse_str}") from e


def parse_usfm_to_clean_verses(usj_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Parse USJ data to extract clean verse-by-verse content, handling verse ranges"""
    verses = []
    chapter = None

    for item in usj_data.get("content", []):
        item_type = item.get("type")

        if item_type == "chapter":
            chapter = item.get("number")
            continue

        if item_type == "para":
            _process_paragraph(item.get("content", []), chapter, verses)

    return verses

def _process_paragraph(para_content: List[Any], chapter: int, verses: List[Dict[str, Any]]) -> None:
    """Process paragraph and extract individual verses."""
    i = 0
    length = len(para_content)

    while i < length:
        element = para_content[i]

        if not _is_verse_marker(element):
            i += 1
            continue

        verse_str = element.get("number")
        i += 1

        verse_text, i = _collect_verse_text(para_content, i)

        if verse_text:
            _expand_and_add_verses(verse_str, verse_text, chapter, verses)

def _is_verse_marker(element: Any) -> bool:
    return isinstance(element, dict) and element.get("type") == "verse"

def _collect_verse_text(para_content: List[Any], index: int) -> tuple[str, int]:
    parts = []
    length = len(para_content)

    while index < length and isinstance(para_content[index], str):
        parts.append(para_content[index])
        index += 1

    return " ".join(parts).strip(), index

def _expand_and_add_verses(
    verse_str: str,
    verse_text: str,
    chapter: int,
    verses: List[Dict[str, Any]]
):
    try:
        verse_numbers = parse_verse_number(verse_str)
        for number in verse_numbers:
            verses.append({
                "chapter": chapter,
                "verse": number,
                "text": verse_text,
            })
    except ValueError as e:
        print(f"Warning: Could not parse verse '{verse_str}' in chapter {chapter}: {e}")
def _parse_usfm_to_usj(usfm_content: str) -> Dict[str, Any]:
    logger.info("parse usfm to usj start")
    try:
        return USFMParser(usfm_content).to_usj()
    except Exception as e:
        raise UnprocessableException(detail=f"Error parsing USFM: {str(e)}") from e


def _count_chapters(content_items: List[Dict[str, Any]]) -> int:
    return len([item for item in content_items if item.get("type") == "chapter"])

def _clean_build_navigation(data: schema.CleanNavigationInput):
    """Build navigation links"""
    resource_id = data.resource_id
    book_code = data.book_code
    chapter = data.chapter
    bible_record = data.bible_record
    available_books = data.available_books
    idx = data.idx

    previous = None
    next_chapter = None


    # Previous
    if chapter > 1:
        previous = {
            "resourceId": str(resource_id),
        "bibleBookCode": book_code,"chapterId": chapter - 1
        }
    elif idx is not None and idx > 0:
        prev_book = available_books[idx - 1]
        previous = {
            "resourceId": str(resource_id),
            "bibleBookCode": prev_book.book_code,
            "chapterId": prev_book.chapter_count
        }

    # Next
    if bible_record and chapter < bible_record.chapters:
        next_chapter = {
            "resourceId": str(resource_id),
            "bibleBookCode": book_code,
            "chapterId": chapter + 1
        }
    elif idx is not None and idx < len(available_books) - 1:
        next_book = available_books[idx + 1]
        next_chapter = {
            "resourceId": str(resource_id),
            "bibleBookCode": next_book.book_code,
            "chapterId": 1
        }

    return previous, next_chapter
def _compute_previous_verse(payload: schema.CleanPreviousVerseInput):
    db_session = payload.db_session
    resource_id = payload.resource_id
    book = payload.book
    chapter = payload.chapter
    verse = payload.verse
    available_books = payload.available_books
    book_index = payload.book_index

    # Case 1: Previous verse in same chapter
    if verse > 1:
        return {
            "resourceId": str(resource_id),
            "bibleBookCode": book.book_code,
            "chapterId": chapter,
            "verse": verse - 1
        }

    # Case 2: Last verse of previous chapter
    if chapter > 1:
        prev_chap_last = db_session.query(db_models.CleanBible).filter_by(
            resource_id=resource_id,
            book_id=book.book_id,
            chapter=chapter - 1
        ).order_by(db_models.CleanBible.verse.desc()).first()

        if prev_chap_last:
            return {
                "resourceId": str(resource_id),
                "bibleBookCode": book.book_code,
                "chapterId": chapter - 1,
                "verse": prev_chap_last.verse
            }

    # Case 3: Last verse of previous book
    if book_index is not None and book_index > 0:
        prev_book = available_books[book_index - 1]
        last_verse = db_session.query(db_models.CleanBible).filter_by(
            resource_id=resource_id,
            book_id=prev_book.book_id,
            chapter=prev_book.chapter_count
        ).order_by(db_models.CleanBible.verse.desc()).first()

        if last_verse:
            return {
                "resourceId": str(resource_id),
                "bibleBookCode": prev_book.book_code,
                "chapterId": prev_book.chapter_count,
                "verse": last_verse.verse
            }

    return None


def _compute_next_verse(payload: schema.CleanNextVerseInput):
    db_session = payload.db_session
    resource_id = payload.resource_id
    book = payload.book
    chapter = payload.chapter
    verse = payload.verse
    available_books = payload.available_books
    book_index = payload.book_index
    bible_record = payload.bible_record

    # CASE 1: Next verse exists in same chapter
    next_verse_record = db_session.query(db_models.CleanBible).filter_by(
        resource_id=resource_id,
        book_id=book.book_id,
        chapter=chapter,
        verse=verse + 1
    ).first()

    if next_verse_record:
        return {
            "resourceId": str(resource_id),
            "bibleBookCode": book.book_code,
            "chapterId": chapter,
            "verse": verse + 1
        }

    # CASE 2: Next chapter exists in same book
    if bible_record and chapter < bible_record.chapters:
        return {
            "resourceId": str(resource_id),
            "bibleBookCode": book.book_code,
            "chapterId": chapter + 1,
            "verse": 1
        }

    # CASE 3: Next book exists
    if book_index is not None and book_index < len(available_books) - 1:
        next_book = available_books[book_index + 1]
        return {
            "resourceId": str(resource_id),
            "bibleBookCode": next_book.book_code,
            "chapterId": 1,
            "verse": 1
        }

    return None

def touch_resource(db: Session, resource_id: int, actor_user_id: Optional[int]) -> None:
    """
    Update only the resource row's updated_by/updated_at.
    Call this from child-table CRUD whenever they modify rows.
    """
    res = db.query(db_models.Resource).filter_by(resource_id=resource_id).first()
    if not res:
        # If this is ever hit, caller already verified resource existence; keep consistent
        raise NotAvailableException(detail=f"Resource {resource_id} not found")
    res.updated_by = actor_user_id
    res.updated_at = utcnow()
    db.add(res)
