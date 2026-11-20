from fastapi import APIRouter

from app.api.quotes import router as quotes_router
from app.api.rfqs import router as rfqs_router

api_router = APIRouter()
api_router.include_router(rfqs_router)
api_router.include_router(quotes_router)
