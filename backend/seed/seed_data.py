import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, Optional

BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from sqlmodel import Session, select

from app.database import sync_engine as engine, init_db
from app.models.station import Station
from app.models.train_slot import TrainSlot
from app.models.block_demand import BlockDemand

logger = logging.getLogger("railway_block_scheduling.seed")
SEED_DIR = Path(__file__).resolve().parent


def load_json(filename: str) -> Any:
    file_path = SEED_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Seed file not found: {file_path}")
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_stations(session: Session) -> int:
    stations_data = load_json("stations.json")
    inserted = 0

    for st_data in stations_data:
        code = st_data.get("code")
        existing = session.exec(select(Station).where(Station.code == code)).first()
        if existing:
            continue

        station = Station(
            code=st_data["code"],
            name=st_data["name"],
            distance_km=float(st_data["distance_km"]),
            division=st_data.get("division", "BPL"),
            zone=st_data.get("zone", "WCR"),
            kavach_status=st_data.get("kavach_status", "NOT_EQUIPPED"),
            line_type=st_data.get("line_type", "DOUBLE"),
        )
        session.add(station)
        inserted += 1

    return inserted


def seed_trains(session: Session) -> int:
    trains_data = load_json("trains.json")
    inserted = 0

    for tr_data in trains_data:
        train_number = tr_data.get("train_number")
        existing = session.exec(
            select(TrainSlot).where(TrainSlot.train_number == train_number)
        ).first()
        if existing:
            continue

        path_json_str = tr_data.get("path_json")
        if not path_json_str and "path" in tr_data:
            path_json_str = json.dumps(tr_data["path"])
        elif isinstance(path_json_str, (list, dict)):
            path_json_str = json.dumps(path_json_str)

        train_slot = TrainSlot(
            train_number=tr_data["train_number"],
            train_name=tr_data["train_name"],
            train_type=tr_data["train_type"],
            direction=tr_data["direction"],
            priority_weight=int(tr_data["priority_weight"]),
            path_json=path_json_str,
        )
        session.add(train_slot)
        inserted += 1

    return inserted


def seed_demands(session: Session) -> int:
    demands_data = load_json("demands.json")
    inserted = 0

    for dm_data in demands_data:
        demand_code = dm_data.get("demand_code")
        existing = session.exec(
            select(BlockDemand).where(BlockDemand.demand_code == demand_code)
        ).first()
        if existing:
            continue

        block_demand = BlockDemand(
            demand_code=dm_data["demand_code"],
            source_system=dm_data["source_system"],
            department=dm_data["department"],
            section_from=dm_data["section_from"],
            section_to=dm_data["section_to"],
            start_km=float(dm_data["start_km"]),
            end_km=float(dm_data["end_km"]),
            requested_date=dm_data["requested_date"],
            requested_start_minutes=int(dm_data["requested_start_minutes"]),
            requested_end_minutes=int(dm_data["requested_end_minutes"]),
            required_minutes=int(dm_data["required_minutes"]),
            activity_description=dm_data["activity_description"],
            machinery_type=dm_data.get("machinery_type"),
            machinery_id=dm_data.get("machinery_id"),
            status=dm_data.get("status", "PROPOSED"),
            trust_score=float(dm_data.get("trust_score", 1.0)),
            severity_tier=dm_data["severity_tier"],
            priority_weight=int(dm_data["priority_weight"]),
            power_block_required=bool(dm_data.get("power_block_required", False)),
            disconnection_required=bool(dm_data.get("disconnection_required", False)),
            speed_restriction_kmph=dm_data.get("speed_restriction_kmph"),
        )
        session.add(block_demand)
        inserted += 1

    return inserted


def seed_database(session: Optional[Session] = None) -> Dict[str, int]:
    """
    Idempotently seeds stations, train slots, and block demands into the database.
    Can be called inside FastAPI lifespan or as a standalone CLI script.
    """
    init_db()

    close_session_at_end = False
    if session is None:
        session = Session(engine)
        close_session_at_end = True

    try:
        stations_count = seed_stations(session)
        trains_count = seed_trains(session)
        demands_count = seed_demands(session)
        session.commit()

        logger.info(
            "Database seeding complete. Inserted %d stations, %d trains, %d demands.",
            stations_count,
            trains_count,
            demands_count,
        )
        return {
            "stations_seeded": stations_count,
            "trains_seeded": trains_count,
            "demands_seeded": demands_count,
        }
    finally:
        if close_session_at_end:
            session.close()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    print("Starting database initialisation and idempotent seeding...")
    result = seed_database()
    print("Seeding summary:", result)
