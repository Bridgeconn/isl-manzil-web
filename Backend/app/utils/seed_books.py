import csv
from app.models.book_model import Book
from sqlalchemy.orm import Session

def seed_books_from_csv(db: Session, csv_path: str):
    """Seed books table from CSV if not already populated."""
    existing_count = db.query(Book).count()
    if existing_count > 0:
        print(" Books table already populated, skipping seeding.")
        return

    try:
        with open(csv_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            books_to_add = []

            for row in reader:
                book = Book(
                    book_id=row["book_id"],  # Now comes from CSV (1–66)
                    book_name=row["book_name"].strip().capitalize(),
                    book_code=row["book_code"].strip().upper(),
                    testament=row["testament"].strip().upper(),  # OT / NT
                    max_chapter=int(row["chapter_count"]),
                )
                books_to_add.append(book)

            db.add_all(books_to_add)
            db.commit()
            print(f" Seeded {len(books_to_add)} books into the database.")

    except Exception as e:
        db.rollback()
        print(f" Error seeding books: {e}")
