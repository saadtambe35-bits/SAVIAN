from fastapi import APIRouter
from app.api import demands, solver, t409, voice

api_router = APIRouter()

api_router.include_router(demands.router)
api_router.include_router(solver.router)
api_router.include_router(t409.router)
api_router.include_router(voice.router)
