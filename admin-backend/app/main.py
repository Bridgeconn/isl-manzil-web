"""Main FastAPI application for the ISL-Admin server."""

import os
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

from fastapi.middleware.cors import CORSMiddleware

from supertokens_python import init, InputAppInfo
from supertokens_python.supertokens import SupertokensConfig
from supertokens_python.recipe import (
    emailpassword,
    session,
    userroles,
    dashboard,
)
from supertokens_python.framework.fastapi import get_middleware

from database import init_db
from load_data import load_initial_data
from router.structural import router as structural_router
from custom_exceptions import BaseCustomException
from schema import StandardErrorResponse


load_dotenv()

SUPERTOKENS_CONNECTION_URI = os.getenv("SUPERTOKENS_CONNECTION_URI")
SUPERTOKENS_API_KEY = os.getenv("SUPERTOKENS_API_KEY")


init(
    app_info=InputAppInfo(
        app_name="ISL Admin",
        api_domain=os.getenv("API_DOMAIN", "http://localhost:8000"),
        website_domain=os.getenv("WEBSITE_DOMAIN", "http://localhost:5173"),
        api_base_path="/auth",
        website_base_path="/auth",
    ),

    framework="fastapi",

    supertokens_config=SupertokensConfig(
        connection_uri=SUPERTOKENS_CONNECTION_URI,
        api_key=SUPERTOKENS_API_KEY,
    ),

    recipe_list=[

        session.init(
            cookie_secure=os.getenv("ENV") == "production",
            cookie_same_site="lax",
            expose_access_token_to_frontend_in_cookie_based_auth=True,
        ),

        emailpassword.init(),

        userroles.init(),      
        dashboard.init(),      
    ],

    mode="asgi",
)


init_db()


app = FastAPI(
    title="isl-admin",
    version="1.0.0",
    description=(
        "The ISL-Admin server application that provides REST APIs "
        "to access module features."
    ),
)


app.add_middleware(get_middleware())


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        # "https://admin.yourdomain.com"   # add in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(BaseCustomException)
async def custom_exception_handler(request: Request, exc: BaseCustomException):

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

    raw_errors = exc.errors()
    safe_errors = jsonable_encoder(raw_errors)

    return JSONResponse(
        status_code=422,
        content={"detail": safe_errors},
    )


@app.get("/")
async def root():
    return {"message": "ISL-Admin app is running successfully"}


load_initial_data()
app.include_router(structural_router)

