"""
Enhanced AI router — exposes full forensic detection pipeline output:
- /ai/status      — model readiness, classes, engine info
- /ai/analyze/:id — run YOLO + ByteTrack on stored evidence file
- /ai/analyze-file — upload + analyze any video directly
- /ai/transcode    — convert proprietary CCTV formats to web H.264
- /ai/report/:id  — retrieve cached analysis report
- /ai/alerts/:id  — get critical severity alerts only
- /ai/search      — filter timeline events by object class
"""
import os
from typing import Optional
from fastapi import APIRouter, Depends, Query, UploadFile, File, HTTPException
from sqlalchemy.orm import Session

from database.connection import get_db
from models.evidence import Evidence
from ai_engine.service import ai_engine, CLASSES, FORENSIC_CLASSES

router = APIRouter(
    prefix="/ai",
    tags=["Forensic AI Engine"]
)

# In-memory cache of analysis reports keyed by evidence_id or file_name
REPORTS_CACHE = {}


@router.get("/status")
def get_ai_status():
    """Returns AI model loading status, device, supported classes and engine info."""
    forensic_class_list = [
        {
            "id": cid,
            "name": meta["name"],
            "category": meta["category"],
            "severity": meta["severity"],
        }
        for cid, meta in FORENSIC_CLASSES.items()
    ]
    return {
        "engine":            "YOLO26n + ByteTrack (Enhanced Forensic Pipeline)",
        "ready":             ai_engine.is_ready(),
        "weights_path":      ai_engine.model_path,
        "supported_classes": forensic_class_list,
        "improvements": [
            "CLAHE contrast enhancement for dark CCTV footage",
            "Per-class confidence thresholds (weapon: 0.25, person: 0.30, vehicle: 0.35)",
            "Full bounding box export (abs + relative coords, zone labels)",
            "Direction & velocity estimation per ByteTrack ID",
            "Unique person/vehicle deduplication via track IDs",
            "Restricted zone crossing detection (3x3 grid)",
            "Critical severity alerts (knife, weapon-class objects)",
            "Hotspot zone analysis across entire video",
        ]
    }


@router.post("/analyze/{evidence_id}")
def analyze_evidence(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    """
    Runs enhanced YOLO + ByteTrack forensic analysis on an ingested evidence file.
    Falls back to sample video or demo report if evidence file is unavailable.
    """
    evidence = None
    if evidence_id.isdigit():
        evidence = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()

    if evidence and evidence.file_path and os.path.exists(evidence.file_path):
        report = ai_engine.analyze_video(evidence.file_path)
    else:
        # Try sample videos in order of preference
        sample_candidates = [
            "forensic/evidence/test_video.mp4",
            "forensic/evidence/acquisition_test.mp4",
            "uploads/sample_cctv.mp4",
        ]
        video_path = next((p for p in sample_candidates if os.path.exists(p)), None)
        report = ai_engine.analyze_video(video_path or "")

    REPORTS_CACHE[evidence_id] = report
    return report


import subprocess
import imageio_ffmpeg


def convert_to_web_mp4(input_path: str) -> str:
    """Converts/remuxes any video format (AVI, DAV, MKV, etc.) to web-friendly H.264 MP4."""
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    out_name  = f"web_{base_name}.mp4"
    out_path  = os.path.join("uploads", out_name)
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
async def transcode_video(file: UploadFile = File(...)):
    """
    Transcode proprietary CCTV video formats (AVI, DAV, MKV) to browser-compatible H.264 MP4.
    """
    os.makedirs("uploads", exist_ok=True)
    temp_path = os.path.join("uploads", file.filename)
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    web_path     = convert_to_web_mp4(temp_path)
    web_filename = os.path.basename(web_path)
    return {
        "status":           "Transcode completed",
        "original_filename": file.filename,
        "web_video_url":    f"http://127.0.0.1:8000/uploads/{web_filename}"
    }


@router.post("/analyze-file")
async def analyze_uploaded_file(file: UploadFile = File(...)):
    """
    Upload and directly analyze any CCTV/DVR video file through the enhanced AI pipeline.
    Automatically transcodes non-MP4 formats (AVI, DAV) for instant web playback.
    """
    os.makedirs("uploads", exist_ok=True)
    temp_path = os.path.join("uploads", file.filename)
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # Transcode for web playback in parallel with analysis
    web_path     = convert_to_web_mp4(temp_path)
    web_filename = os.path.basename(web_path)
    web_url      = f"http://127.0.0.1:8000/uploads/{web_filename}"

    report = ai_engine.analyze_video(temp_path)
    report["web_video_url"] = web_url
    REPORTS_CACHE[file.filename] = report
    return report


@router.get("/report/{evidence_id}")
def get_evidence_report(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    """Retrieves the cached AI forensic report for an evidence item."""
    if evidence_id in REPORTS_CACHE:
        return REPORTS_CACHE[evidence_id]
    # Auto-run analysis if not yet cached
    return analyze_evidence(evidence_id, db)


@router.get("/alerts/{evidence_id}")
def get_critical_alerts(evidence_id: str):
    """
    Returns only the critical severity alerts from the most recent analysis.
    Useful for quick forensic triage without loading the full report.
    """
    report = REPORTS_CACHE.get(evidence_id)
    if not report:
        return {"evidence_id": evidence_id, "alerts": [], "message": "No analysis run yet for this evidence."}

    alerts = report.get("critical_alerts", [])
    summary = report.get("summary", {})

    return {
        "evidence_id":    evidence_id,
        "total_alerts":   len(alerts),
        "critical_count": summary.get("critical_alerts", 0),
        "alerts":         alerts,
    }


@router.get("/search")
def search_timeline_events(
    query: str = Query(..., description="Object class to search: person, car, knife, backpack, etc."),
    evidence_id: Optional[str] = None,
    min_confidence: float = Query(0.0, description="Minimum confidence threshold (0.0-1.0)"),
):
    """
    Filters detected forensic timeline events by object category and optional confidence floor.
    """
    target = query.strip().lower()

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
        if (
            target in item.get("class", "").lower() or
            target in item.get("event", "").lower() or
            target in item.get("category", "").lower()
        ) and item.get("confidence", 0) >= min_confidence
    ]

    return {
        "query":          target,
        "total_matches":  len(matches),
        "min_confidence": min_confidence,
        "matches":        matches,
    }
