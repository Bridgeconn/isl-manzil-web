"""Structural Endpoints."""
# pylint: disable=unused-argument
from typing import Optional, Union, List
from fastapi import (
    APIRouter,
    Depends,
    Query,
)
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import schema
import db_models
from crud import structural_crud
from auth_dependencies import get_current_user
from dependencies import get_db, logger
from custom_exceptions import (
    NotAvailableException,
)

router = APIRouter()


# --- Version Endpoints ---
@router.get(
    "/versions",
    response_model=Union[schema.VersionResponse, List[schema.VersionResponse]],
    tags=["Version"]
)

async def get_versions(
    version_id: Optional[int] = Query(None),
    abbreviation: Optional[str] = Query(None),
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db),
):
    """Get all versions or a single version by ID."""
    logger.info("GET Version API")
    if version_id is not None or abbreviation is not None:
        db_obj = structural_crud.get_version(db_session, version_id,abbreviation)
        if not db_obj:
            logger.error("Version not found")
            raise NotAvailableException(detail="Version not found")
        return db_obj
    return structural_crud.get_all_versions(db_session)


@router.post("/versions", response_model=schema.VersionResponse,tags=["Version"])
async def create_version(
    version: schema.VersionCreate,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Create a new version."""
    logger.info("POST Version API")
    db_obj = structural_crud.create_version(db_session, version)
    return db_obj


@router.put("/versions/{version_id}", response_model=schema.VersionResponse,tags=["Version"])
async def update_version(
    version_id: int,
    version: schema.VersionUpdate,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Update an existing version by ID."""
    logger.info("PUT Version API")
    db_obj = structural_crud.update_version(db_session,version_id, version)
    return db_obj

@router.delete(
    "/versions/bulk-delete",
    tags=["Version"],
    response_model=schema.VersionBulkDeleteResponse
)
async def delete_versions_bulk(
    request: schema.VersionBulkDelete,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Delete versions by ID."""
    logger.info("DELETE BULK Version API")
    # ---- Auth & role checks ----

    # ---- Business logic ----
    result = structural_crud.delete_versions_bulk(db_session, request.version_ids)

    data = result["data"]
    meta = result.get("meta", {})

    deleted_count = data["deletedCount"]
    deleted_ids = data["deletedIds"]
    errors = data.get("errors")

    not_found = meta.get("not_found", [])
    conflicts = meta.get("conflicts", [])

    # ---- Status code logic ----
    if conflicts and not deleted_ids:
        status_code = 409  # Conflict: versions exist but are in use
    elif not_found and not deleted_ids:
        status_code = 404  # Not Found: versions don’t exist
    elif conflicts or not_found:
        status_code = 207  # Multi-Status: partial success
    else:
        status_code = 200  # All deleted successfully

    # ---- Message ----
    if deleted_count > 0:
        message = f"Successfully deleted {deleted_count} version(s)"
    else:
        message = "No versions were deleted"

    response_data = {
        "deletedCount": deleted_count,
        "deletedIds": deleted_ids,
        "errors": errors,
        "message": message,
    }

    return JSONResponse(
        status_code=status_code,
        content=response_data,
    )

# --- Language Endpoints ---

@router.get(
    "/language",
    response_model=schema.LanguageResponse,
    tags=["Language"]
)
async def get_languages(
    params: schema.LanguageQueryParams = Depends(),
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Get languages with pagination and optional filtering."""
    logger.info("GET Languages API")


    languages, total_items = structural_crud.get_languages_with_pagination(
        db_session=db_session,
        page=params.page,
        page_size=params.page_size,
        language_name=params.language_name,
        language_code=params.language_code,
    )

    if (params.language_name or params.language_code) and total_items == 0:
        logger.error("Language ID or Language doesn't exist")
        raise NotAvailableException(detail="Language ID or Language doesn't exist")

    language_items = [
        schema.LanguageResponseItem(
            language_id=lang.language_id,
            language_name=lang.language_name,
            language_code=lang.language_code,
            metadata=lang.meta_data
        )
        for lang in languages
    ]

    return schema.LanguageResponse(
        total_items=total_items,
        current_page=params.page,
        items=language_items
    )

@router.post(
    "/language",
    response_model=schema.LanguageResponseItem,
    tags=["Language"]
)
async def create_language(
    lang: schema.LanguageCreate,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Create a new language."""
    logger.info("POST Languages API")
    db_obj = structural_crud.create_language(db_session, lang)

    return schema.LanguageResponseItem(
        language_id=db_obj.language_id,
        language_name=db_obj.language_name,
        language_code=db_obj.language_code,
        metadata=db_obj.meta_data
    )

@router.put(
    "/language/{language_id}",
    response_model=schema.LanguageResponseItem,
    tags=["Language"]
)
async def update_language(
    language_id: int,
    lang: schema.LanguageUpdate,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Update an existing language."""
    logger.info("PUT Languages API")
    # Check if language exists before attempting to update
    language_obj = structural_crud.get_language(db_session, language_id)
    if not language_obj:
        logger.error("Language ID or Language doesn't exist")
        raise NotAvailableException(detail="Language ID or Language doesn't exist")

    db_obj = structural_crud.update_language(db_session, language_id, lang)

    return schema.LanguageResponseItem(
        language_id=db_obj.language_id,
        language_name=db_obj.language_name,
        language_code=db_obj.language_code,
        metadata=db_obj.meta_data
    )

@router.delete(
    "/languages/bulk-delete",
    tags=["Language"],
    response_model=schema.LanguageBulkDeleteResponse
)
async def delete_languages_bulk(
    request: schema.LanguageBulkDelete,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Delete multiple languages."""
    logger.info("DELETE BULK Language API")


    result = structural_crud.delete_languages_bulk(db_session, request.language_ids)

    deleted_count = result["data"]["deletedCount"]

    # ---- Status logic (same as videos & versions) ----
    if result["all_failed"]:
        status_code = 404
    elif result["has_errors"]:
        status_code = 207
    else:
        status_code = 200

    # Add message
    message = (
        f"Successfully deleted {deleted_count} language(s)"
        if deleted_count > 0
        else "No languages were deleted"
    )

    response_data = {
        **result["data"],
        "message": message
    }

    return JSONResponse(
        status_code=status_code,
        content=response_data
    )

# --- License Endpoints ---
@router.get(
    "/license",
    response_model=List[schema.LicenseResponseItem],
    tags=["License"]
)
async def get_licenses(
    license_id: Optional[int] = Query(None, description="Filter by license ID"),
    name: Optional[str] = Query(None, description="Filter by license name (partial match)"),
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Get licenses with optional filtering."""
    logger.info("GET License API")
    licenses = structural_crud.get_licenses_with_filters(
        db_session=db_session,
        license_id=license_id,
        name=name
    )

    # Transform to response format
    return [schema.LicenseResponseItem.model_validate(license) for license in licenses]

@router.post(
    "/license",
    response_model=schema.LicenseResponseItem,
    tags=["License"]
)
async def create_license(
    license_: schema.LicenseCreate,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Create a new license."""
    logger.info("POST License API")
    db_obj = structural_crud.create_license(db_session, license_)

    return schema.LicenseResponseItem.model_validate(db_obj)

@router.put(
    "/license/{license_id}",
    response_model=schema.LicenseResponseItem,
    tags=["License"]
)
async def update_license(
    license_id: int,
    license_: schema.LicenseUpdate,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Update an existing license."""
    logger.info("PUT License API")
    # Check if license exists before attempting to update
    license_obj = structural_crud.get_license(db_session, license_id)
    if not license_obj:
        logger.error("License ID doesn't exist")
        raise NotAvailableException(detail="License ID doesn't exist")

    db_obj = structural_crud.update_license(db_session, license_id, license_)

    return schema.LicenseResponseItem.model_validate(db_obj)

@router.delete(
    "/license/bulk-delete",
    tags=["License"],
    response_model=schema.LicenseBulkDeleteResponse
)
async def delete_licenses_bulk(
    request: schema.LicenseBulkDelete,
    current_user: db_models.User = Depends(get_current_user),
    db_session: Session = Depends(get_db)
):
    """Delete multiple licenses."""
    logger.info("DELETE BULK License API")


    result = structural_crud.delete_licenses_bulk(db_session, request.license_ids)

    deleted_count = result["data"]["deletedCount"]

    # ---- Status code logic ----
    if result["all_failed"]:
        status_code = 404
    elif result["has_errors"]:
        status_code = 207
    else:
        status_code = 200

    # ---- Message ----
    message = (
        f"Successfully deleted {deleted_count} license(s)"
        if deleted_count > 0
        else "No licenses were deleted"
    )

    response_data = {
        **result["data"],
        "message": message
    }

    return JSONResponse(
        status_code=status_code,
        content=response_data
    )


# --- Resource Endpoints ---
@router.get(
    "/resources",
    response_model=List[schema.LanguageGroupOut],
    tags=["Resource"]
)
async def list_resources_route(
    params: schema.ResourceQueryParams = Depends(),
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get resources with pagination and optional filtering."""
    logger.info("GET Resource API")

    filters = schema.ResourceFilter(
        resource_id=params.resource_id,
        page=params.page,
        page_size=params.page_size,
        published=params.published,
        content_type=params.content_type.value.lower() if params.content_type else None,
    )

    return structural_crud.get_resources(db, filters)

@router.post("/resources", response_model=schema.ResourceResponse, tags=["Resource"])
async def create_resource_route(
    payload: schema.ResourceCreate,
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ API endpoint to create a new resource."""
    logger.info("POST Resource API")
    return structural_crud.create_resource(db, payload)



@router.put("/resources", response_model=schema.ResourceResponse, tags=["Resource"])
async def update_resource_route(
    payload: schema.ResourceUpdate,
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """ API endpoint to update a resource."""
    logger.info("PUT Resource API")
    return structural_crud.update_resource(db, payload)

@router.delete(
    "/resources/bulk-delete",
    tags=["Resource"],
    response_model=schema.ResourceBulkDeleteResponse
)
async def delete_resources_bulk(
    request: schema.ResourceBulkDelete,
    current_user: db_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete multiple resources."""
    logger.info("DELETE BULK Resource API")


    result = structural_crud.delete_resources_bulk(db, request.resource_ids)

    deleted_count = result["data"]["deletedCount"]

    # ---- Status Code Logic ----
    if result["all_failed"]:
        status_code = 404
    elif result["has_errors"]:
        status_code = 207
    else:
        status_code = 200

    # ---- Message ----
    message = (
        f"Successfully deleted {deleted_count} resource(s)"
        if deleted_count > 0
        else "No resources were deleted"
    )

    response_data = {
        **result["data"],
        "message": message
    }

    return JSONResponse(
        status_code=status_code,
        content=response_data
    )
