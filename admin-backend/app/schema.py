"""Pydantic schemas for  input and output validation."""
from typing import Any, Union,Optional,Dict, List
import re
from enum import Enum
from datetime import datetime

from pydantic import BaseModel,field_validator,Field
from fastapi import Query





class StandardErrorResponse(BaseModel):
    """Standard error response model for custom exceptions"""
    error: str = Field(..., description="Error name or type")
    details: Union[str, Dict[str, Any]]

    class Config:
        """Pydantic config."""
        json_schema_extra = {
            "example": {
                "error": "NotAvailableException",
                "details": "The requested resource was not found"
            }
        }

class ContentTypeEnum(str, Enum):
    """Enumeration of content types."""
    BIBLE = "bible"
    DICTIONARY = "dictionary"
    VIDEO="video"
    ISL_BIBLE = "isl_bible"

# --- Language Schemas ---

class LanguageResponseItem(BaseModel):
    """Schema for returning language information in responses for single language."""
    language_id: int
    language_name: str
    language_code: str
    metadata: Optional[Dict[str, Any]] = None

    model_config = {
        "from_attributes": True
    }

class LanguageResponse(BaseModel):
    """Schema for returning language information in responses."""
    total_items: int
    current_page: int
    items: List[LanguageResponseItem]


class LanguageQueryParams(BaseModel):
    """Query parameters for getting languages."""
    page: int = Query(0, ge=0)
    page_size: int = Query(100, ge=1, le=50000)
    language_name: Optional[str] = None
    language_code: Optional[str] = None
class LanguageBulkDelete(BaseModel):
    """Schema for bulk deleting languages."""
    language_ids: List[int] = Field(..., description="IDs of languages to delete")


class LanguageBulkDeleteResponse(BaseModel):
    """Schema for returning language information in responses."""
    deletedCount: int
    deletedIds: List[int]
    errors: Optional[List[str]] = None
    message: str

class LanguageBase(BaseModel):
    """Base schema for language with shared attributes."""
    language_code: str = Field(..., alias="languageCode")
    language_name: str = Field(..., alias="languageName")
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        example={"key": "value"}
    )


class LanguageCreate(LanguageBase):
    """Schema for creating a new language entry."""

class LanguageUpdate(LanguageBase):
    """Schema for updating an existing language entry."""


class LicenseBulkDelete(BaseModel):
    """Schema for bulk deleting licenses."""
    license_ids: List[int] = Field(..., description="IDs of licenses to delete")

class LicenseBulkDeleteResponse(BaseModel):
    """Schema for returning license information in responses."""
    deletedCount: int
    deletedIds: List[int]
    errors: Optional[List[str]] = None
    message: str

class LicenseUpdate(BaseModel):
    """Schema for updating an existing license entry."""
    license_name: str = Field(..., alias="licenseName")
    details: str

    @field_validator("license_name")
    @classmethod
    def validate_license_name(cls, value: str) -> str:
        """Validate license name."""
        if not value.strip():
            raise ValueError("License name must not be empty or blank")
        if not re.match(r'^[A-Za-z\s\-]+$', value):
            raise ValueError("License name can only contain letters, spaces, and hyphens")
        return value

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "licenseName": "GNU General Public License",
                    "details": (
                        "Permissions of this copyleft license are conditioned on making "
                        "available complete source code"
                    )
                }
            ]
        }
    }

class LicenseResponseItem(BaseModel):
    """Schema for returning license information in responses for single license."""
    license_id: int = Field(alias="license_id")
    license_name: str = Field(alias="license_name")
    details: str = Field(alias="details")

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class LicenseBase(BaseModel):
    """Base schema for license with shared attributes."""
    license_name: str = Field(..., alias="licenseName")
    details: str

    @field_validator("license_name")
    @classmethod
    def validate_license_name(cls, value: str) -> str:
        """Validate license name."""
        if not value.strip():
            raise ValueError("License name must not be empty or blank")
        if not re.match(r'^[A-Za-z\s\-]+$', value):
            raise ValueError("License name can only contain letters, spaces, and hyphens")
        return value


class LicenseCreate(LicenseBase):
    """Schema for creating a new license entry."""
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "licenseName": "MIT License",
                    "details": "A permissive license that is short and to the point"
                },
                {
                    "licenseName": "Apache License 2.0",
                    "details": (
                        "A permissive license whose main conditions require preservation "
                        "of copyright"
                    )

                }
            ]
        }
    }

