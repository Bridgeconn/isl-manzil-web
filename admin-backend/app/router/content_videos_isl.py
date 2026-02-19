""" API endpoint for videos """
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)
from fastapi.responses import JSONResponse
from supertokens_python.recipe.session import SessionContainer
from supertokens_python.recipe.session.framework.fastapi import verify_session
from sqlalchemy.orm import Session
import schema
from crud import content_videos
from dependencies import get_db, logger
from auth import (
    verify_session_with_approval,
    ensure_user_from_session_async,
    validate_admin_only
)
router = APIRouter()



# --- ISL Bible Video Endpoints ---
@router.post("/isl-bible", response_model=schema.IslVideoListResponse, tags=["ISL Videos"])
async def api_create_isl_videos(
    payload: schema.IslVideoCreateRequest,
    db: Session = Depends(get_db),
    session: SessionContainer = Depends(verify_session_with_approval)
):
    """Create isl bible"""
    logger.info("POST ISL BIBLE API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db, session)
    return content_videos.create_isl_videos(db, payload)


@router.put("/isl-bible", response_model=schema.IslVideoListResponse, tags=["ISL Videos"])
async def api_update_isl_videos(
    payload: schema.IslVideoUpdateRequest,
    db: Session = Depends(get_db),
    session: SessionContainer = Depends(verify_session_with_approval)
):
    """Create isl bible"""
    logger.info("PUT ISL BIBLE API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db, session)
    return content_videos.update_isl_videos(db, payload)


@router.get("/isl-bible",
            response_model=schema.IslVideoGetResponse, tags=["ISL Videos"])
async def api_get_isl_videos(
    resource_id: Optional[int] = Query(None),
    #make this noptionl bookcode
    book_code: Optional[str] = Query(None, description="book code, e.g. 'gen'"),
    chapter: Optional[int] = Query(None, description="chapter number (0 for whole book)"),
    db: Session = Depends(get_db),
    session: SessionContainer = Depends(verify_session_with_approval)
):
    """get isl bible according to resource id,book code,chapter"""
    logger.info("GET ISL BIBLE API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db, session)
    return content_videos.get_isl_videos(db, resource_id, book_code, chapter)

@router.delete(
    "/isl-bible/{resource_id}",
    tags=["ISL Videos"],
    response_model=schema.IslVideoDeleteResponse
)
async def api_delete_isl_videos(
    resource_id: int,
    payload: schema.IslVideoDeleteRequest,
    db: Session = Depends(get_db),
    session: SessionContainer = Depends(verify_session_with_approval)
):
    """delete isl bible"""
    logger.info("DELETE ISL BIBLE API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db, session)

    result = content_videos.delete_isl_videos(db, resource_id, payload.videoIds)

    deleted = result["deleted_count"]
    deleted_ids = result["deleted_ids"]
    invalid_ids = result["invalid_ids"]

    # Case 1: All invalid → 422
    if deleted == 0 and invalid_ids:
        raise HTTPException(
            status_code=422,
            detail={
                "deletedCount": 0,
                "deletedIds": [],
                "invalidIds": invalid_ids,
                "message": "No valid video_ids found"
            }
        )

    # Case 2: Partial success → 207
    if deleted > 0 and invalid_ids:
        return JSONResponse(
            status_code=207,
            content={
                "deletedCount": deleted,
                "deletedIds": deleted_ids,
                "invalidIds": invalid_ids,
                "message": "Partially deleted videos"
            }
        )

    # Case 3: Full success → 200
    return {
        "deletedCount": deleted,
        "deletedIds": deleted_ids,
        "invalidIds": [],
        "message": f"Successfully deleted {deleted} videos"
    }
