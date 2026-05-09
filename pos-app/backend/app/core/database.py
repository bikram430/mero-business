from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,       # handles stale connections after load-shedding restarts
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,        # recycle connections every 30 min — prevents stale after Nepal power cuts
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
