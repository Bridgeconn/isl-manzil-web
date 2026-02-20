"""This module contains the functions for version,language,license,resource crud operations."""
from datetime import datetime, timezone
import json
from typing import List, Optional, Tuple
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, aliased
import db_models
import schema
from custom_exceptions import (
    AlreadyExistsException,
    NotAvailableException,
    UnprocessableException,
)
from dependencies import logger
from crud.utils import (
    _group_resources,
    _resolve_final_values,
    _validate_uniqueness,
    _validate_and_get,
    _build_response,
)

def utcnow():
    """Returns current UTC datetime"""
    return datetime.now(timezone.utc)

# --- Version CRUD ---
def get_all_versions(db_session: Session):
    """Retrieve all versions from the database."""
    return db_session.query(db_models.Version).order_by(db_models.Version.version_id).all()

def get_version(db_session: Session, version_id: int,abbreviation: Optional[str] = None):
    """Retrieve a single version by ID."""
    query = db_session.query(db_models.Version)
    if version_id is not None:
        query = query.filter(db_models.Version.version_id == version_id)

    if abbreviation is not None:
        query = query.filter(db_models.Version.abbreviation == abbreviation)

    return query.first()

def create_version(db_session: Session, version: schema.VersionCreate):
    """Create a new version with checks for duplicate name and abbreviation."""
    # Check for duplicate name
    if db_session.query(db_models.Version).filter(
        func.lower(db_models.Version.name) == func.lower(version.name)).first():
        logger.error("Version with the same name already exists")
        raise AlreadyExistsException(detail="Version with the same name already exists")

    # Check for duplicate abbreviation
    existing = db_session.query(db_models.Version).filter(
        func.lower(db_models.Version.abbreviation) == func.lower(version.abbreviation)).first()
    if existing:
        logger.error("Version with the same abbreviation already exists")
        raise AlreadyExistsException(detail="Version with the same abbreviation already exists")
    # db_obj = db_models.Version(**version.model_dump(by_alias=True))
    db_obj = db_models.Version(
        name=version.name,
        abbreviation=version.abbreviation,
        meta_data=version.metadata
    )
    db_session.add(db_obj)
    db_session.commit()
    db_session.refresh(db_obj)
    return db_obj

def update_version(db_session: Session, version_id: int, version: schema.VersionUpdate):
    """Update an existing version by ID with detailed duplicate checks."""
    db_obj = get_version(db_session, version_id)
    if not db_obj:
        logger.error("Version not found")
        raise NotAvailableException(detail="Version not found")
    # Check for duplicate name
    if db_session.query(db_models.Version).filter(
        func.lower(db_models.Version.name) == func.lower(version.name),
        db_models.Version.version_id != version_id
    ).first():
        logger.error("Version with the same name already exists")
        raise AlreadyExistsException(detail="Version with the same name already exists")
    # Check for duplicate abbreviation
    if db_session.query(db_models.Version).filter(
        func.lower(db_models.Version.abbreviation)== func.lower(version.abbreviation),
        db_models.Version.version_id != version_id
    ).first():
        logger.error("Version with the same abbreviation already exists")
        raise AlreadyExistsException(detail="Version with the same abbreviation already exists")
    db_obj.name = version.name
    db_obj.abbreviation = version.abbreviation
    db_obj.meta_data = version.metadata
    db_session.commit()
    db_session.refresh(db_obj)
    return db_obj
def delete_versions_bulk(db_session: Session, version_ids: List[int]):
    """Delete multiple versions by ID."""
    deleted_ids = []
    errors = []
    not_found = []
    conflicts = []

    for vid in version_ids:
        obj = get_version(db_session, vid)
        if not obj:
            not_found.append(vid)
            errors.append(f"Version {vid} not found")
            continue

        used_resources = (
            db_session.query(db_models.Resource)
            .filter_by(version_id=vid)
            .all()
        )

        if used_resources:
            conflicts.append(vid)
            errors.append(
                f"Version {obj.name} (id: {vid}) is in use and cannot be deleted"
            )
            continue

        try:
            db_session.delete(obj)
            deleted_ids.append(vid)
        except SQLAlchemyError as exc:
            errors.append(
                f"Version {obj.name} (id: {vid}) could not be deleted: {str(exc)}"
            )

    db_session.commit()

    return {
        "data": {
            "deletedCount": len(deleted_ids),
            "deletedIds": deleted_ids,
            "errors": errors if errors else None,
        },
        "meta": {
            "not_found": not_found,
            "conflicts": conflicts,
        }
    }

