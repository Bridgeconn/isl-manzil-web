"""CRUD operations for the ISL verse markers API."""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import db_models
from custom_exceptions import NotAvailableException, AlreadyExistsException
from dependencies import logger


def _ensure_verse_zero(markers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure verse 0 exists."""
    if not any(m["verse"] == 0 for m in markers):
        markers.insert(0, {"verse": 0, "time": "00:00:00:00"})
    return markers

def add_verse_markers(
    db_session: Session,
    isl_bible_id: int,
    markers: List[Dict[str, Any]],
):
    """Creates  verse markers for the given ISL Bible ID."""
    logger.info("Adding ISL verse markers")

    # Check if ISL Bible exists
    isl_bible = db_session.query(db_models.IslBible).filter_by(
        id=isl_bible_id
    ).first()

    if not isl_bible:
        logger.error("ISL Bible %s not found",isl_bible_id)
        raise NotAvailableException(
            detail=f"ISL Bible {isl_bible_id} not found"
        )

    # Check if markers already exist
    existing = db_session.query(db_models.IslVerseMarkers).filter_by(
        isl_id=isl_bible_id
    ).first()

    if existing:
        logger.error("Verse markers already exist for ISL Bible %s",isl_bible_id)
        raise AlreadyExistsException(
            detail=f"Verse markers already exist for ISL Bible {isl_bible_id}"
        )

    markers = _ensure_verse_zero(markers)

    record = db_models.IslVerseMarkers(
        isl_id=isl_bible_id,
        verse_markers_json=markers
    )

    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)

    return record

def update_verse_markers(
    db_session: Session,
    isl_bible_id: int,
    markers: List[Dict[str, Any]],
):
    """Updates  verse markers for the given ISL Bible ID."""
    logger.info("Updating ISL verse markers")

    isl_bible_rec = db_session.query(db_models.IslBible).filter_by(
        id=isl_bible_id
    ).first()

    if not isl_bible_rec:
        logger.error("ISL Bible %s not found",isl_bible_id)
        raise NotAvailableException(
            detail=f"ISL Bible {isl_bible_id} not found"
        )

    record = db_session.query(db_models.IslVerseMarkers).filter_by(
        isl_id=isl_bible_id
    ).first()

    if not record:
        logger.error("Verse markers not found for ISL Bible %s", isl_bible_id)
        raise NotAvailableException(
            detail=f"Verse markers not found for ISL Bible {isl_bible_id}"
        )

    markers = _ensure_verse_zero(markers)
    record.verse_markers_json = markers

    db_session.commit()
    db_session.refresh(record)

    return record

def get_verse_markers(
    db_session: Session,
    isl_bible_id: int,
):
    """Retrieves verse markers for the given islbible id"""
    record = db_session.query(db_models.IslVerseMarkers).filter_by(
        isl_id=isl_bible_id
    ).first()

    if not record:
        logger.error("Verse markers not found for ISL Bible %s",isl_bible_id)
        raise NotAvailableException(
            detail=f"Verse markers not found for ISL Bible {isl_bible_id}"
        )

    return record
def _build_bulk_delete_response(deleted_ids, errors):
    """Build consistent bulk delete response structure."""
    return {
        "data": {"deletedCount": len(deleted_ids),
            "deletedIds": deleted_ids,
            "errors": errors if errors else None,
        },
        "all_failed": len(deleted_ids) == 0 and len(errors) > 0,
        "has_errors": len(errors) > 0,
    }

def delete_verse_markers_bulk(
    db_session: Session,
    isl_bible_ids: List[int],
):
    """Deletes verse markers for the given ISL Bible IDs."""
    logger.info("Deleting ISL verse markers")
    deleted_ids = []
    errors = []

    for isl_id in isl_bible_ids:
        try:
            record = db_session.query(db_models.IslVerseMarkers).filter_by(
                isl_id=isl_id
            ).first()

            if not record:
                logger.error("Verse markers not found for ISL Bible %s",isl_id)
                errors.append(f"Verse markers not found for ISL Bible {isl_id}")
                continue

            db_session.delete(record)
            deleted_ids.append(isl_id)

        except SQLAlchemyError as exc:
            logger.error("Error deleting ISL Bible %s: %s", isl_id, exc)
            errors.append(f"Error deleting ISL Bible {isl_id}: {exc}")

    db_session.commit()

    return _build_bulk_delete_response(deleted_ids, errors)



def get_all_verse_markers(db_session: Session):
    """Get all verse markers without isl bible id"""
    return db_session.query(db_models.IslVerseMarkers).all()