# --- Version Schemas ---
class VersionBase(BaseModel):
    """Base schema for version with shared attributes."""
    name: str
    abbreviation: str
    metadata: Any = Field(None, alias="meta_data", serialization_alias="metadata")

    @field_validator("name", "abbreviation")
    @classmethod
    def must_be_alphanumeric(cls, value: str) -> str:
        """Validate name and abbreviation."""
        if not value.strip():
            raise ValueError("Field must not be empty or blank")
        if not re.match(r"^[A-Za-z0-9\- ]+$", value):
            raise ValueError("Only letters, numbers, spaces, and hyphens are allowed")
        return value
    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }
class VersionCreate(VersionBase):
    """Schema for creating a new version."""

class VersionUpdate(VersionBase):
    """Schema for updating an existing version."""

class VersionResponse(VersionBase):
    """Schema for returning version information in responses."""
    version_id: int
    model_config = {
        "from_attributes": True
    }
class VersionBulkDelete(BaseModel):
    """Schema for bulk deleting versions."""
    version_ids: List[int] = Field(..., description="IDs of versions to delete")

class VersionBulkDeleteResponse(BaseModel):
    """Schema for returning version information in responses."""
    deletedCount: int
    deletedIds: List[int]
    errors: Optional[List[str]] = None
    message: str



# --- Resource Schemas ---

class ResourceBase(BaseModel):
    """Base schema for resource with shared attributes."""
    version_id: int = Field(..., alias="versionId")
    revision: Optional[str] = None
    content_type: ContentTypeEnum = Field(..., alias="contentType")
    language_id: int = Field(..., alias="languageId")
    license_id: int = Field(..., alias="licenseId")
    metadata: Optional[Dict[str, Any]] = Field(default=None)


    @field_validator("revision")
    @classmethod
    def validate_revision(cls, v: Optional[str]) -> Optional[str]:
        """Validate revision"""
        if v is None:
            return v
        if not v.strip():
            raise ValueError("Revision must not be blank")
        if not re.fullmatch(r"[A-Za-z0-9._-]+", v):
            raise ValueError("Revision may only contain letters, numbers, '.', '_' or '-'")
        return v

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class ResourceFilter(BaseModel):
    """Schema for filtering resources"""
    resource_id: Optional[int] = None
    page: int = 0
    page_size: int = 100
    content_type: Optional[str] = None
    published: Optional[bool] = None

class ResourceCreate(ResourceBase):
    """Schema for POST request to create a new resource"""

class ResourceUpdate(BaseModel):
    """Schema for PUT request to update a resource"""
    resource_id: int = Field(..., alias="resourceId")
    version_id: Optional[int] = Field(None, alias="versionId")
    revision: Optional[str] = None
    content_type: Optional[ContentTypeEnum] = Field(None, alias="contentType")
    language_id: Optional[int] = Field(None, alias="languageId")
    license_id: Optional[int] = Field(None, alias="licenseId")
    metadata: Optional[Dict[str, Any]] = Field(default=None)
    published: Optional[bool]


    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }
class ResourceQueryParams(BaseModel):
    """Query parameters for filtering and paginating resources."""

    resource_id: Optional[int] = Field(
        None,
        description="Filter by a specific resource id"
    )

    page: int = Field(
        0,
        ge=0,
        description="Zero-based page index"
    )

    page_size: int = Field(
        100,
        ge=1,
        le=500,
        description="Items per page"
    )

    content_type: Optional[ContentTypeEnum] = Field(
        None,
        description="Filter by content type",
    )

    published: Optional[bool] = Field(
        None,
        description="Filter by published status (true/false)",
    )
class ResourceBulkDelete(BaseModel):
    """Schema for bulk deleting resources."""
    resource_ids: List[int] = Field(..., description="IDs of resources to delete")

class ResourceBulkDeleteResponse(BaseModel):
    """Schema for returning resource information in responses."""
    deletedCount: int
    deletedIds: List[int]
    errors: Optional[List[str]] = None
    message: str

# --- Nested response objects ---
class VersionRef(BaseModel):
    """Schema for version reference"""
    id: int
    name: str
    code: str

class ContentRef(BaseModel):
    """Schema for content reference"""
    contentType: ContentTypeEnum


class LicenseRef(BaseModel):
    """Schema for license reference"""
    id: int
    name: str