# ---Language CRUD ---
def get_languages_with_pagination(
    db_session: Session,
    page: int = 0,
    page_size: int = 100,
    language_name: Optional[str] = None,
    language_code: Optional[str] = None
) -> Tuple[List[db_models.Language], int]:
    """Retrieve languages with pagination and optional filtering."""
    query = db_session.query(db_models.Language)
    # Apply filters if provided
    filters = []
    if language_name:
        filters.append(db_models.Language.language_name.ilike(f"%{language_name}%"))
    if language_code:
        filters.append(db_models.Language.language_code.ilike(f"%{language_code}%"))
    if filters:
        query = query.filter(or_(*filters))

    # Get total count before pagination
    total_items = query.count()
    # Apply ordering and pagination
    offset = page * page_size
    languages = query.order_by(
        db_models.Language.language_id.asc()).offset(offset).limit(page_size).all()

    return languages, total_items
def get_language(db_session: Session, language_id: int):
    """Retrieve a single language by ID."""
    return db_session.query(db_models.Language).filter(
        db_models.Language.language_id == language_id
    ).first()

def create_language(db_session: Session, lang: schema.LanguageCreate):
    """Create a new language if it does not already exist."""
    # Additional validation for required fields
    if not lang.language_name or lang.language_name.strip() == "":
        logger.error("Language name is required")
        raise UnprocessableException(detail="Language name is required")
    if not lang.language_code or lang.language_code.strip() == "":
        logger.error("Language code is required")
        raise UnprocessableException(detail="Language code is required")

    # Check for existing language code
    if db_session.query(db_models.Language).filter(
        db_models.Language.language_code == lang.language_code
    ).first():
        raise AlreadyExistsException(detail="Language code already exists")

    # Check for existing language name
    if db_session.query(db_models.Language).filter(
        db_models.Language.language_name == lang.language_name
    ).first():
        raise AlreadyExistsException(detail="Language name already exists")

    # Create new language object
    db_obj = db_models.Language(
        language_code=lang.language_code,
        language_name=lang.language_name,
        meta_data=lang.metadata
    )
    db_session.add(db_obj)
    db_session.commit()
    db_session.refresh(db_obj)
    return db_obj

def update_language(db_session: Session, language_id: int, lang: schema.LanguageUpdate):
    """Update an existing language by ID with duplicate code check."""
    db_obj = get_language(db_session, language_id)
    if not db_obj:
        raise NotAvailableException(detail="Language not found")

    # Additional validation for required fields
    if not lang.language_name or lang.language_name.strip() == "":
        raise UnprocessableException(detail="Language name is required")
    if not lang.language_code or lang.language_code.strip() == "":
        raise UnprocessableException(detail="Language code is required")

    # Check duplicate code (exclude current record)
    if db_session.query(db_models.Language).filter(
        db_models.Language.language_code == lang.language_code,
        db_models.Language.language_id != language_id
    ).first():
        raise AlreadyExistsException(detail="Language code already exists")

    # Check duplicate name (exclude current record)
    if db_session.query(db_models.Language).filter(
        db_models.Language.language_name == lang.language_name,
        db_models.Language.language_id != language_id
    ).first():
        raise AlreadyExistsException(detail="Language name already exists")

    # Update fields
    db_obj.language_code = lang.language_code
    db_obj.language_name = lang.language_name
    db_obj.meta_data = lang.metadata
    db_session.commit()
    db_session.refresh(db_obj)
    return db_obj
def delete_languages_bulk(db_session: Session, language_ids: List[int]):
    """Delete multiple languages by ID."""
    deleted_ids = []
    errors = []

    for lid in language_ids:
        try:
            db_obj = get_language(db_session, lid)
            if not db_obj:
                errors.append(f"Language {lid} not found")
                continue

            used_resources = (
                db_session.query(db_models.Resource)
                .filter_by(language_id=lid)
                .all()
            )

            if used_resources:
                errors.append(
                    f"Language {lid} ('{db_obj.language_name}') is in use and cannot be deleted"
                )
                continue

            db_session.delete(db_obj)
            deleted_ids.append(lid)

        except SQLAlchemyError as exc:
            errors.append(f"Error deleting language {lid}: {str(exc)}")

    db_session.commit()

    # Consistent structure like delete_videos & delete_versions_bulk
    all_failed = len(deleted_ids) == 0 and len(errors) > 0
    has_errors = len(errors) > 0

    return {
        "data": {
            "deletedCount": len(deleted_ids),
            "deletedIds": deleted_ids,
            "errors": errors if errors else None,
        },
        "all_failed": all_failed,
        "has_errors": has_errors,
    }

# ---Licenses CRUD ---
def get_licenses_with_filters(
    db_session: Session,
    license_id: Optional[int] = None,
    name: Optional[str] = None
) -> List[db_models.License]:
    """Retrieve licenses with optional filtering."""
    query = db_session.query(db_models.License)

    # Apply filters if provided
    if license_id is not None:
        query = query.filter(db_models.License.license_id == license_id)

    if name:
        query = query.filter(db_models.License.license_name.ilike(f"%{name}%"))

    # Order by license_id for consistent results
    return query.order_by(db_models.License.license_id.asc()).all()

