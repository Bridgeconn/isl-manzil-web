import csv
import re
from pathlib import Path
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.book_model import Book
from app.models.ISL_Video_model import ISLVideo
from app.models.ISL_VerseMarker_model import ISLVerseMarker

# Folder containing all verse marker CSVs
VERSE_MARKERS_DIR = Path("/home/Tejaswini.Rai/Desktop/isl/isl-manzil-web/src/assets/data/verse_markers")

def seed_verses():
    """Seed ISL verse markers from verse_marker CSV files."""
    db: Session = SessionLocal()

    existing = db.query(ISLVerseMarker).count()
    if existing > 0:
        print(" Verses table already populated. Skipping seeding.")
        db.close()
        return

    if not VERSE_MARKERS_DIR.exists():
        print(f" Verse markers folder not found: {VERSE_MARKERS_DIR}")
        db.close()
        return

    total_inserted = 0

    try:
        for csv_file in VERSE_MARKERS_DIR.glob("*.csv"):
            filename = csv_file.stem  # e.g., "1 Corinthians_1"
            match = re.match(r"(.+)_([0-9]+)$", filename)

            if not match:
                print(f" Skipping file '{csv_file.name}': invalid name format.")
                continue

            book_name = match.group(1).strip()
            chapter_number = int(match.group(2))

            # Find the corresponding book
            book = db.query(Book).filter(Book.book_name.ilike(book_name)).first()
            if not book:
                print(f" Skipping '{csv_file.name}': book '{book_name}' not found.")
                continue

            # Find corresponding ISLVideo (chapter)
            isl_video = (
                db.query(ISLVideo)
                .filter(ISLVideo.book_id == book.book_id, ISLVideo.chapter == chapter_number)
                .first()
            )
            if not isl_video:
                print(f" Skipping '{csv_file.name}': chapter {chapter_number} not found for '{book_name}'.")
                continue

            with open(csv_file, newline="", encoding="utf-8") as file:
                reader = csv.DictReader(file)
                verses_to_add = []

                for row in reader:
                    verse_number = int(row["verse"])
                    time_marker = row["time"].strip()

                    verse = ISLVerseMarker(
                        chapter_id=isl_video.chapter_id,
                        verse_number=verse_number,
                        time_marker=time_marker,
                    )
                    verses_to_add.append(verse)

                db.add_all(verses_to_add)
                db.commit()
                total_inserted += len(verses_to_add)
                print(f" Seeded {len(verses_to_add)} verses for {book_name} ch. {chapter_number}")

        print(f" Total verses seeded: {total_inserted}")

    except Exception as e:
        db.rollback()
        print(f" Error seeding verses: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_verses()
