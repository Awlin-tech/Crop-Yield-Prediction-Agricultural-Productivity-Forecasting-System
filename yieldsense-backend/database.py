"""
database.py — connection handling for the YieldSense PostgreSQL store.

Uses plain psycopg2 (no ORM) to keep Milestone 1 lightweight. Swap in
SQLAlchemy later if the schema grows past Milestone 2.
"""
import os
from contextlib import contextmanager

import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_SuXxflvshE87@ep-jolly-heart-at2m9sl6-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)

@contextmanager
def get_db_connection():
    """Yield a psycopg2 connection, committing on success and rolling back on error."""
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@contextmanager
def get_db_cursor():
    """Yield a dict-cursor bound to a managed connection."""
    with get_db_connection() as conn:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        try:
            yield cur
        finally:
            cur.close()


def init_db():
    """Apply schema.sql on startup so a fresh DB is ready without a manual step."""
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute(schema_sql)
        cur.close()