def get_license(db_session: Session, license_id: int):
    """Retrieve a single license by ID."""
    return db_session.query(db_models.License).filter(
        db_models.License.license_id == license_id
    ).first()

def create_license(db_session: Session, license_: schema.LicenseCreate):
    """Create a new license if it does not already exist."""
    # Additional validation for required fields
    if not license_.license_name or license_.license_name.strip() == "":
        raise UnprocessableException(detail="License name is required")
    if not hasattr(license_, 'details') or not license_.details or license_.details.strip() == "":
        raise UnprocessableException(detail="License details are required")

    existing = db_session.query(db_models.License).filter(
        db_models.License.license_name == license_.license_name
    ).first()
    if existing:
        raise AlreadyExistsException(detail="License already exists")

    db_obj = db_models.License(
        license_name=license_.license_name,
        details=license_.details
    )
    db_session.add(db_obj)
    db_session.commit()
    db_session.refresh(db_obj)
    return db_obj

def update_license(db_session: Session, license_id: int, license_: schema.LicenseUpdate):
    """Update an existing license by ID with duplicate name check."""
    db_obj = get_license(db_session, license_id)
    if not db_obj:
        raise NotAvailableException(detail="License not found")

    # Additional validation for required fields
    if not license_.license_name or license_.license_name.strip() == "":
        raise UnprocessableException(detail="License name is required")
    if not hasattr(license_, 'details') or not license_.details or license_.details.strip() == "":
        raise UnprocessableException(detail="License details are required")

    # Check duplicate name (exclude current record)
    duplicate = db_session.query(db_models.License).filter(
        db_models.License.license_name == license_.license_name,
        db_models.License.license_id != license_id
    ).first()
    if duplicate:
        raise AlreadyExistsException(detail="License name already exists")

    # Update fields
    db_obj.license_name = license_.license_name
    db_obj.details = license_.details

    db_session.commit()
    db_session.refresh(db_obj)
    return db_obj
def delete_licenses_bulk(db_session: Session, license_ids: List[int]):
    """Delete multiple licenses by ID."""
    deleted_ids = []
    errors = []

    for lid in license_ids:
        try:
            db_obj = get_license(db_session, lid)
            if not db_obj:
                errors.append(f"License {lid} not found")
                continue

            used_resources = (
                db_session.query(db_models.Resource)
                .filter_by(license_id=lid)
                .all()
            )

            if used_resources:
                errors.append(
                    f"License {lid} ('{db_obj.license_name}') is in use and cannot be deleted"
                )
                continue

            db_session.delete(db_obj)
            deleted_ids.append(lid)

        except SQLAlchemyError as exc:
            errors.append(f"Error deleting license {lid}: {str(exc)}")

    db_session.commit()

    # Consistent response structure
    all_failed = len(deleted_ids) == 0 and len(errors) > 0
    has_errors = len(errors) > 0

    return {
        "data": {
            "deletedCount": len(deleted_ids),
            "deletedIds": deleted_ids,
            "errors": errors if errors else None,
        },
        "all_failed": all_failed,
        "has_errors": has_errors,
    }
# ---Resource CRUD ---
def get_resources(
    db: Session,
    filters: schema.ResourceFilter
) -> List[schema.LanguageGroupOut]:
    """
    Retrieve a list of resources grouped by language.
    """

    lang_alias = aliased(db_models.Language)
    ver_alias  = aliased(db_models.Version)
    lic_alias  = aliased(db_models.License)

    query = (
        db.query(db_models.Resource, lang_alias, ver_alias, lic_alias)
        .join(lang_alias, lang_alias.language_id == db_models.Resource.language_id)
        .join(ver_alias, ver_alias.version_id == db_models.Resource.version_id)
        .join(lic_alias, lic_alias.license_id == db_models.Resource.license_id)
    )

    if filters.resource_id:
        query = query.filter(db_models.Resource.resource_id == filters.resource_id)

    if filters.content_type:
        query = query.filter(db_models.Resource.content_type == filters.content_type.lower())

    if filters.published is not None:
        query = query.filter(db_models.Resource.published == filters.published)

    rows = (
        query.order_by(db_models.Resource.resource_id.asc())
        .offset(filters.page * filters.page_size)
        .limit(filters.page_size)
        .all()
    )

    if filters.resource_id and not rows:
        raise NotAvailableException(detail="Resource not found")

    return _group_resources(rows)
