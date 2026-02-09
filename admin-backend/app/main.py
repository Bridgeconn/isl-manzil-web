"""Main FastAPI application for the ISL-Admin server."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from load_data import load_initial_data

init_db()

app = FastAPI(
    title="isl-admin",
    version="1.0.0",
    description=(
        "The ISL-Admin server application that provides REST APIs to access "
        "the features provided by the module."
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Simple health-check endpoint to verify the app is running."""
    return {"message": "ISL-Admin app is running successfully"}

load_initial_data()
