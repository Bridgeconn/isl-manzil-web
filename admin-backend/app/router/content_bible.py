"""Bible Endpoints."""
from typing import Optional,List
from fastapi import (
    APIRouter,
    Depends,
    File,
    UploadFile,
    Form,
)
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from supertokens_python.recipe.session import SessionContainer
from sqlalchemy.orm import Session
import schema
from schema import BibleVersePathParams
from crud import content_bible
from crud import remote_filecheck_crud
from dependencies import get_db, logger
from custom_exceptions import (
    BadRequestException,
    UnprocessableException,
)
from auth import (
    verify_session_with_approval,
    validate_admin_only,
    ensure_user_from_session_async
)
router = APIRouter()


# --- Bible Book Management Endpoints ---

@router.post(
    "/bible",
    response_model=dict,
    tags=["Bible"]
)
async def upload_bible_book(
    resource_id: int = Form(...),
    usfm: UploadFile = File(...),
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Upload a new bible book USFM file"""

    # Get user ID from session
    # Validate USFM file before processing
    logger.info("POST Bible  API")
    validate_admin_only(session)
    actor_id, _ = await ensure_user_from_session_async(db_session, session)
    resource = content_bible.get_resource(db_session, resource_id)

    if resource.content_type.lower() != "bible":
        logger.error(
        "Resource %s is not of type 'bible' (found '%s')",
        resource_id,
        resource.content_type)
        raise BadRequestException(
            detail=(
                f"Resource {resource_id} is not of type 'bible' "
                f"(found '{resource.content_type}')"
            )
        )
    validation_result = await remote_filecheck_crud.validate_usfm_file_internal(usfm)
    logger.info("validate usfm file internal end")
    if not validation_result["valid"]:
        logger.error(validation_result.get("error"))
        raise UnprocessableException(detail=validation_result.get("error"))

    # Pass pre-parsed data to avoid re-parsing
    return await run_in_threadpool(
        content_bible.upload_bible_book,
        db_session=db_session,
        resource_id=resource_id,
        usfm_file=usfm,
        actor_user_id=actor_id,
        pre_parsed_usj_data=validation_result.get("usj_data"),
        usfm_content=validation_result.get("usfm_content"),
    )

@router.put(
    "/bible",
    response_model=dict,
    tags=["Bible"]
)
async def update_bible_book(
    bible_book_id: int = Form(...),
    usfm: UploadFile = File(...),
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Update an existing bible book"""

    logger.info("PUT Bible Books API")
    validate_admin_only(session)
    actor_id, _ = await ensure_user_from_session_async(db_session, session)
    # Validate USFM file AND get parsed data
    validation_result = await remote_filecheck_crud.validate_usfm_file_internal(usfm)
    if not validation_result["valid"]:
        logger.error(validation_result.get("error"))
        raise UnprocessableException(detail=validation_result.get("error"))

    # Pass pre-parsed data to avoid re-parsing
    return await run_in_threadpool(
        content_bible.update_bible_book,
        db_session=db_session,
        bible_book_id=bible_book_id,
        usfm_file=usfm,
        actor_user_id=actor_id,
        pre_parsed_usj_data=validation_result.get("usj_data"),
        usfm_content=validation_result.get("usfm_content"),
    )

@router.delete(
    "/bible/{resource_id}/books",
    response_model=schema.BulkDeleteResponse,
    response_model_exclude_none=True,
    tags=["Bible"]
)
async def delete_bible_books_endpoint(
    resource_id: int,
    delete_request: schema.BulkDeleteRequest,
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Bulk delete Bible books by book codes"""

    logger.info("DELETE Bible Books API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db_session, session)
    result = content_bible.delete_bible_books(
        db_session=db_session,
        resource_id=resource_id,
        book_codes=delete_request.bookCode,
    )
    status_code, response_data = content_bible.build_bulk_delete_response(result)

    return JSONResponse(status_code=status_code, content=response_data)



# --- Bible Content Retrieval Endpoints ---

@router.get(
    "/bible/books",
    response_model=List[schema.BibleBooksListResponse],
    tags=["Bible"]
)
async def get_bible_books(
    resource_id: Optional[int] = None,
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Get list of books for a bible resource"""
    logger.info("GET Bible Books API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db_session, session)
    return content_bible.get_bible_books(db_session, resource_id)



# @router.get(
#     "/bible/{resource_id}/content/{output_format}",
#     response_model=schema.BibleFullContentResponse,
#     tags=["Bible"]
# )
# async def get_full_bible_content(
#     resource_id: int,
#     output_format: str,
#     db_session: Session = Depends(get_db)
# ):
#     """Get full content of all books in a resource in specified format (json/usfm)"""

#     if output_format.lower() not in ["json", "usfm"]:
#         raise BadRequestException("Format must be 'json' or 'usfm'")

#     return content_bible.get_full_bible_content(
#         db_session=db_session,
#         resource_id=resource_id,
#         output_format=output_format
#     )



# @router.get(
#     "/bible/{resource_id}/book/{book_code}/{output_format}",
#     response_model=schema.BibleBookContentResponse,
#     tags=["Bible"]
# )
# async def get_bible_book_content(
#     resource_id: int,
#     book_code: str,
#     output_format: str,
#     db_session: Session = Depends(get_db)
# ):
#     """Get full content of a book in specified format (json/usfm)"""

#     if output_format.lower() not in ["json", "usfm"]:
#         raise BadRequestException("Format must be 'json' or 'usfm'")

#     return content_bible.get_bible_book_content(
#         db_session=db_session,
#         resource_id=resource_id,
#         book_code=book_code,
#         output_format=output_format
#     )

# @router.get(
#     "/bible/{resource_id}/chapter/{book_code}.{chapter}",
#     response_model=schema.BibleChapterResponse,
#     tags=["Bible"]
# )
# async def get_bible_chapter(
#     resource_id: int,
#     book_code: str,
#     chapter: int,
#     db_session: Session = Depends(get_db)
# ):
#     """Get chapter content from bible table"""

#     return content_bible.get_bible_chapter(
#         db_session=db_session,
#         resource_id=resource_id,
#         book_code=book_code,
#         chapter=chapter
#     )

@router.get(
    "/bible/{resource_id}/cleaned/chapter/{book_code}.{chapter}",
    response_model=schema.CleanBibleChapterResponse,
    tags=["Bible"]
)
async def get_clean_bible_chapter(
    resource_id: int,
    book_code: str,
    chapter: int,
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db),
):
    """Get cleaned chapter content from clean_bible table"""
    logger.info("GET Cleaned Bible chapter API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db_session, session)
    return content_bible.get_clean_bible_chapter(
        db_session=db_session,
        resource_id=resource_id,
        book_code=book_code,
        chapter=chapter
    )

async def get_bible_verse_params(
    resource_id: int,
    book_code: str,
    chapter: int,
    verse: int
) -> BibleVersePathParams:
    """Get specific verse content"""
    return BibleVersePathParams(
        resource_id=resource_id,
        book_code=book_code,
        chapter=chapter,
        verse=verse,
    )
@router.get(
    "/bible/{resource_id}/verse/{book_code}.{chapter}.{verse}",
    response_model=schema.BibleVerseResponse,
    tags=["Bible"]
)
async def get_bible_verse(
    params: schema.BibleVersePathParams = Depends(get_bible_verse_params),
    session: SessionContainer = Depends(verify_session_with_approval),
    db_session: Session = Depends(get_db)
):
    """Get specific verse content"""

    logger.info("GET Bible verse API")
    validate_admin_only(session)
    _, _ = await ensure_user_from_session_async(db_session, session)
    return content_bible.get_bible_verse(
        db_session=db_session,
        resource_id=params.resource_id,
        book_code=params.book_code,
        chapter=params.chapter,
        verse=params.verse,
    )