def create_resource(
    db: Session,
    payload: schema.ResourceCreate,
    created_by: Optional[int] = None) -> schema.ResourceResponse:
    """Create a new resource and return response schema."""
    # Check if resource already exists
    ct = payload.content_type.value.lower()
    now = utcnow()
    existing = (
        db.query(db_models.Resource)
        .filter_by(
            version_id=payload.version_id,
            language_id=payload.language_id,
            license_id=payload.license_id,
            revision=payload.revision,
            content_type=payload.content_type.value.lower(),
        )
        .first()
    )
    if existing:
        raise AlreadyExistsException(detail="Resource already exists")
    version = db.query(db_models.Version).filter_by(version_id=payload.version_id).first()
    if not version:
        raise NotAvailableException(detail="versionId not found")
    language = db.query(db_models.Language).filter_by(language_id=payload.language_id).first()
    if not language:
        raise NotAvailableException(detail="languageId not found")
    license_ = db.query(db_models.License).filter_by(license_id=payload.license_id).first()
    if not license_:
        raise NotAvailableException(detail="licenseId not found")
    ct = payload.content_type.value.lower()

    db_obj = db_models.Resource(
        version_id=payload.version_id,
        revision=payload.revision,
        content_type=ct,
        language_id=payload.language_id,
        license_id=payload.license_id,
        meta_data=json.dumps(payload.metadata, ensure_ascii=False) if payload.metadata else None,
        created_by=created_by,
        created_at=now,
        published=bool(getattr(payload, "published", False)),
        # published=False,  # always default to False on POST
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)

    now = utcnow()

    return _build_response(db_obj, version, language, license_)


def update_resource(
    db: Session,
    payload: schema.ResourceUpdate,
    user_id: Optional[int] = None
) -> schema.ResourceResponse:
    """Update resource and return response schema."""
    db_obj = _get_resource_or_404(db, payload.resource_id)

    # Determine final values for uniqueness validation
    final_values = _resolve_final_values(db_obj, payload)

    _validate_uniqueness(db, payload.resource_id, final_values)

    # Update main resource fields
    version, language, license_ = _apply_updates(db, db_obj, payload)

    # Extra fields
    if payload.metadata is not None:
        db_obj.meta_data = json.dumps(payload.metadata, ensure_ascii=False)
    if payload.published is not None:
        db_obj.published = bool(payload.published)

    db_obj.updated_by = user_id
    db_obj.updated_at = utcnow()

    db.commit()
    db.refresh(db_obj)

    return _build_response(db_obj, version, language, license_)

def _get_resource_or_404(db: Session, resource_id: int):
    obj = db.query(db_models.Resource).filter_by(resource_id=resource_id).first()
    if not obj:
        raise NotAvailableException(detail="Resource not found")
    return obj
def _apply_updates(db: Session, db_obj, payload):
    # Version
    version = _validate_and_get(
        db,
        db_models.Version,
        payload.version_id or db_obj.version_id, "versionId")
    db_obj.version_id = version.version_id

    # Language
    language = _validate_and_get(
        db,
        db_models.Language,
        payload.language_id or db_obj.language_id, "languageId"
    )
    db_obj.language_id = language.language_id

    # License
    license_ = _validate_and_get(
        db,
        db_models.License,
        payload.license_id or db_obj.license_id, "licenseId"
    )
    db_obj.license_id = license_.license_id

    # Revision & content type
    if payload.revision is not None:
        db_obj.revision = payload.revision
    if payload.content_type is not None:
        db_obj.content_type = payload.content_type.value.lower()

    return version, language, license_
def delete_resources_bulk(db: Session, resource_ids: List[int]):
    """Delete multiple resources."""
    deleted_ids = []
    errors = []

    related_models = [
        db_models.Bible,
        db_models.CleanBible,
        db_models.Dictionary,
        db_models.IslBible,
    ]

    for rid in resource_ids:
        try:
            db_obj = (
                db.query(db_models.Resource)
                .filter_by(resource_id=rid)
                .first()
            )

            if not db_obj:
                errors.append(f"Resource {rid} not found")
                continue

            # Delete dependent entities first
            for model in related_models:
                db.query(model).filter_by(resource_id=rid).delete(
                    synchronize_session=False
                )

            # Delete main resource
            db.delete(db_obj)
            deleted_ids.append(rid)

        except IntegrityError:
            db.rollback()
            errors.append(
                f"Resource {rid} could not be deleted due to database constraints"
            )

        except SQLAlchemyError as exc:
            db.rollback()
            errors.append(f"Error deleting resource {rid}: {str(exc)}")

    db.commit()

    # ---- Consistent structure ----
    all_failed = len(deleted_ids) == 0 and len(errors) > 0
    has_errors = len(errors) > 0

    return {
        "data": {
            "deletedCount": len(deleted_ids),
            "deletedIds": deleted_ids,
            "errors": errors if errors else None,
        },
        "all_failed": all_failed,
        "has_errors": has_errors,
    }
