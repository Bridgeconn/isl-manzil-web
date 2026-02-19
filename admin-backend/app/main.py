"""Main FastAPI application for the ISL-Admin server."""

import os
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from fastapi.middleware.cors import CORSMiddleware
from supertokens_python import get_all_cors_headers
from supertokens_python.framework.fastapi import get_middleware
import supertokens_config  # noqa: F401

from database import init_db
from load_data import load_initial_data
from router.structural import router as structural_router
from router.content_videos_isl import router as content_videos_router

from router.content_bible import router as content_bible_router
from custom_exceptions import BaseCustomException
from schema import StandardErrorResponse

load_dotenv()

# Initialize database
init_db()

# Create FastAPI app
app = FastAPI(
    title="isl-admin",
    version="1.0.0",
    description=(
        "The ISL-Admin server application that provides REST APIs "
        "to access module features."
    ),
)

# Add SuperTokens middleware
app.add_middleware(get_middleware())

# Configure CORS
allowed_origins = [
     # Keep localhost for local dev
     "http://localhost:5173",
     "http://localhost:5174",
    "https://dev-isladmin.vachanengine.org"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type"] + get_all_cors_headers(),
)


@app.exception_handler(BaseCustomException)
async def custom_exception_handler(
    request: Request, exc: BaseCustomException
):
    """Handle custom application exceptions."""
    error_response = StandardErrorResponse(
        error=exc.name,
        details=exc.detail,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
):
    """Handle FastAPI/Pydantic validation errors."""
    raw_errors = exc.errors()
    safe_errors = jsonable_encoder(raw_errors)

    return JSONResponse(
        status_code=422,
        content={"detail": safe_errors},
    )


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "ISL-Admin app is running successfully"}


load_initial_data()
app.include_router(structural_router)
app.include_router(content_videos_router)
app.include_router(content_bible_router)
