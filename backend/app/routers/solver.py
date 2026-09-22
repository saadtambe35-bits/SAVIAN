"""
Solver Optimization Router for SAVIAN Railway Block Scheduling System.
Dispatches background CP-SAT solves, streams progress, persists schedule results,
and provides comparative analytics against naive chaos scheduling.
"""

import asyncio
from datetime import datetime, timezone
import logging
from typing import Any, Dict, List, Optional
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.database import engine, get_session
from app.models import (
    BlockDemand,
    GrantedBlock,
    ScheduleResult,
    Station,
    TrainSlot,
)
from app.routers.telemetry import telemetry_bus
from app.services.chaos_baseline import run_chaos_baseline
from app.services.xai_explainer import generate_explanations
from app.solver.engine import RailwayBlockScheduler

logger = logging.getLogger("railway_block_scheduling.solver_router")
router = APIRouter()

# In-memory solve cache for rapid retrieval of rich XAI schedules
_SOLVE_CACHE: Dict[str, Dict[str, Any]] = {}


class SolveRequest(BaseModel):
    mode: str = Field(default="COLD", description="COLD | WARM")
    time_limit_sec: float = Field(default=8.0, ge=1.0, le=300.0, description="Solver search budget in seconds")
    previous_solve_id: Optional[str] = Field(default=None, description="Previous solve_id for warm-start hints")


async def _run_solver_background(
    solve_id: str,
    mode: str,
    time_limit_sec: float,
    previous_solve_id: Optional[str] = None,
) -> None:
    """
    Background worker task:
    1. Loads trains and approved demands from database.
    2. Executes CP-SAT solver with telemetry callbacks.
    3. Persists ScheduleResult and GrantedBlock rows.
    4. Caches full schedule for XAI query and comparison.
    """
    logger.info(f"Initiating background optimization solve: {solve_id} (mode={mode}, limit={time_limit_sec}s)")

    try:
        with Session(engine) as db:
            # 1. Load trains
            trains = db.exec(select(TrainSlot).order_by(TrainSlot.priority_weight.desc())).all()

            # 2. Load demands: prioritize APPROVED demands, fallback to non-rejected if none yet approved
            approved_demands = db.exec(
                select(BlockDemand).where(BlockDemand.status == "APPROVED")
            ).all()

            if approved_demands:
                demands = approved_demands
            else:
                demands = db.exec(
                    select(BlockDemand).where(BlockDemand.status != "REJECTED")
                ).all()

            # 3. Build Kavach section map from stations
            stations = db.exec(select(Station).order_by(Station.distance_km)).all()
            kavach_sections: Dict[str, str] = {}
            for i in range(len(stations) - 1):
                s1, s2 = stations[i], stations[i + 1]
                if s1.kavach_status == "COMMISSIONED" and s2.kavach_status == "COMMISSIONED":
                    sec_kavach = "COMMISSIONED"
                elif "IN_TRIALS" in (s1.kavach_status, s2.kavach_status):
                    sec_kavach = "IN_TRIALS"
                elif "COMMISSIONED" in (s1.kavach_status, s2.kavach_status):
                    sec_kavach = "IN_TRIALS"
                else:
                    sec_kavach = "NOT_EQUIPPED"
                kavach_sections[f"{s1.code}_{s2.code}"] = sec_kavach
                kavach_sections[f"{s1.code}-{s2.code}"] = sec_kavach

        # 4. Define streaming progress callback
        async def on_progress(data: Dict[str, Any]) -> None:
            payload = {
                "solve_id": solve_id,
                "iteration": data.get("iteration"),
                "objective": data.get("objective_cost"),
                "bound": data.get("best_bound"),
                "time": data.get("wall_time_sec"),
            }
            telemetry_bus.broadcast("solver_progress", payload)
            telemetry_bus.broadcast("solution_found", payload)

        # 5. Look up previous solution for warm-start if requested
        prev_sol = _SOLVE_CACHE.get(previous_solve_id) if previous_solve_id else None

        # 6. Execute solver
        scheduler = RailwayBlockScheduler(horizon_minutes=1440)
        result = await scheduler.solve(
            trains=trains,
            demands=demands,
            kavach_sections=kavach_sections,
            mode=mode,
            previous_solution=prev_sol,
            on_progress=on_progress,
            time_limit_sec=time_limit_sec,
        )

        # Overwrite internal solve_id with our requested UUID
        result["solve_id"] = solve_id

        # 7. Persist results in SQLModel tables
        with Session(engine) as db:
            schedule_row = ScheduleResult(
                solve_id=solve_id,
                status=result.get("status", "UNKNOWN"),
                objective_value=result.get("objective_value"),
                optimality_gap=result.get("optimality_gap"),
                wall_time_sec=result.get("wall_time_sec"),
                mode=mode,
                created_at=datetime.now(timezone.utc),
            )
            db.add(schedule_row)

            # Map demand_code to BlockDemand.id
            code_to_id = {d.demand_code: d.id for d in demands}

            for blk in result.get("granted_blocks", []):
                d_code = blk.get("demand_code", "")
                d_id = blk.get("demand_id") or code_to_id.get(d_code, 0)
                granted_row = GrantedBlock(
                    solve_id=solve_id,
                    demand_id=d_id,
                    demand_code=d_code,
                    granted_start_minutes=blk.get("granted_start_minutes", 0),
                    granted_end_minutes=blk.get("granted_end_minutes", 0),
                    section_from=blk.get("section_from", ""),
                    section_to=blk.get("section_to", ""),
                    is_shadow=bool(blk.get("is_shadow", False)),
                    shadow_parent_id=None,
                )
                db.add(granted_row)

            db.commit()

        # 8. Cache full result
        _SOLVE_CACHE[solve_id] = result

        # 9. Notify telemetry bus
        telemetry_bus.broadcast("solve_complete", {
            "solve_id": solve_id,
            "status": result.get("status"),
            "objective_value": result.get("objective_value"),
            "wall_time_sec": result.get("wall_time_sec"),
            "granted_blocks_count": len(result.get("granted_blocks", [])),
        })

        logger.info(f"Solve {solve_id} completed with status {result.get('status')}")

    except Exception as ex:
        logger.error(f"Error during background solve {solve_id}: {ex}", exc_info=True)
        telemetry_bus.broadcast("solve_error", {"solve_id": solve_id, "error": str(ex)})


