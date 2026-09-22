from fastapi import APIRouter, UploadFile, File, HTTPException
import speech_recognition as sr
import io
import re
import logging

router = APIRouter(prefix="/voice", tags=["Voice Dispatch Assistant"])
logger = logging.getLogger(__name__)

def clean_railway_transcript(text: str) -> str:
    """
    Restores garbled phonetic ASR output into clean Indian Railways operational vocabulary.
    e.g. 'Vinayak offline TV timing towards from 15 to 16 bus idhar problem'
    -> 'Bina Jn downline P-Way tamping for 2 hours from 15:00 to 16:00 hrs Ganj Basoda rail problem'
    """
    if not text:
        return ""
    # Stations
    text = re.sub(r'\b(?:vinayak|veena|beena|vina)\b', 'Bina Jn', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:bus\s+idhar(?:\s+problem)?|bas\s+idhar|ganj\s+basuda|basuda|gunj\s+basoda)\b', 'Ganj Basoda', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:mandi\s+bamra|mandibamra|bamra)\b', 'Mandi Bamora', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:gulab\s+gunj|gulabgunj)\b', 'Gulabganj', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:bidisa|bidesha|vidisa)\b', 'Vidisha', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:sanchee|sanci|sanxi)\b', 'Sanchi', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:bopal|bhoopal|bhopal)(?!\s*jn)\b', 'Bhopal Jn', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:habibgunj|habib\s+ganj|rani\s+kamalapati|kamalapati)\b', 'Rani Kamlapati', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:etarsi|aitarsi)\b', 'Itarsi Jn', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:hoshangabad)\b', 'Narmadapuram', text, flags=re.IGNORECASE)

    # Tracks
    text = re.sub(r'\b(?:offline|off\s+line|off-line|d-offline|long\s+line|wrong\s+line|dong\s+line|dawn\s+line)\b', 'downline', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:online|outline|app\s*line)\b', 'upline', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:dono\s+line|dono\s+track)\b', 'both lines', text, flags=re.IGNORECASE)

    # Department & maintenance
    text = re.sub(r'\b(?:ebay|e-bay|e\s+bay|ebuy)\b', 'P-Way', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:pvtmping|pvtamping|pv\s+tamping|p\s*v\s*tamping)\b', 'P-Way tamping', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:tv\s+timing|tv\s+tamping|tee\s+vee\s+timing)\b', 'P-Way tamping', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:temping|typing)\b', 'tamping', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:pee\s+way|pee-way|peeway|p\s+way)\b', 'P-Way', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:o\s*h\s*e|oh\s*e|o\.h\.e)\b', 'OHE', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:ohe\s+isolation|power\s+block|bijli\s+band|power\s+cut)\b', 'OHE power isolation', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:s\s+and\s+t|s\s+and\s+tee|snt)\b', 'S&T', text, flags=re.IGNORECASE)

    # Durations & Numbers
    text = re.sub(r'\b(?:towards|to\s+hours?|too\s+hours?)\b(?=\s*(?:from|for|\d))', 'for 2 hours', text, flags=re.IGNORECASE)
    text = re.sub(r'\b(?:towards|to\s+hours?|too\s+hours?)\b', '2 hours', text, flags=re.IGNORECASE)
    text = re.sub(r'\bdo\s+ghante?\b', '2 hours', text, flags=re.IGNORECASE)
    text = re.sub(r'\bteen\s+ghante?\b', '3 hours', text, flags=re.IGNORECASE)
    text = re.sub(r'\bchar\s+ghante?\b', '4 hours', text, flags=re.IGNORECASE)
    text = re.sub(r'\bdedh\s+ghante?\b', '90 minutes', text, flags=re.IGNORECASE)
    text = re.sub(r'\bdhai\s+ghante?\b', '150 minutes', text, flags=re.IGNORECASE)
    text = re.sub(r'\baadha\s+ghanta\b', '30 minutes', text, flags=re.IGNORECASE)

    # Time window format
    text = re.sub(r'\b(?:in|into|inn|en|ten)\s+to\s+([012]?\d)\b',
                  lambda m: f"from 10:00 to {int(m.group(1)):02d}:00 hrs" if int(m.group(1)) <= 24 else m.group(0),
                  text, flags=re.IGNORECASE)
    text = re.sub(r'(?<!:)\b(?:from\s+)?([012]?\d)\s*(?:to|-|se)\s*([012]?\d)(?!:)\s*(?:hours|hrs|baje)?\b', 
                  lambda m: f"from {int(m.group(1)):02d}:00 to {int(m.group(2)):02d}:00 hrs" if int(m.group(1)) <= 24 and int(m.group(2)) <= 24 else m.group(0),
                  text, flags=re.IGNORECASE)

    return re.sub(r'\s+', ' ', text).strip()

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Universal speech-to-text endpoint supporting any browser (Chrome, Brave, Firefox, Safari).
    Accepts an uncompressed PCM WAV audio recording from the frontend.
    """
    try:
        content = await file.read()
        if len(content) < 44:  # minimum WAV header length is 44 bytes
            raise HTTPException(status_code=400, detail="Audio recording too short or empty")

        r = sr.Recognizer()
        r.energy_threshold = 250
        r.dynamic_energy_threshold = True

        with sr.AudioFile(io.BytesIO(content)) as source:
            audio_data = r.record(source)

        transcript = ""
        try:
            # Indian English transcription
            transcript = r.recognize_google(audio_data, language="en-IN")
        except sr.UnknownValueError:
            # Silence or unintelligible speech
            transcript = ""
        except sr.RequestError as e:
            # Fallback attempt with generic English
            try:
                transcript = r.recognize_google(audio_data, language="en-US")
            except Exception:
                raise HTTPException(
                    status_code=502,
                    detail=f"Speech service network timeout: {str(e)}"
                )

        cleaned_transcript = clean_railway_transcript(transcript) if transcript else ""

        return {
            "success": True,
            "raw_transcript": transcript,
            "transcript": cleaned_transcript or transcript,
            "audio_size_bytes": len(content),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice transcription failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription processing error: {str(e)}")
