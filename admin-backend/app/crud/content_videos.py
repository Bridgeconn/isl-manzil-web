"""Videos crud"""
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import db_models
import schema
from custom_exceptions import (
    AlreadyExistsException,
    NotAvailableException,
    BadRequestException,
    UnprocessableException,
    GenericException
)

# --- ISL BIBLE VIDEOS ---
def _resolve_book_id(db, book_code: str):
    """Return BookLookup row (object) for given book_code (case-insensitive) or raise 422."""
    if not book_code:
        raise UnprocessableException(
                detail="book code is required")
    book = (
        db.query(db_models.BookLookup)
        .filter(db_models.BookLookup.book_code.ilike(book_code))
        .first()
    )
    if not book:
        raise UnprocessableException(
                detail=f"Invalid book code '{book_code}'")
    return book

def create_isl_videos(db, payload: schema.IslVideoCreateRequest):
    """create isl videos"""
    resource = (
        db.query(db_models.Resource)
        .filter(db_models.Resource.resource_id == payload.resourceId)
        .first()
    )
    if not resource:
        raise NotAvailableException(detail=f"Resource {payload.resourceId} not found")
    #  Resource content_type must be 'isl_bible'
    if resource.content_type.lower() != "isl_bible":
        raise BadRequestException(
            detail=(
                f"Resource {payload.resourceId} is not of type 'isl_bible'"
                f" (found '{resource.content_type}')"
            )
        )
    created: List[schema.IslVideoResponseItem] = []

    for item in payload.videos:
        # resolve book
        book_obj = _resolve_book_id(db, item.book)
        # chapter validation: allow 0 .. chapter_count
        if item.chapter < 0 or item.chapter > book_obj.chapter_count:
            raise UnprocessableException(
                detail=(
                    f"Invalid chapter {item.chapter} for book '{item.book}'."
                    f" Allowed 0 to {book_obj.chapter_count}"
                )
            )
        # check duplicate in DB
        dup = (
            db.query(db_models.IslBible)
            .filter_by(
                resource_id=payload.resourceId,
                book_id=book_obj.book_id,
                chapter=item.chapter)
            .first()
        )
        if dup:
            raise AlreadyExistsException(
                detail=(
                    f"Duplicate entry for resource_id={payload.resourceId},"
                    f"book={item.book}, chapter={item.chapter}"
                )
            )
        row = db_models.IslBible(
            resource_id=payload.resourceId,
            book_id=book_obj.book_id,
            chapter=item.chapter,
            url=item.url,
            title=item.title,
            description=item.description,
        )
        db.add(row)
        db.flush()

        created.append(schema.IslVideoResponseItem(
            video_id=row.id,
            book=book_obj.book_code,
            chapter=row.chapter,
            url=row.url,
            title=row.title,
            description=row.description
        ))

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise GenericException(detail=str(exc)) from exc

    return {"resource_id": payload.resourceId, "videos": created}


def update_isl_videos(db, payload: schema.IslVideoUpdateRequest):
    """update isl videos"""
    resource = (
        db.query(db_models.Resource)
        .filter(db_models.Resource.resource_id == payload.resourceId)
        .first()
    )
    if not resource:
        raise NotAvailableException(detail=f"Resource {payload.resourceId} not found")
    #  Resource content_type must be 'isl_bible'
    if resource.content_type.lower() != "isl_bible":
        raise BadRequestException(
            detail=(
                f"Resource {payload.resourceId} is not of type 'isl_bible'"
                f"(found '{resource.content_type}')"
            )
        )
    updated: List[schema.IslVideoResponseItem] = []

    for item in payload.videos:
        row = db.query(db_models.IslBible).filter_by(id=item.id).first()
        if not row:
            raise NotAvailableException(detail=f"ISL Video id {item.id} not found")
        book_obj = _resolve_book_id(db, item.book)

        # chapter validation: allow 0 .. chapter_count
        if item.chapter < 0 or item.chapter > book_obj.chapter_count:
            raise UnprocessableException(
                detail=(
                    f"Invalid chapter {item.chapter} for book '{item.book}'."
                    f"Allowed 0 to {book_obj.chapter_count}"
                )
            )

        # uniqueness check against other rows
        conflict = (
            db.query(db_models.IslBible)
            .filter(
                db_models.IslBible.resource_id == payload.resourceId,
                db_models.IslBible.book_id == book_obj.book_id,
                db_models.IslBible.chapter == item.chapter,
                db_models.IslBible.id != row.id
            )
            .first()
        )
        if conflict:
            raise AlreadyExistsException(
                detail=(
                    f"Update would violate uniqueness for resource_id={payload.resourceId},"
                    f"book={item.book}, chapter={item.chapter}"
                )
            )

        # apply updates
        row.resource_id = payload.resourceId
        row.book_id = book_obj.book_id
        row.chapter = item.chapter
        row.url = item.url
        row.title = item.title
        row.description = item.description

        updated.append(schema.IslVideoResponseItem(
            video_id=row.id,
            book=book_obj.book_code,
            chapter=row.chapter,
            url=row.url,
            title=row.title,
            description=row.description
        ))

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise GenericException(detail=str(exc)) from exc

    return {"resource_id": payload.resourceId, "videos": updated}


