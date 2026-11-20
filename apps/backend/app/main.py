from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import settings
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    init_db()
    yield


app = FastAPI(
    title="British Auction RFQ API",
    description="Backend service providing British Auction-style bidding for RFQs",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS so Next.js frontend can call FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "service": "British Auction RFQ API",
        "status": "online",
        "docs_url": "/docs",
    }
