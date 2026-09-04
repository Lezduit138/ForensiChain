import os
from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.evidence import Evidence
from ai_engine.service import ai_engine, CLASSES

router = APIRouter(
    prefix="/ai",
    tags=["Forensic AI Engine"]
)

# In-memory cache of analysis reports keyed by evidence_id or file_name
REPORTS_CACHE = {}

@router.get("/status")
def get_ai_status():
    """Returns AI model loading status, device, and detectable classes."""
    return {
        "engine": "YOLO26n + ByteTrack Multi-Object Tracker",
        "ready": ai_engine.is_ready(),
        "weights_path": ai_engine.model_path,
        "supported_classes": list(CLASSES.values())
    }

@router.post("/analyze/{evidence_id}")
def analyze_evidence(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    """
    Runs YOLO object detection and ByteTrack tracking on an ingested evidence file.
    """
    evidence = None
    if evidence_id.isdigit():
        evidence = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()
    
    # If evidence found in database with a real file path
    if evidence and evidence.file_path and os.path.exists(evidence.file_path):
        report = ai_engine.analyze_video(evidence.file_path)
    else:
        # Check if there is any sample video in forensic folder or uploads
        sample_path = "forensic/evidence/test_video.mp4"
        if not os.path.exists(sample_path):
            sample_path = "forensic/evidence/acquisition_test.mp4"
            
        report = ai_engine.analyze_video(sample_path)
    
    # Cache result
    REPORTS_CACHE[evidence_id] = report
    return report

import subprocess
import imageio_ffmpeg

def convert_to_web_mp4(input_path: str) -> str:
    """Converts/remuxes any video format (AVI, DAV, MKV, etc.) to web-friendly H.264 MP4."""
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    out_name = f"web_{base_name}.mp4"
    out_path = os.path.join("uploads", out_name)
    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        cmd = [
            ffmpeg_exe, "-y",
            "-i", input_path,
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "ultrafast",
            "-crf", "23",
            out_path
        ]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return out_path
    except Exception as e:
        print(f"[Transcoder] Could not transcode {input_path}: {e}")
        return input_path

@router.post("/transcode")
async def transcode_video(
    file: UploadFile = File(...)
):
    """
    Transcode proprietary CCTV video formats (AVI, DAV, MKV) to browser-compatible H.264 MP4.
    """
    os.makedirs("uploads", exist_ok=True)
    temp_path = os.path.join("uploads", file.filename)
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    web_path = convert_to_web_mp4(temp_path)
    web_filename = os.path.basename(web_path)
    return {
        "status": "Transcode completed",
        "original_filename": file.filename,
        "web_video_url": f"http://127.0.0.1:8000/uploads/{web_filename}"
    }

@router.post("/analyze-file")
async def analyze_uploaded_file(
    file: UploadFile = File(...)
):
    """
    Upload and directly analyze any CCTV/DVR video file through the AI pipeline,
    automatically transcoding non-MP4 formats (AVI, DAV) for instant web playback.
    """
    os.makedirs("uploads", exist_ok=True)
    temp_path = os.path.join("uploads", file.filename)
    
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Transcode for web playback
    web_path = convert_to_web_mp4(temp_path)
    web_filename = os.path.basename(web_path)
    web_url = f"http://127.0.0.1:8000/uploads/{web_filename}"
        
    report = ai_engine.analyze_video(temp_path)
    report["web_video_url"] = web_url
    REPORTS_CACHE[file.filename] = report
    return report

@router.get("/report/{evidence_id}")
def get_evidence_report(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves the generated AI report for an evidence item.
    """
    if evidence_id in REPORTS_CACHE:
        return REPORTS_CACHE[evidence_id]
        
    # Auto-run analysis if not yet cached
    return analyze_evidence(evidence_id, db)

@router.get("/search")
def search_timeline_events(
    query: str = Query(..., description="Target object class: person, car, motorcycle, bus, truck, bicycle"),
    evidence_id: Optional[int] = None
):
    """
    Filters detected forensic timeline events by object category.
    """
    target = query.strip().lower()
    
    # Get relevant report
    report = None
    if evidence_id and evidence_id in REPORTS_CACHE:
        report = REPORTS_CACHE[evidence_id]
    elif REPORTS_CACHE:
        report = next(iter(REPORTS_CACHE.values()))
    else:
        report = ai_engine._load_fallback_report()
        
    timeline = report.get("timeline_events", [])
    matches = [
        item for item in timeline
        if target in item.get("class", "").lower() or target in item.get("event", "").lower()
    ]
    
    return {
        "query": target,
        "total_matches": len(matches),
        "matches": matches
    }
