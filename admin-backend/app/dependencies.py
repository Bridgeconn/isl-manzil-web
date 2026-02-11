""" Dependencides for db,logs"""
import os
import logging
from logging.handlers import RotatingFileHandler
from database import SessionLocal
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
# Directory inside the container
if os.environ.get("DOCKER_RUN")=='True':
    LOG_DIR = "/app/logs"# will be mounted to docker volume
else:
    LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")

os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "vachan_admin_app.log")
# Define and configure logger so that all other modules can use it
handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,  # 10 MB
    backupCount=10,             # keep 10 files
    encoding='utf-8'
)
formatter = logging.Formatter(
    "%(asctime)s %(levelname)s %(name)s %(message)s"
)
handler.setFormatter(formatter)
logger = logging.getLogger()   # root logger
logger.setLevel(LOG_LEVEL)
logger.addHandler(handler)

def get_db():
    """Get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
