"""
routers/auth.py — /api/v1/auth/register and /api/v1/auth/login
"""
from fastapi import APIRouter, HTTPException
from psycopg2 import errors as pg_errors

from auth_handler import create_access_token, hash_password, verify_password
from database import get_db_cursor
from models import TokenResponse, UserLogin, UserSignup

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserSignup):
    hashed = hash_password(payload.password)
    try:
        with get_db_cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (email, password_hash, role)
                VALUES (%s, %s, %s)
                RETURNING id, role
                """,
                (payload.email, hashed, payload.role),
            )
            row = cur.fetchone()
    except pg_errors.UniqueViolation:
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    token = create_access_token({"sub": str(row["id"]), "role": row["role"]})
    return TokenResponse(access_token=token, role=row["role"])


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin):
    with get_db_cursor() as cur:
        cur.execute(
            "SELECT id, password_hash, role FROM users WHERE email = %s",
            (payload.email,),
        )
        row = cur.fetchone()

    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": str(row["id"]), "role": row["role"]})
    return TokenResponse(access_token=token, role=row["role"])