class LanguageBrief(BaseModel):
    """Schema for language reference"""
    id: int
    code:str
    name: str


# --- Response for GET ---
class ResourceRowResponse(BaseModel):
    """Schema for response to GET request"""
    resourceId: int
    resourceName: Optional[str] = None
    revision: Optional[str]
    version: VersionRef
    content: ContentRef
    license: LicenseRef
    metadata: Optional[Dict[str, Any]] = None
    published: bool
    createdBy: Optional[int] = None
    createdTime: datetime
    updatedBy: Optional[int] = None
    updatedTime: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }


# --- Response for POST/PUT ---
class ResourceResponse(BaseModel):
    """Schema for response to POST/PUT request"""
    resourceId: int
    resourceName: Optional[str] = None
    revision: Optional[str]
    version: VersionRef
    content: ContentRef
    license: LicenseRef
    language: LanguageBrief
    metadata: Optional[Dict[str, Any]] = None
    published: bool
    createdBy: Optional[int] = None
    createdTime: datetime
    updatedBy: Optional[int] = None
    updatedTime: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }

class LanguageGroupOut(BaseModel):
    """Schema for response to GET request"""
    language: LanguageBrief
    versions: List[ResourceRowResponse]

#ISL bible videos schema

class IslVideoTestItem(BaseModel):
    """Single ISL Video test result row"""
    islvideoId: int
    book: int
    chapter: int
    url: str
    public: bool

class IslVideoCreateItem(BaseModel):
    """ISL Video create item"""
    book: str            # book code e.g. "gen"
    chapter: Optional[int] = None         # 0 allowed for whole book
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        """Validate url"""
        if not v or not v.strip():
            raise ValueError("URL is required and cannot be empty")
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v
    @field_validator("chapter")
    @classmethod
    def chapter_required(cls, v):
        """Validate chapter"""
        if v is None:
            raise ValueError("chapter is required")
        return v
class IslVideoCreateRequest(BaseModel):
    """ISL Video POST API request schema"""
    resourceId: int
    videos: List[IslVideoCreateItem]

class IslVideoUpdateItem(BaseModel):
    """ISL Video update item"""
    id: int
    book: str
    chapter: Optional[int] = None
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        """Validate url"""
        if not v or not v.strip():
            raise ValueError("URL is required and cannot be empty")
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v
    @field_validator("chapter")
    @classmethod
    def chapter_required(cls, v):
        """Validate chapter"""
        if v is None:
            raise ValueError("chapter is required")
        return v
class IslVideoUpdateRequest(BaseModel):
    """ISL Video POST API request schema"""
    resourceId: int
    videos: List[IslVideoUpdateItem]

class IslVideoResponseItem(BaseModel):
    """ISL Video response item"""
    video_id: int
    book: str
    chapter: int
    url: str
    title: Optional[str] = None
    description: Optional[str] = None

class IslVideoListResponse(BaseModel):
    """ISL Video list response schema"""
    resource_id: int
    videos: List[IslVideoResponseItem]

class IslVideoGetItem(BaseModel):
    """ISL Video get item"""
    video_id: int
    chapter: int
    title: Optional[str] = None
    description: Optional[str] = None
    url: str
class IslVideoGetResponse(BaseModel):
    """ISL Video get response"""
    books: Dict[str, List[IslVideoGetItem]]

class IslVideoDeleteRequest(BaseModel):
    """ISL Video delete request"""
    videoIds: List[int]


class IslVideoDeleteResponse(BaseModel):
    """ISL Video delete response"""
    deletedCount: int
    deletedIds: List[int]
    invalidIds: Optional[List[int]] = None
    message: Optional[str] = None
# Bible schemas
class BibleEntrySchema(BaseModel):
    """Schema for bible entry"""
    resource_id: int
    book_id: int
    usfm_content: str
    usj_data: Dict[str, Any]
    chapter_count: int
class CleanNavigationInput(BaseModel):
    """Schema for bible entry"""
    resource_id: int
    book_code: str
    chapter: int
    bible_record: Optional[object]  # keep type flexible
    available_books: list
    idx: Optional[int]
class CleanPreviousVerseInput(BaseModel):
    """Schema for previous verse"""
    db_session: Any
    resource_id: int
    book: Any
    chapter: int
    verse: int
    available_books: list
    book_index: int | None = None
