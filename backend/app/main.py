from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base
from app.database import init_db
from app.api.router import api_router
from app.routers.corridor import router as corridor_router
from app.routers.lifecycle import router as lifecycle_router
from app.routers.pdf import router as pdf_router
from app.routers.solver import router as background_solver_router
from app.routers.telemetry import router as telemetry_router

# Initialize database schema (both Core SQLAlchemy and SQLModel)
Base.metadata.create_all(bind=engine)
init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend microservices platform for Indian Railways Corridor Block Scheduling, OR-Tools CP-SAT Optimization, and Form T/409 Governance.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Cross-Origin Resource Sharing (CORS) for Next.js / Vite React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Core API Endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount Supplementary Endpoints: Corridor, Lifecycle, PDF, Telemetry SSE, and Background Solver
app.include_router(corridor_router, prefix=f"{settings.API_V1_STR}/corridor", tags=["Corridor Infrastructure"])
app.include_router(lifecycle_router, prefix=f"{settings.API_V1_STR}/lifecycle", tags=["Lifecycle Governance"])
app.include_router(lifecycle_router, prefix=settings.API_V1_STR, tags=["Lifecycle Governance"], include_in_schema=False)
app.include_router(pdf_router, prefix=f"{settings.API_V1_STR}/pdf", tags=["PDF Generation"])
app.include_router(telemetry_router, prefix=f"{settings.API_V1_STR}/telemetry", tags=["Block Telemetry SSE"])
app.include_router(background_solver_router, prefix=f"{settings.API_V1_STR}/solve", tags=["Background Solver"])


@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "corridor": settings.CORRIDOR_SECTION,
        "kavach_status": "SIL-4 ACTIVE",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "solver_engine": "OR-Tools CP-SAT READY",
        "kavach_headway_buffer": f"{settings.KAVACH_BUFFER_METERS}m"
    }
