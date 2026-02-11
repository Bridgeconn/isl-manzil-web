"""Database connection"""
import urllib
import os
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from db_models import Base


postgres_host = os.environ.get("ISL_ADMIN_POSTGRES_HOST", "localhost")
postgres_user = os.environ.get("ISL_ADMIN_POSTGRES_USER", "postgres")
postgres_database = os.environ.get("ISL_ADMIN_POSTGRES_DATABASE", "isl_admin_db")
postgres_password = os.environ.get("ISL_ADMIN_POSTGRES_PASSWORD", "secret")
postgres_port = os.environ.get("ISL_ADMIN_POSTGRES_PORT", "5432")

encoded_password = urllib.parse.quote(postgres_password, safe='')
# Build the SQLAlchemy connection URL for PostgreSQL (psycopg2 driver)
SQLALCHEMY_DATABASE_URL = (
    f"postgresql+psycopg2://{postgres_user}:{encoded_password}@"
    f"{postgres_host}:{postgres_port}/{postgres_database}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_size=10, max_overflow=20)
conn = engine.connect()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) # pylint: disable=invalid-name

# Create Tables in Database
def init_db():
    """Initialize the database"""
    Base.metadata.create_all(bind=engine)
   