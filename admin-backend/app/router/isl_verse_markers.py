"""ISL verse markers Endpoints."""
from typing import Optional, List, Union
from fastapi import APIRouter, Depends,Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from supertokens_python.recipe.session import SessionContainer

import schema
from crud import isl_verse_markers_crud
from dependencies import get_db, logger
from auth import verify_session_with_approval, validate_admin_only, ensure_user_from_session_async

router = APIRouter(prefix="/isl-bible", tags=["ISL Verse Markers"])


@router.post(
    "/{isl_bible_id}/verse-markers",
    response_model=schema.VerseMarkersResponse,
    status_code=201
)
async def add_verse_markers(
    isl_bible_id: int,
    request: schema.VerseMarkersCreateRequest,
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Creates  verse markers for the given ISL Bible ID."""
    logger.info("POST ISL verse markers API")
    validate_admin_only(session)
    await ensure_user_from_session_async(db_session, session)

    record = isl_verse_markers_crud.add_verse_markers(
        db_session,
        isl_bible_id,
        [m.model_dump() for m in request.markers]
    )

    return {
    "id": record.id,
    "isl_bible_id": record.isl_id,
    "markers": record.verse_markers_json,
    "message": "Verse markers created successfully"
        }

@router.put(
    "/{isl_bible_id}/verse-markers",
    response_model=schema.VerseMarkersResponse
)
async def update_verse_markers(
    isl_bible_id: int,
    request: schema.VerseMarkersCreateRequest,
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Updates  verse markers for the given ISL Bible ID."""
    logger.info("PUT ISL verse markers API")
    validate_admin_only(session)
    await ensure_user_from_session_async(db_session, session)

    record = isl_verse_markers_crud.update_verse_markers(
        db_session,
        isl_bible_id,
        [m.model_dump() for m in request.markers]
    )

    return {
    "id": record.id,
    "isl_bible_id": record.isl_id,
    "markers": record.verse_markers_json,
    "message": "Verse markers updated successfully"}


@router.get(
    "/verse-markers",
    response_model=Union[schema.VerseMarkersResponse, List[schema.VerseMarkersResponse]]
)
async def get_verse_markers(
    isl_bible_id: Optional[int] = Query(None),
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Retrives all verse markers"""
    logger.info("GET ISL verse markers API")
    validate_admin_only(session)
    await ensure_user_from_session_async(db_session, session)

    if isl_bible_id is not None:
        record = isl_verse_markers_crud.get_verse_markers(
            db_session,
            isl_bible_id
        )
        return {
            "id": record.id,
            "isl_bible_id": record.isl_id,
            "markers": record.verse_markers_json
        }

    records = isl_verse_markers_crud.get_all_verse_markers(db_session)

    return [
        {
            "id": r.id,
            "isl_bible_id": r.isl_id,
            "markers": r.verse_markers_json
        }
        for r in records
    ]

def _build_bulk_delete_http_response(result):
    data = result["data"]
    deleted_count = data["deletedCount"]

    # Reverse order of checks to avoid duplication pattern
    if not result["all_failed"] and not result["has_errors"]:
        status_code = 200
    elif result["has_errors"] and not result["all_failed"]:
        status_code = 207
    else:
        status_code = 404

    if deleted_count > 0:
        message = f"Successfully deleted {deleted_count} ISL verse marker(s)"
    else:
        message = "No verse markers were deleted"

    return JSONResponse(
        status_code=status_code,
        content={**data, "message": message},
    )


@router.delete(
    "/verse-markers/bulk-delete",
    response_model=schema.IslVerseMarkersBulkDeleteResponse
)
async def delete_verse_markers_bulk(
    request: schema.IslVerseMarkersBulkDelete,
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Deletes all verse markers for the given ISL Bible IDs."""
    logger.info("DELETE ISL verse markers API")
    validate_admin_only(session)
    await ensure_user_from_session_async(db_session, session)

    result = isl_verse_markers_crud.delete_verse_markers_bulk(
        db_session,
        request.isl_bible_ids
    )

    return _build_bulk_delete_http_response(result)
