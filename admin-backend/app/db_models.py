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
   
class Bible(Base):
    """Main bible table storing book content"""
    __tablename__ = "bible"

    bible_book_id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    book_id = Column(Integer, ForeignKey("book_lookup.book_id"), nullable=False)
    usfm = Column(Text, nullable=False)  # USFM format
    json = Column(JSONB, nullable=False)  # USJ format from usfm-grammar
    chapters = Column(Integer, nullable=False)

class CleanBible(Base):
    """Clean verse-by-verse bible content"""
    __tablename__ = "clean_bible"

    id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    book_id = Column(Integer, ForeignKey("book_lookup.book_id"), nullable=False)
    chapter = Column(Integer, nullable=False)
    verse = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)

class Video(Base):
    """Corresponds to table video in vachan DB(postgres)"""
    __tablename__ = "video"
    video_id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"))
    book = Column(String, nullable=False)
    chapter = Column(Integer, nullable=True)
    url = Column(String, nullable=False)
    title = Column(String , nullable=False)
    description = Column(Text)

class Commentary(Base):
    """Corresponds to table commentary in vachan DB(postgres)"""
    __tablename__ = "commentary"
    commentary_id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"))
    book_id = Column(Integer,ForeignKey("book_lookup.book_id"))
    chapter = Column(Integer ,nullable=False)
    verse = Column(String)
    text = Column(Text,nullable=False)

class Dictionary(Base):
    """Corresponds to table dictionary in vachan DB(postgres)"""
    __tablename__ = "dictionary"

    word_id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    keyword = Column(String, nullable=False)
    word_forms = Column(String, nullable=False)
    strongs = Column(String, nullable=False)
    definition = Column(String, nullable=False)
    translation_help = Column(String, nullable=False)
    see_also = Column(String, nullable=False)
    ref = Column(String, nullable=False)
    examples = Column(String, nullable=False)

class AudioBible(Base):
    """Corresponds to table audio_bible in vachan DB(postgres)"""
    __tablename__ = "audio_bible"
    audio_bible_id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False, unique=True)
    name = Column(Text, nullable=False)
    base_url = Column(Text, nullable=False)
    books = Column(JSONB, nullable=False)
    format = Column(Text, nullable=False)
    files_missing=Column(JSONB, nullable=True) 
    test_date = Column(DateTime(timezone=True), nullable=True, default=utcnow)

class Obs(Base):
    """Corresponds to table obs in vachan DB(postgres)"""
    __tablename__ = "obs"
    obs_id = Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(Integer, ForeignKey("resource.resource_id"), nullable=False)
    story_no = Column(Integer, nullable=False)
    title = Column(Text, nullable=False)
    url = Column(Text, nullable=True)
    text = Column(Text, nullable=False)


class Infographic(Base):
    """Corresponds to table infographic in vachan DB(postgres)"""
    __tablename__ = "infographic"


    id =  Column(Integer, primary_key=True, autoincrement=True)
    resource_id = Column(
        Integer,
        ForeignKey("resource.resource_id", ondelete="RESTRICT"),
        nullable=False
    )
    book_id = Column(
        Integer,
        ForeignKey("book_lookup.book_id", ondelete="RESTRICT"),
        nullable=False
    )
    title = Column(String(255), nullable=False)
    file_name = Column(String(255), nullable=False)