"""
Database connection manager for EduPulse AI.

PostgreSQL is the default backend. Set DATABASE_URL or the PG_* variables to
configure the connection. SQLite remains available with DB_TYPE=sqlite.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DB_TYPE = os.getenv("DB_TYPE", "postgresql").lower().strip()
DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "edupulse.db")
)

if DB_TYPE == "sqlite":
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False,
    )
    print(f"  Database: SQLite -> {DB_PATH}")
elif DB_TYPE == "postgresql":
    SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
    if SQLALCHEMY_DATABASE_URL:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True,
            echo=False,
        )
    else:
        postgres_url = URL.create(
            drivername="postgresql+psycopg",
            username=os.getenv("PG_USER", "postgres"),
            password=os.getenv("PG_PASSWORD", ""),
            host=os.getenv("PG_HOST", "localhost"),
            port=int(os.getenv("PG_PORT", "5432")),
            database=os.getenv("PG_DATABASE", "edupulse_ai"),
        )
        SQLALCHEMY_DATABASE_URL = postgres_url
        engine = create_engine(
            postgres_url,
            pool_size=int(os.getenv("PG_POOL_SIZE", "10")),
            max_overflow=int(os.getenv("PG_MAX_OVERFLOW", "20")),
            pool_pre_ping=True,
            echo=False,
        )
    print("  Database: PostgreSQL")
else:
    raise ValueError(
        f"Unsupported DB_TYPE {DB_TYPE!r}. Choose 'postgresql' or 'sqlite'."
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