def get_isl_videos(
    db: Session,
    resource_id: Optional[int] = None,
    book_code: Optional[str] = None,
    chapter: Optional[int] = None):
    """
    Return grouped videos as:
    { "books": { "gen": [ {video_id, chapter, title, description, url}, ... ], ... } }
    """
    # Validate resource exists (optional)
    # Fetch rows, join with BookLookup to get book_code
    q = db.query(db_models.IslBible, db_models.BookLookup).join(
    db_models.BookLookup,
    db_models.IslBible.book_id == db_models.BookLookup.book_id,
    )

    if resource_id is not None:
        q = q.filter(db_models.IslBible.resource_id == resource_id)

    if book_code:
        # normalize and validate input book_code
        bval = book_code.strip().lower()
        bl = _resolve_book_id(db, bval)
        # if book matched BookLookup, filter by book_id
        if bl:
            q = q.filter(db_models.IslBible.book_id == bl.book_id)
    if chapter is not None:
        # chapter int validation happens elsewhere; here just filter
        q = q.filter(db_models.IslBible.chapter == chapter)

    rows = q.order_by(db_models.BookLookup.book_code, db_models.IslBible.chapter).all()
    if not rows:
        raise NotAvailableException(
            detail="No ISL Bible videos found")
    result = {}
    for row, bl in rows:
        code = bl.book_code
        entry = {
            "video_id": row.id,
            "chapter": row.chapter,
            "title": row.title,
            "description": row.description,
            "url": row.url,
        }
        result.setdefault(code, []).append(entry)

    return {"books": result}


def delete_isl_videos(db: Session, resource_id: int, ids: List[int]) -> dict:
    """delete isl videos"""
    resource = (
        db.query(db_models.Resource)
        .filter(db_models.Resource.resource_id == resource_id)
        .first()
    )
    if not resource:
        raise NotAvailableException(detail=f"Resource {resource_id} not found")
    #  Resource content_type must be 'isl_bible'
    if resource.content_type.lower() != "isl_bible":
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'isl_bible'"
                f"(found '{resource.content_type}')"
            )
        )
    if not ids:
        return {
            "deleted_count": 0,
            "deleted_ids": [],
            "invalid_ids": []
        }

    # Get rows that belong to this resource_id
    rows = db.query(db_models.IslBible).filter(
        db_models.IslBible.id.in_(ids),
        db_models.IslBible.resource_id == resource_id
    ).all()

    existing_ids = [r.id for r in rows]

    # IDs provided but not found or not belonging to this resource
    invalid_ids = list(set(ids) - set(existing_ids))

    # Delete the valid ones
    deleted_count = (
        db.query(db_models.IslBible)
        .filter(db_models.IslBible.id.in_(existing_ids))
        .delete(synchronize_session=False)
    )

    db.commit()

    return {
        "deleted_count": deleted_count,
        "deleted_ids": existing_ids,
        "invalid_ids": invalid_ids
    }
