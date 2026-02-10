"""Main FastAPI application for the ISL-Admin server."""
from fastapi import FastAPI,Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from load_data import load_initial_data
from router.structural import router as structural_router
from custom_exceptions import BaseCustomException
from schema import StandardErrorResponse


init_db()

app = FastAPI(
    title="isl-admin",
    version="1.0.0",
    description=(
        "The ISL-Admin server application that provides REST APIs to access "
        "the features provided by the module."
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(BaseCustomException)
async def custom_exception_handler(request: Request, exc: BaseCustomException):
    """
    Handle all custom exceptions (NotAvailableException, BadRequestException, etc.)
    and log them to the error_log table.
    """
    # await log_error_to_db(
    #     request,
    #     exc,
    #     status_code=exc.status_code,
    #     message=str(exc.detail),
    # )

    error_response = StandardErrorResponse(
        error=exc.name,
        details=exc.detail,
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Log FastAPI/Pydantic validation errors as 422 and
    return the usual {"detail": [...]} structure.
    """
    raw_errors = exc.errors()  # list[dict]

    # Make sure everything is JSON-serializable
    safe_errors = jsonable_encoder(raw_errors)

    # Build a clean message for logging: join all "msg" strings
    msg_list = [err.get("msg", "") for err in raw_errors]
    clean_message = " | ".join(m for m in msg_list if m)

    # Try logging — but NEVER let logging break the response
    # try:
    #     await log_error_to_db(
    #         request,
    #         exc,
    #         status_code=422,
    #         message=clean_message or str(raw_errors),
    #     )
    # except Exception as logging_err:  # pylint: disable=broad-exception-caught
    #     print("ErrorLog: unexpected error while logging validation error:", logging_err)

    return JSONResponse(
        status_code=422,
        content={"detail": safe_errors},
    )

@app.get("/")
async def root():
    """Simple health-check endpoint to verify the app is running."""
    return {"message": "ISL-Admin app is running successfully"}

load_initial_data()
app.include_router(structural_router)