@router.post("", summary="Trigger optimization solve in background", include_in_schema=False)
@router.post("/", summary="Trigger optimization solve in background")
async def trigger_solve(
    body: SolveRequest,
    background_tasks: BackgroundTasks,
) -> Dict[str, str]:
    """
    Trigger a new optimization solve for the Bina–Itarsi corridor.
    Launches as an asynchronous background task and immediately returns a UUID `solve_id`.
    """
    solve_id = str(uuid.uuid4())
    asyncio.create_task(
        _run_solver_background(
            solve_id=solve_id,
            mode=body.mode.upper(),
            time_limit_sec=body.time_limit_sec,
            previous_solve_id=body.previous_solve_id,
        )
    )
    return {"solve_id": solve_id}


@router.get("/{solve_id}", summary="Get solve result with full schedule and XAI data")
def get_solve_result(
    solve_id: str,
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Retrieve full schedule result, granted blocks, train delays, and XAI explanations for a solve.
    """
    if solve_id in _SOLVE_CACHE:
        return _SOLVE_CACHE[solve_id]

    # Reconstitute from database
    sched = session.exec(
        select(ScheduleResult).where(ScheduleResult.solve_id == solve_id)
    ).first()

    if not sched:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Solve result '{solve_id}' not found",
        )

    granted_rows = session.exec(
        select(GrantedBlock).where(GrantedBlock.solve_id == solve_id)
    ).all()

    # Reconstruct blocks
    granted_blocks = [
        {
            "demand_id": row.demand_id,
            "demand_code": row.demand_code,
            "granted_start_minutes": row.granted_start_minutes,
            "granted_end_minutes": row.granted_end_minutes,
            "section_from": row.section_from,
            "section_to": row.section_to,
            "is_shadow": row.is_shadow,
            "shadow_parent_id": row.shadow_parent_id,
        }
        for row in granted_rows
    ]

    return {
        "solve_id": sched.solve_id,
        "status": sched.status,
        "objective_value": sched.objective_value,
        "optimality_gap": sched.optimality_gap,
        "wall_time_sec": sched.wall_time_sec,
        "mode": sched.mode,
        "granted_blocks": granted_blocks,
        "train_schedules": [],
        "xai": {
            "total_train_delay_minutes": 0,
            "total_block_deviation_minutes": 0,
            "total_speed_debt_score": 0.0,
            "shadow_blocks_count": sum(1 for b in granted_blocks if b["is_shadow"]),
            "explanations": [f"Reconstituted solve {solve_id} from database records."],
        },
    }


@router.get("/{solve_id}/comparison", summary="Get side-by-side KPIs: Chaos baseline vs. SAVIAN")
def get_solve_comparison(
    solve_id: str,
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Generate side-by-side KPI comparison: Naive uncoordinated schedule vs. SAVIAN.
    """
    # 1. Retrieve solver result
    solver_result = None
    if solve_id in _SOLVE_CACHE:
        solver_result = _SOLVE_CACHE[solve_id]
    else:
        solver_result = get_solve_result(solve_id, session)

    # 2. Run naive chaos baseline on current demands & trains
    trains = session.exec(select(TrainSlot)).all()
    demands = session.exec(select(BlockDemand)).all()

    chaos_result = run_chaos_baseline(trains=trains, demands=demands)

    # 3. Generate detailed XAI comparative breakdown
    explanations_data = generate_explanations(solver_result, chaos_result)

    return {
        "solve_id": solve_id,
        "status": solver_result.get("status"),
        "line_clear": {
            "objective_value": solver_result.get("objective_value"),
            "wall_time_sec": solver_result.get("wall_time_sec"),
            "granted_blocks_count": len(solver_result.get("granted_blocks", [])),
            "xai": solver_result.get("xai", {}),
        },
        "chaos_baseline": {
            "objective_value": chaos_result.get("objective_value"),
            "wall_time_sec": chaos_result.get("wall_time_sec"),
            "granted_blocks_count": len(chaos_result.get("granted_blocks", [])),
            "xai": chaos_result.get("xai", {}),
        },
        "comparison": explanations_data,
    }


@router.post("/chaos-baseline", summary="Run naive FIFO scheduler for comparison")
def run_chaos_endpoint(
    session: Session = Depends(get_session),
) -> Dict[str, Any]:
    """
    Run the naive FIFO scheduler without conflict resolution and return its clash-filled result.
    """
    trains = session.exec(select(TrainSlot)).all()
    demands = session.exec(select(BlockDemand)).all()
    return run_chaos_baseline(trains=trains, demands=demands)
