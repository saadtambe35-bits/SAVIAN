"""
SAVIAN — Async Database Engine & Session Factory
Uses SQLAlchemy async engine with aiosqlite for SQLite.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel, create_engine

from app.config import settings

# Ensure database directory exists if using SQLite
if "sqlite" in settings.DATABASE_URL:
    db_file = settings.DATABASE_URL.split(":///")[-1]
    db_dir = os.path.dirname(db_file)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
os.makedirs("./data", exist_ok=True)

# Async engine — aiosqlite driver for SQLite
engine = create_async_engine(settings.DATABASE_URL, echo=False)

# Sync engine for scripts/seed_data/sync operations
sync_db_url = settings.DATABASE_URL.replace("+aiosqlite", "")
sync_connect_args = {"check_same_thread": False} if sync_db_url.startswith("sqlite") else {}
sync_engine = create_engine(sync_db_url, echo=False, connect_args=sync_connect_args, pool_pre_ping=True)

# Async session factory
async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def init_db():
    """Create all SQLModel tables synchronously."""
    import app.models  # noqa: F401
    SQLModel.metadata.create_all(sync_engine)


async def create_db_and_tables():
    """Create all SQLModel tables on startup asynchronously."""
    import app.models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


def get_session():
    """FastAPI dependency — yields a DB session."""
    from sqlmodel import Session
    with Session(sync_engine) as session:
        yield session


