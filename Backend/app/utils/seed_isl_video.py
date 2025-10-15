import csv
from pathlib import Path
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.book_model import Book
from app.models.ISL_Video_model import ISLVideo  

# Path to your UI CSV file
CSV_FILE = Path("/home/Tejaswini.Rai/Desktop/isl/isl-manzil-web/src/assets/data/isl_video_urls.csv")

def seed_isl_videos():
    """Seed isl_video table from the UI CSV file."""
    db: Session = SessionLocal()

    # Check if data already exists
    existing = db.query(ISLVideo).count()
    if existing > 0:
        print(" ISL Video table already populated. Skipping seeding.")
        db.close()
        return

    if not CSV_FILE.exists():
        print(f"CSV file not found: {CSV_FILE}")
        db.close()
        return

    try:
        with open(CSV_FILE, newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            videos_to_add = []

            for row in reader:
                book_code = row["BookCode"].strip().lower()
                chapter_number = int(row["Chapter"])
                video_id = row["VideoId"].strip()

                # Fetch the book_id using book_code
                book = db.query(Book).filter(Book.book_code == book_code.upper()).first()
                if not book:
                    print(f" Skipping: Book code '{book_code}' not found for chapter {chapter_number}.")
                    continue

                # Create ISLVideo record
                video = ISLVideo(
                    book_id=book.book_id,
                    chapter=chapter_number,
                    video_id=video_id,
                )
                videos_to_add.append(video)

            # Bulk insert
            db.add_all(videos_to_add)
            db.commit()
            print(f"Seeded {len(videos_to_add)} ISL video records into the database.")

    except Exception as e:
        db.rollback()
        print(f" Error seeding ISL videos: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_isl_videos()
