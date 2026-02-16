import os
from dotenv import load_dotenv

from supertokens_python import init, InputAppInfo, SupertokensConfig
from supertokens_python.recipe import (
    session,
    emailpassword,
    userroles,
    dashboard,
)
from supertokens_python.framework.fastapi import get_middleware

load_dotenv()

SUPERTOKENS_CONNECTION_URI = os.getenv("SUPERTOKENS_CONNECTION_URI")
SUPERTOKENS_API_KEY = os.getenv("SUPERTOKENS_API_KEY")

API_DOMAIN = os.getenv("API_DOMAIN")
WEBSITE_DOMAIN = os.getenv("WEBSITE_DOMAIN")

if not SUPERTOKENS_CONNECTION_URI:
    raise Exception("SUPERTOKENS_CONNECTION_URI is not set")

if not SUPERTOKENS_API_KEY:
    raise Exception("SUPERTOKENS_API_KEY is not set")

if not API_DOMAIN or not WEBSITE_DOMAIN:
    raise Exception("API_DOMAIN and WEBSITE_DOMAIN must be set")


def init_supertokens():
    init(
        app_info=InputAppInfo(
            app_name="isl-admin",
            api_domain=API_DOMAIN,
            website_domain=WEBSITE_DOMAIN,
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
                cookie_secure=os.getenv("ENV") == "production",  # important fix
                cookie_same_site="lax",
                expose_access_token_to_frontend_in_cookie_based_auth=True,
            ),

            emailpassword.init(),

            userroles.init(),

            dashboard.init()  # enables /auth/dashboard
        ],

        mode="asgi",   # REQUIRED for FastAPI
    )


def get_supertokens_middleware():
    return get_middleware()
