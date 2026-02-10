#pylint: disable=R0903
""" Database models for the application."""
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer, String, Text, ForeignKey, DateTime, Boolean
)
from sqlalchemy.orm import  declarative_base
from sqlalchemy.dialects.postgresql import JSONB

Base = declarative_base()

def utcnow():
    """Returns current UTC datetime"""
    return datetime.now(timezone.utc)

class User(Base):
    """
    Stores Supertokens user identities so we can FK audit fields to a stable int id.
    """
    __tablename__ = "user"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    st_user_id  = Column(String, unique=True, index=True, nullable=False)
    email       = Column(String, index=True, nullable=True)
    created_at  = Column(DateTime(timezone=True), nullable=False, default=utcnow)

class Language(Base):
    """ Corresponds to table language in isl DB(postgres)"""
    __tablename__ = "language"

    language_id = Column(Integer, primary_key=True)
    language_code = Column(String, unique=True, nullable=False)
    language_name = Column(String, nullable=False)
    meta_data = Column(JSONB)



class Version(Base):
    """Corresponds to table version in isl DB(postgres)"""
    __tablename__ = "version"

    version_id = Column(Integer, primary_key=True)
    name = Column(String)
    abbreviation = Column(String)
    meta_data = Column(JSONB)

class License(Base):
    """Corresponds to table license in isl DB(postgres)"""
    __tablename__ = "license"

    license_id = Column(Integer, primary_key=True)
    license_name = Column(String, unique=True, nullable=False)
    details = Column(String)

class BookLookup(Base):
    '''Corresponds to table bible_books_look_up in vachan DB(postgres)'''
    __tablename__ = 'book_lookup'

    book_id = Column(Integer, primary_key=True)
    book_name = Column(String)
    book_code = Column(String)
    chapter_count = Column(Integer)


class Resource(Base):
    """Corresponds to table resource in isl DB(postgres)"""
    __tablename__ = "resource"

    resource_id   = Column(Integer, primary_key=True, autoincrement=True)
    version_id    = Column(Integer, ForeignKey("version.version_id"), nullable=False)
    revision      = Column(Text, nullable=True)
    content_type  = Column(Text,nullable=False)
    language_id   = Column(Integer, ForeignKey("language.language_id"), nullable=False)
    license_id    = Column(Integer, ForeignKey("license.license_id"), nullable=False)
    meta_data     = Column(Text, nullable=True)
    published     = Column(Boolean, nullable=False, default=False)
    created_by  = Column(Integer, ForeignKey("user.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_by  = Column(Integer, ForeignKey("user.id"), nullable=True)
    updated_at  = Column(DateTime(timezone=True), nullable=True, onupdate=utcnow)
   