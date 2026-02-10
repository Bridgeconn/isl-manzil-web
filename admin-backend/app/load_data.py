"""Populate the database"""
from csv import DictReader
from pathlib import Path
from sqlalchemy.orm import Session
import db_models
from database import SessionLocal



def populate_bible_books_table(db_: Session, file: str) -> None:
    """Populates the book_lookup table with data from a CSV file."""
    with open(file, "r", encoding="utf-8") as file_pointer:
        csv_reader = DictReader(file_pointer)
        rows = [db_models.BookLookup(
            book_name=row["book_name"],
            book_code=row["book_code"],
            chapter_count=row["chapter_count"]
                                ) for row in csv_reader]
    db_.bulk_save_objects(rows)
    db_.commit()



def populate_language_table(db_: Session, file: str) -> None:
    '''Populates the language table with data from a CSV file without headers.'''
    with open(file, 'r', encoding='utf-8') as file_pointer:
        csv_reader = DictReader(file_pointer)
        rows = []
        for row in csv_reader:
            language = db_models.Language(
                language_code=row.get('code') or None,
                language_name=row.get('language') or None,
            )
            rows.append(language)

    db_.bulk_save_objects(rows)
    db_.commit()



def populate_licenses_table(db_: Session, file: str) -> None:
    '''Populates the licenses table with data from a CSV file.'''
    with open(file, 'r', encoding='utf-8') as file_pointer:
        csv_reader = DictReader(file_pointer)
        rows = []
        for row in csv_reader:
            license_obj = db_models.License(
                license_name=row.get('license_name') or None,
                details=row.get('license_text') or None
            )
            rows.append(license_obj)
    db_.bulk_save_objects(rows)
    db_.commit()



def load_initial_data():
    """Populate the database"""
    with SessionLocal() as session:
        # populate bible_books table only if it's empty
        if session.query(db_models.BookLookup).count() == 0:
            csv_file_bible_books = Path("data/bible_books.csv").resolve()
            populate_bible_books_table(session, str(csv_file_bible_books))
        # populate language table only if it's empty
        if session.query(db_models.Language).count() == 0:
            csv_file_languages = Path("data/languages.csv").resolve()
            populate_language_table(session, str(csv_file_languages))
        # populate licenses table only if it's empty
        if session.query(db_models.License).count() == 0:
            csv_file_licenses = Path('data/licenses.csv').resolve()
            populate_licenses_table(session, str(csv_file_licenses))
