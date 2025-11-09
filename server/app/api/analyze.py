"""
Audio analysis API endpoints
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
from app.services.audio_analyzer import get_audio_analyzer
from app.services.storage import get_storage_service
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.file import File as FileModel, FileKind
from app.models.user import User

router = APIRouter()


class AnalysisResponse(BaseModel):
    bpm: Optional[int] = None
    key: Optional[str] = None
    energy: Optional[float] = None
    loudness: Optional[float] = None
    file_id: Optional[int] = None


@router.post("/reference", response_model=AnalysisResponse)
async def analyze_reference(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    # TODO: Add authentication dependency
):
    """Analyze reference audio file for BPM, key, energy, loudness"""
    # TODO: Get current user from auth
    user = db.query(User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name

    try:
        # Analyze audio
        analyzer = get_audio_analyzer()
        analysis = analyzer.analyze(tmp_path)

        # Upload to storage
        storage = get_storage_service()
        object_key = f"references/{user.id}/{file.filename}"
        file_url = storage.upload_file(tmp_path, object_key, content_type=file.content_type)

        # Create file record
        file_record = FileModel(
            user_id=user.id,
            kind=FileKind.REFERENCE,
            url=file_url,
            duration_s=analysis.get("duration_s"),
            bpm=analysis.get("bpm"),
            key=analysis.get("key"),
            energy=analysis.get("energy"),
            loudness=analysis.get("loudness"),
        )
        db.add(file_record)
        db.commit()
        db.refresh(file_record)

        return AnalysisResponse(
            bpm=analysis.get("bpm"),
            key=analysis.get("key"),
            energy=analysis.get("energy"),
            loudness=analysis.get("loudness"),
            file_id=file_record.id,
        )
    finally:
        os.unlink(tmp_path)

