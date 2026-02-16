"""SuperTokens configuration module for ISL-Admin."""

from supertokens_python import init, InputAppInfo, SupertokensConfig
from supertokens_python.recipe import (
    emailpassword,
    session,
    userroles,
    dashboard,
    emailverification,
)
from supertokens_python.ingredients.emaildelivery.types import (
    EmailDeliveryConfig,
    SMTPSettings,
    SMTPSettingsFrom,
)
from dotenv import load_dotenv
import os

load_dotenv()

# === SuperTokens Core Connection ===
CONNECTION_URI = os.getenv(
    "SUPERTOKENS_CONNECTION_URI", "http://localhost:3567"
)

# === Domains & Paths ===
API_DOMAIN = os.getenv("API_DOMAIN", "http://localhost:8000/")
WEBSITE_DOMAIN = os.getenv("WEBSITE_DOMAIN", "http://localhost:5173/")
API_BASE_PATH = os.getenv("SUPERTOKENS_API_BASE_PATH", "/auth")
WEBSITE_BASE_PATH = os.getenv("SUPERTOKENS_WEBSITE_BASE_PATH", "/auth")

# === API Key ===
SUPERTOKENS_API_KEY = os.getenv("SUPERTOKENS_API_KEY")
if not SUPERTOKENS_API_KEY:
    raise Exception("SUPERTOKENS_API_KEY is not set")

if not CONNECTION_URI:
    raise Exception("SUPERTOKENS_CONNECTION_URI is not set")

# === Cookies & Security ===
# Disable anti-CSRF for Swagger testing in staging by setting SUPERTOKENS_ANTI_CSRF=NONE
ANTI_CSRF = os.getenv("SUPERTOKENS_ANTI_CSRF", "VIA_TOKEN")
COOKIE_DOMAIN = os.getenv("SUPERTOKENS_COOKIE_DOMAIN")

# If not explicitly set, infer secure cookies from API domain scheme
if os.getenv("SUPERTOKENS_COOKIE_SECURE") is not None:
    COOKIE_SECURE = (
        os.getenv("SUPERTOKENS_COOKIE_SECURE", "false").lower()
        in ("true", "1", "yes")
    )
else:
    COOKIE_SECURE = API_DOMAIN.startswith("https://")

# SameSite policy; keep default lax unless explicitly overridden
COOKIE_SAME_SITE = os.getenv("SUPERTOKENS_COOKIE_SAME_SITE", "lax")

# === SMTP Configuration ===
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", "1025"))
SMTP_NAME = os.getenv("SMTP_NAME", "ISL Admin")
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "noreply@islapp.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_SECURE = os.getenv("SMTP_SECURE", "false").lower() in ("true", "1", "yes")

# === Email Verification ===
EMAIL_VERIFICATION_MODE = os.getenv(
    "SUPERTOKENS_EMAIL_VERIFICATION_MODE", "OPTIONAL"
)

# === Initialize SMTP Settings ===
smtp_settings = SMTPSettings(
    host=SMTP_HOST,
    port=SMTP_PORT,
    from_=SMTPSettingsFrom(name=SMTP_NAME, email=SMTP_EMAIL),
    password=SMTP_PASSWORD,
    secure=SMTP_SECURE,
)

# === Initialize SuperTokens ===
# This is called automatically when this module is imported
init(
    app_info=InputAppInfo(
        app_name="isl-admin",
        api_domain=API_DOMAIN,
        website_domain=WEBSITE_DOMAIN,
        api_base_path=API_BASE_PATH,
        website_base_path=WEBSITE_BASE_PATH,
    ),
    supertokens_config=SupertokensConfig(
        connection_uri=CONNECTION_URI,
        api_key=SUPERTOKENS_API_KEY,
    ),
    framework="fastapi",
    recipe_list=[
        session.init(
            anti_csrf=ANTI_CSRF,
            cookie_domain=COOKIE_DOMAIN,
            cookie_secure=COOKIE_SECURE,
            cookie_same_site=COOKIE_SAME_SITE,
        ),
        emailpassword.init(
            email_delivery=EmailDeliveryConfig(
                service=emailpassword.SMTPService(
                    smtp_settings=smtp_settings
                )
            )
        ),
        emailverification.init(
            mode=EMAIL_VERIFICATION_MODE,
            email_delivery=EmailDeliveryConfig(
                service=emailverification.SMTPService(
                    smtp_settings=smtp_settings
                )
            ),
        ),
        userroles.init(),
        dashboard.init(),
    ],
    mode="asgi",
)