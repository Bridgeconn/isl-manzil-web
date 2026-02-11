"""Utilities for CRUD operations."""
from typing import Any, Dict, List
from datetime import datetime, timezone
import json
from sqlalchemy.orm import Session
import db_models
import schema
# from dependencies import logger
from custom_exceptions import (
    AlreadyExistsException,
    NotAvailableException
)



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
