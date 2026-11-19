from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import engine, Base
from app.core.exceptions import KrishiLinkException
from app.routers import (
    auth_router, catalog_router, farmers_router,
    buyers_router, orders_router, hubs_router, admin_router,
    driver_router, bridge_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.DATABASE_URL.startswith("sqlite"):
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="KrishiLink Farm-to-Bulk-Buyer Logistics Platform API (Bengaluru & Surrounding Villages)",
    docs_url="/docs",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Standard Error Envelopes conforming to 05_API_SPEC.md
@app.exception_handler(KrishiLinkException)
async def krishilink_exception_handler(request: Request, exc: KrishiLinkException):
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
        headers=exc.headers
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request payload failed schema validation",
                "details": {"errors": exc.errors()}
            }
        }
    )


# Include Routers with /api/v1 prefix
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(catalog_router, prefix=settings.API_V1_PREFIX)
app.include_router(farmers_router, prefix=settings.API_V1_PREFIX)
app.include_router(buyers_router, prefix=settings.API_V1_PREFIX)
app.include_router(orders_router, prefix=settings.API_V1_PREFIX)
app.include_router(hubs_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_router, prefix=settings.API_V1_PREFIX)
app.include_router(driver_router, prefix=settings.API_V1_PREFIX)
# Frontend compatibility bridge (bare /api/ paths — no v1 prefix)
app.include_router(bridge_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }
