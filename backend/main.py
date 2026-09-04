import sys
from pathlib import Path

# Ensure backend directory is in sys.path so submodules (database, models, routers) resolve cleanly
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
ROOT_DIR = BACKEND_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database.connection import Base, engine
from models.case import Case
from models.evidence import Evidence
from routers import cases, evidence, ai

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CCTV Forensic Analysis Tool API",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(cases.router)
app.include_router(evidence.router)
app.include_router(ai.router)

@app.get("/")
def home():
    return {
        "message": "CCTV Forensic Backend is Running Successfully!",
        "ai_engine": "YOLO26n + ByteTrack"
    }
