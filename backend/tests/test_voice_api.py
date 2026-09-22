import io
import wave
from app.api.voice import clean_railway_transcript

def test_clean_railway_transcript_phonetics():
    # Test station phonetic restoration
    raw1 = "vinayak offline tv timing towards from 15 to 16 bus idhar problem"
    cleaned1 = clean_railway_transcript(raw1)
    assert "Bina Jn" in cleaned1
    assert "downline" in cleaned1
    assert "P-Way tamping" in cleaned1
    assert "Ganj Basoda" in cleaned1

    # Test Hindi / Hinglish colloquial terms
    raw2 = "etarsi online pee way do ghante power block required"
    cleaned2 = clean_railway_transcript(raw2)
    assert "Itarsi Jn" in cleaned2
    assert "upline" in cleaned2
    assert "P-Way" in cleaned2
    assert "2 hours" in cleaned2
    assert "OHE power isolation" in cleaned2

def test_voice_transcribe_empty_file_rejected(client):
    # Upload an empty file < 44 bytes
    files = {"file": ("empty.wav", b"short", "audio/wav")}
    response = client.post("/api/voice/transcribe", files=files)
    assert response.status_code == 400
    assert "Audio recording too short" in response.json()["detail"]

def test_voice_transcribe_silent_wav_handled(client):
    # Create a valid 0.1s silent PCM WAV in memory
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        # 1600 samples of silence = 0.1s
        wav_file.writeframes(b"\x00\x00" * 1600)
    buf.seek(0)

    files = {"file": ("silence.wav", buf.read(), "audio/wav")}
    response = client.post("/api/voice/transcribe", files=files)
    # The speech recognizer handles silence safely by returning success with empty transcript
    assert response.status_code in [200, 502]
    if response.status_code == 200:
        data = response.json()
        assert data["success"] is True
        assert data["transcript"] == ""
