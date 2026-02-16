"""
This module contains the functions for remote file check crud operations.
"""
from typing import Dict, Any
from usfm_grammar import USFMParser
from fastapi import HTTPException,UploadFile
from fastapi.concurrency import run_in_threadpool
from custom_exceptions import (
    UnprocessableException
)

def _validate_filename(file: UploadFile) -> None:
    if not file.filename:
        raise UnprocessableException(detail="No filename provided")

    if not file.filename.lower().endswith((".usfm", ".sfm")):
        raise UnprocessableException(
            detail="Invalid file type. Expected .usfm or .sfm file."
        )

async def _read_and_validate_content(file: UploadFile) -> str:
    content = await file.read()

    max_size = 10 * 1024 * 1024
    if len(content) > max_size:
        await file.seek(0)
        raise UnprocessableException(detail="File too large (max 10MB)")

    await file.seek(0)

    try:
        usfm_content = content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise UnprocessableException(
            detail="USFM files must be UTF-8 encoded text"
        ) from exc

    if not usfm_content.strip():
        raise UnprocessableException(detail="USFM file is empty")

    if "\x00" in usfm_content:
        raise UnprocessableException(detail="File appears to be binary")

    if "\\id" not in usfm_content:
        raise UnprocessableException(detail="Missing required \\id marker")

    return usfm_content
async def _parse_usfm(usfm_content: str) -> Dict[str, Any]:
    try:
        parser = USFMParser(usfm_content)
        usj_data = await run_in_threadpool(parser.to_usj)

        if not isinstance(usj_data, dict) or "content" not in usj_data:
            raise UnprocessableException(detail="Invalid USFM structure")

        return usj_data

    except HTTPException:
        raise
    except Exception as exc:
        raise UnprocessableException(
            detail=f"Parsing error: {str(exc)}"
        ) from exc
def _extract_book_code(usj_data: Dict[str, Any]) -> str:
    for item in usj_data.get("content", []):
        if item.get("type") == "book" and item.get("marker") == "id":
            code = item.get("code")
            if code:
                return code

    raise UnprocessableException(
        detail="USFM must contain valid book code in \\id"
    )
def _count_chapters(usj_data: Dict[str, Any]) -> int:
    count = sum(
        1 for item in usj_data.get("content", [])
        if item.get("type") == "chapter"
    )

    if count == 0:
        raise UnprocessableException(
            detail="USFM must contain at least one chapter (\\c)"
        )

    return count

async def validate_usfm_file_internal(file: UploadFile) -> Dict[str, Any]:
    """
    INTERNAL VERSION: Validates USFM file and returns full parsed data.
    Used by upload_bible_book() and update_bible_book() to avoid re-parsing.
    
    Returns: {
        'valid': True,
        'book_code': 'PSA',
        'chapter_count': 150,
        'usj_data': {...},           ← Complex nested object
        'usfm_content': '\\id PSA...' ← Raw USFM string
    }
    """
    try:
        _validate_filename(file)

        usfm_content = await _read_and_validate_content(file)

        usj_data = await _parse_usfm(usfm_content)

        book_code = _extract_book_code(usj_data)
        chapter_count = _count_chapters(usj_data)

        return {
            "valid": True,
            "book_code": book_code,
            "chapter_count": chapter_count,
            "usj_data": usj_data,
            "usfm_content": usfm_content,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise UnprocessableException(
            detail=f"File validation error: {str(exc)}"
        ) from exc
