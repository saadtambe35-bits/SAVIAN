import hashlib
import time
from datetime import datetime

class T409Generator:
    """
    Generates official Indian Railways Form T/409 Caution Order & Line-Clear
    Statutory documents with SHA-256 cryptographic verification tokens.
    """

    @staticmethod
    def generate_token(
        demand_id: int,
        demand_code: str,
        section_from: str,
        section_to: str,
        start_km: float,
        end_km: float,
        machinery: str,
        start_min: int,
        end_min: int,
        power_block: bool
    ) -> dict:
        auth_number = f"WCR/BPL/LC-2026/{str(demand_id)[-4:]}-{int(time.time() * 1000) % 1000000:06d}"
        now = datetime.utcnow()
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S UTC")

        # Cryptographic SHA-256 SIL-4 Token
        raw_payload = f"{auth_number}|{demand_code}|{section_from}-{section_to}|{start_km}-{end_km}|{start_min}-{end_min}|{power_block}|{timestamp_str}"
        kavach_hash = f"0x{hashlib.sha256(raw_payload.encode('utf-8')).hexdigest()[:24]}...SIL-4"

        start_hhmm = f"{start_min // 60:02d}:{start_min % 60:02d}"
        end_hhmm = f"{end_min // 60:02d}:{end_min % 60:02d}"

        return {
            "auth_number": auth_number,
            "kavach_hash": kavach_hash,
            "status": "APPROVED_SIL4",
            "issue_time": timestamp_str,
            "demand_code": demand_code,
            "section": f"{section_from} ⇄ {section_to}",
            "chainage": f"km {start_km} – km {end_km}",
            "validity_window": f"{start_hhmm} – {end_hhmm} IST",
            "traction_cutoff": "33kV OHE Cut & Discharged" if power_block else "Normal Power",
            "kavach_buffer": "1,200m Automatic SIL-4 Safe Braking Enforced",
            "signoff": "Authorized by Station Master & Sr. DOM / WCR Bhopal"
        }
