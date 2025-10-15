from fastapi import FastAPI
from app.utils.seed_books import seed_books_from_csv
from app.utils.seed_isl_video import seed_isl_videos
from app.utils.seed_verseMarkers import seed_verses
from app.database import engine, Base, SessionLocal
from app.routes import isl_videos, verse_marker_routes


app = FastAPI(
    title="ISL Bible Backend",
    description="API for ISL Bible video chapters and verse markers",
    version="1.0.0"
)


# Create all tables
Base.metadata.create_all(bind=engine)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    print(" Starting ISL Bible backend...")

    # Step 1: Seed books (1–66 from CSV)
    seed_books_from_csv(db, "app/data/bible_books.csv")

    # Step 2: Seed ISL video chapters (from UI CSV)
    seed_isl_videos()
    
    # Step 3: Seed verse markers
    seed_verses()
    
    print(" Database seed complete.")


@app.get("/")
def root():
    return {
        "message": "ISL Bible Backend is running",
        "version": "1.0.0",
        "endpoints": {
            "videos": "/video",
            "verse_markers": "/verse_markers",
            "docs": "/docs"
        }
    }


# Include routers
app.include_router(isl_videos.router)
app.include_router(verse_marker_routes.router)