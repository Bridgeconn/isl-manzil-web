from typing import List
from pydantic import BaseModel, Field

class BooksDelete(BaseModel):
    books: List[str] = Field(..., description="List of book codes to delete verse markers for")

    class Config:
        json_schema_extra = {
            "example": {
                "books": ["GEN", "EXO", "LEV"]
            }
        }

class VerseMarkerResponse(BaseModel):
    status: str = Field(..., example="success")
    message: str = Field(..., example="Verse markers uploaded successfully.")
    data: dict | None = Field(None, example={"total_files": 10, "inserted_rows": 320})
