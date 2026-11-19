from app.routers.auth import router as auth_router
from app.routers.catalog import router as catalog_router
from app.routers.farmers import router as farmers_router
from app.routers.buyers import router as buyers_router
from app.routers.orders import router as orders_router
from app.routers.hubs import router as hubs_router
from app.routers.admin import router as admin_router

__all__ = [
    "auth_router",
    "catalog_router",
    "farmers_router",
    "buyers_router",
    "orders_router",
    "hubs_router",
    "admin_router",
]
