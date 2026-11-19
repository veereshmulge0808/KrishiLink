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
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Telecom / OTP
    MOCK_OTP: bool = True
    MOCK_OTP_CODE: str = "123456"
    OTP_EXPIRY_SECONDS: int = 300

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


settings = Settings()
