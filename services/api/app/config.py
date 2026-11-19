from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_DB_FILE = str(_BASE_DIR / "krishilink.db").replace("\\", "/")


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_NAME: str = "KrishiLink API"
    APP_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "debug", "dev")
        return bool(v)

    # Security
    SECRET_KEY: str = "development-insecure-secret-key-32-chars-minimum-krishilink"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # Database
    DATABASE_URL: str = f"sqlite+pysqlite:///{_DEFAULT_DB_FILE}"
    TEST_DATABASE_URL: str = "sqlite+pysqlite:///:memory:"
    DB_ECHO: bool = False

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Telecom / OTP
    MOCK_OTP: bool = True
    MOCK_OTP_CODE: str = "123456"
    OTP_EXPIRY_SECONDS: int = 300
    OTP_MAX_ATTEMPTS: int = 5          # per request_id before lockout
    OTP_RATE_LIMIT_WINDOW_S: int = 60  # cooldown window in seconds

    # Demo login (ONLY respected when ENVIRONMENT=development AND DEMO_LOGIN_ENABLED=true)
    DEMO_LOGIN_ENABLED: bool = True

    # Business rules defaults
    DEFAULT_FARMER_THRESHOLD_KG: float = 20.0
    LISTING_CUTOFF_HOUR_IST: int = 18
    ORDER_CUTOFF_HOUR_IST: int = 20
    WEIGHT_VARIANCE_TOLERANCE_PCT: float = 2.0
    ARRIVAL_GEOFENCE_METERS: float = 150.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() in ("development", "dev", "local")

    @property
    def demo_login_allowed(self) -> bool:
        """Demo login is ONLY allowed in development mode and when explicitly enabled."""
        return self.is_development and self.DEMO_LOGIN_ENABLED

    @property
    def using_insecure_secret(self) -> bool:
        return self.SECRET_KEY.startswith("development-insecure")


settings = Settings()

# Hard-fail in production if still using insecure default secret
if not settings.is_development and settings.using_insecure_secret:
    raise RuntimeError(
        "FATAL: SECRET_KEY is set to the insecure development default. "
        "Set a strong random SECRET_KEY before deploying to production."
    )
