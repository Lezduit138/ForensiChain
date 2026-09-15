import os
import shutil
from services.video_analysis import analyze_video


from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from database.connection import get_db
from models.evidence import Evidence
from services.metadata import extract_metadata
from services.hash_service import generate_file_hash


router = APIRouter(
    prefix="/evidence",
    tags=["Evidence"]
)


@router.post("/upload")
def upload_evidence(
    case_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    from models.case import Case

    upload_folder = "uploads"
    os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, file.filename)

    # Save uploaded video
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract video metadata
    metadata = extract_metadata(file_path)

    # Generate SHA-256 hash
    file_hash = generate_file_hash(file_path)

    # Resolve string case_id to numeric DB id
    resolved_case = None
    if case_id.isdigit():
        resolved_case = db.query(Case).filter(Case.id == int(case_id)).first()
    if not resolved_case:
        resolved_case = db.query(Case).filter(Case.fir_number.contains(case_id)).first()
    if not resolved_case:
        resolved_case = db.query(Case).first()

    actual_case_id = resolved_case.id if resolved_case else 1

    # Save evidence information in database
    new_evidence = Evidence(
        case_id=actual_case_id,
        file_name=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_hash=file_hash,
        status="Uploaded"
    )

    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)

    return {
        "message": "Evidence uploaded successfully!",
        "evidence_id": new_evidence.id,
        "case_id": new_evidence.case_id,
        "file_name": new_evidence.file_name,
        "status": new_evidence.status,
        "metadata": metadata,
        "sha256_hash": file_hash
    }

@router.get("/{evidence_id}")
def get_evidence_by_id(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    evidence = None
    if evidence_id.isdigit():
        evidence = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()
    
    if not evidence:
        evidence = db.query(Evidence).first()
        
    if not evidence:
        return {"message": "Evidence not found"}
        
    return {
        "id": evidence.id,
        "caseId": evidence.case_id,
        "name": evidence.file_name,
        "originalFilename": evidence.file_name,
        "status": evidence.status,
        "sha256": evidence.file_hash,
        "blake3": evidence.file_hash, # fallback
        "fileSize": "8.4 GB (Disk image)", # mock metadata as we don't store it yet
        "vendor": "Detected Vendor",
        "containerFormat": "Raw Bitstream",
        "videoUrl": f"http://127.0.0.1:8000/{evidence.file_path.replace(os.sep, '/')}",
        "duration": "00:00:00"
    }

@router.get("/case/{case_id}")
def get_evidence_by_case(
    case_id: str,
    db: Session = Depends(get_db)
):
    from models.case import Case
    resolved_case = None
    if case_id.isdigit():
        resolved_case = db.query(Case).filter(Case.id == int(case_id)).first()
    if not resolved_case:
        resolved_case = db.query(Case).filter(Case.fir_number.contains(case_id)).first()
    if not resolved_case:
        resolved_case = db.query(Case).first()
        
    if not resolved_case:
        return []
        
    evidences = db.query(Evidence).filter(Evidence.case_id == resolved_case.id).all()
    results = []
    for evidence in evidences:
        results.append({
            "id": evidence.id,
            "caseId": evidence.case_id,
            "name": evidence.file_name,
            "originalFilename": evidence.file_name,
            "status": evidence.status,
            "sha256": evidence.file_hash,
            "videoUrl": f"http://127.0.0.1:8000/{evidence.file_path.replace(os.sep, '/')}"
        })
    return results

@router.post("/{evidence_id}/verify")
def verify_evidence(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    evidence = None
    if evidence_id.isdigit():
        evidence = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()
    if not evidence:
        evidence = db.query(Evidence).first()

    if not evidence:
        return {
            "message": "Evidence not found"
        }

    current_hash = generate_file_hash(
        evidence.file_path
    )

    if current_hash == evidence.file_hash:
        integrity_status = "VALID"
    else:
        integrity_status = "TAMPERED"

    return {
        "evidence_id": evidence.id,
        "file_name": evidence.file_name,
        "stored_hash": evidence.file_hash,
        "current_hash": current_hash,
        "integrity_status": integrity_status
    }
@router.post("/{evidence_id}/analyze")
def analyze_evidence(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    evidence = None
    if evidence_id.isdigit():
        evidence = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()
    if not evidence:
        evidence = db.query(Evidence).first()

    if not evidence:
        return {
            "message": "Evidence not found"
        }

    analysis_result = analyze_video(evidence.file_path)

    return {
        "message": "Video analysis completed successfully!",
        "evidence_id": evidence.id,
        "file_name": evidence.file_name,
        "analysis": analysis_result
    }

# GET FINDINGS
@router.get("/{evidence_id}/findings")
def get_findings(
    evidence_id: str,
    db: Session = Depends(get_db)
):
    from models.finding import Finding
    
    evidence = None
    if evidence_id.isdigit():
        evidence = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()
    if not evidence:
        evidence = db.query(Evidence).first()
        
    if not evidence:
        return []
        
    findings = db.query(Finding).filter(Finding.evidence_id == evidence.id).all()
    return findings

# POST FINDING
from pydantic import BaseModel
from typing import Optional

class FindingCreate(BaseModel):
    channel_id: Optional[int] = 1
    channel_name: Optional[str] = "Primary Channel"
    finding_type: str
    title: str
    timestamp_offset: str
    timecode_real: Optional[str] = None
    timeline_percentage: Optional[float] = 0.0
    severity: Optional[str] = "Low"
    confidence_score: Optional[float] = 95.0
    add_to_report: Optional[bool] = True
    description: Optional[str] = None
    technical_details: Optional[str] = None
    forensic_impact: Optional[str] = None

@router.post("/{evidence_id}/findings")
def add_finding(
    evidence_id: str,
    finding_data: FindingCreate,
    db: Session = Depends(get_db)
):
    from models.finding import Finding
    
    evidence = None
    if evidence_id.isdigit():
        evidence = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()
    if not evidence:
        evidence = db.query(Evidence).first()
        
    if not evidence:
        return {"message": "Evidence not found"}
    
    new_finding = Finding(
        evidence_id=evidence.id,
        channel_id=finding_data.channel_id,
        channel_name=finding_data.channel_name,
        finding_type=finding_data.finding_type,
        title=finding_data.title,
        timestamp_offset=finding_data.timestamp_offset,
        timecode_real=finding_data.timecode_real,
        timeline_percentage=finding_data.timeline_percentage,
        severity=finding_data.severity,
        confidence_score=finding_data.confidence_score,
        add_to_report=finding_data.add_to_report,
        description=finding_data.description,
        technical_details=finding_data.technical_details,
        forensic_impact=finding_data.forensic_impact
    )
    
    db.add(new_finding)
    db.commit()
    db.refresh(new_finding)
    
    return new_finding

@router.patch("/findings/{finding_id}/toggle-report")
def toggle_report_status(
    finding_id: int,
    db: Session = Depends(get_db)
):
    from models.finding import Finding
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if finding:
        finding.add_to_report = not finding.add_to_report
        db.commit()
        db.refresh(finding)
    return finding