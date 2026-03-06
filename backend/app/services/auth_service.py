"""
Authentication service — user registration, login, token management.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    TokenResponse,
    UserRegisterRequest,
    UserResponse,
)


class AuthService:
    """Handles user authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: UserRegisterRequest) -> AuthResponse:
        """Register a new user."""
        # Check if email already exists
        existing = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalar_one_or_none() is not None:
            raise ValueError("Email already registered")

        # Create user
        user = User(
            id=uuid.uuid4(),
            email=data.email,
            hashed_password=hash_password(data.password),
            display_name=data.display_name,
            role="editor",
        )
        self.db.add(user)
        await self.db.flush()

        # Generate tokens
        tokens = self._create_tokens(str(user.id))

        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=tokens,
        )

    async def login(self, email: str, password: str) -> AuthResponse:
        """Authenticate user with email and password."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        user = result.scalar_one_or_none()

        if user is None or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account is disabled")

        tokens = self._create_tokens(str(user.id))

        return AuthResponse(
            user=UserResponse.model_validate(user),
            tokens=tokens,
        )

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Refresh access token using a valid refresh token."""
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise ValueError("Invalid refresh token")

        user_id = payload.get("sub")
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        if user is None or not user.is_active:
            raise ValueError("User not found or inactive")

        return self._create_tokens(str(user.id))

    def _create_tokens(self, user_id: str) -> TokenResponse:
        """Generate access + refresh token pair."""
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