class CleanNextVerseInput(BaseModel):
    """Schema for next verse"""
    db_session: Any
    resource_id: int
    book: Any
    chapter: int
    verse: int
    available_books: list
    book_index: int | None
    bible_record: Any
class BibleVersePathParams(BaseModel):
    """Schema for bible entry"""
    resource_id: int
    book_code: str
    chapter: int
    verse: int


class BibleUpload(BaseModel):
    """Schema for bible upload"""
    usfm_content: str
    resource_id: int

class BibleUpdate(BaseModel):
    """Schema for bible update"""
    bible_book_id: int

class BibleBookResponse(BaseModel):
    """Schema for bible book response"""
    bible_book_id: int
    book_code: str
    book_id: int
    short: str
    long: str
    abbr: str

class BibleBooksListResponse(BaseModel):
    """Schema for bible books list response"""
    resource_id: int
    books: List[BibleBookResponse]

class BibleBookContentResponse(BaseModel):
    """Schema for bible book content response"""
    resource_id: int
    book_id: int
    book_code: str
    book_content: Any  # Can be USFM string or USJ JSON

class BibleChapterResponse(BaseModel):
    """Schema for bible chapter response"""
    resource_id: int
    bible_book_code: str
    chapter: int
    previous: Optional[Dict[str, Any]] = None
    next: Optional[Dict[str, Any]] = None
    chapter_content: Any

class CleanVerseContent(BaseModel):
    """Schema for clean verse content"""
    verse: int
    text: str

class CleanBibleChapterResponse(BaseModel):
    """Schema for clean bible chapter response"""
    resource_id: int
    bible_book_code: str
    chapter: int
    previous: Optional[Dict[str, Any]] = None
    next: Optional[Dict[str, Any]] = None
    chapter_content: List[CleanVerseContent]

class BibleVerseResponse(BaseModel):
    """Schema for bible verse response"""
    resource_id: int
    bible_book_code: str
    chapter: int
    verse_number: int
    previous: Optional[Dict[str, Any]] = None
    next: Optional[Dict[str, Any]] = None
    verse_content: str

# Response wrapper
class BibleResponse(BaseModel):
    """Schema for bible response"""
    total_items: int
    current_page: int
    items: List[Dict[str, Any]]

class BibleBookData(BaseModel):
    """Schema for bible book data"""
    bible_book_id: int
    book_id: int
    book_code: str
    book_name: str
    chapters: int
    content: Union[dict, str]  # JSON object or USFM string

class BibleFullContentResponse(BaseModel):
    """Schema for bible full content response"""
    resource_id: int
    total_books: int
    books: List[BibleBookData]

class BulkDeleteRequest(BaseModel):
    """Schema for bulk delete request"""
    bookCode: List[str]  # List of book codes like ["GEN", "EXO", "LEV"]

    class Config:
        """Config for BulkDeleteRequest"""
        json_schema_extra = {
            "example": {
                "bookCode": ["GEN", "EXO", "LEV"]
            }
        }

class DeleteResult(BaseModel):
    """Schema for delete result"""
    id: str
    status: str  # "deleted" or "error"
    error: Optional[str] = None

class DeleteSummary(BaseModel):
    """Schema for delete summary"""
    requested: int
    deleted: int
    errors: int

class BulkDeleteResponse(BaseModel):
    """Schema for bulk delete response"""
    resource_id: str
    requested: List[str]
    results: List[DeleteResult]
    summary: DeleteSummary

# --- ISL Verse Markers Schemas ---

class VerseMarkerItem(BaseModel):
    """Schema for verse marker item"""
    verse: int = Field(..., example=0)
    time: str = Field(..., example="00:00:00:00")
class VerseMarkersCreateRequest(BaseModel):
    """Schema for create and update isl marker request"""
    markers: List[VerseMarkerItem]


class VerseMarkersResponse(BaseModel):
    """Schema for bulk delete isl marker response"""
    id: int
    isl_bible_id: int
    markers: List[VerseMarkerItem]
    message: Optional[str] = None

class IslVerseMarkersBulkDelete(BaseModel):
    """Schema for bulk delete isl marker response"""
    isl_bible_ids: List[int]

class IslVerseMarkersBulkDeleteResponse(BaseModel):
    """bulk delete isl marker item"""
    deletedCount: int
    deletedIds: List[int]
    errors: Optional[List[str]]
