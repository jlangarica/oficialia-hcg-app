"""Punto de entrada principal de la aplicación FastAPI."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.handlers.websocket import ScanBridgeHandler
from app.services.scanner_service import ScannerService
from app.services.pdf_processor import PDFProcessor
from app.services.document_service import DocumentService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación (startup/shutdown)."""
    scanner_service = ScannerService(settings)
    pdf_processor = PDFProcessor(settings)
    document_service = DocumentService(settings)

    # Inyección de dependencias en el estado de la app
    app.state.scanner_service = scanner_service
    app.state.pdf_processor = pdf_processor
    app.state.document_service = document_service

    logger.info(
        "Servicio iniciado en %s:%d | Raw PDF: %s | DB: %s",
        settings.host, settings.port,
        settings.raw_pdf_path,
        settings.raw_pdf_path.parent / "oficialia.db",
    )
    yield
    logger.info("Apagando servicio de escaneo...")


app = FastAPI(title="Oficialía Digital Bridge", lifespan=lifespan)

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción restringir al dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir estáticos (frontend compilado o src)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    """Sirve el index.html del frontend."""
    return FileResponse("static/index.html")


@app.websocket("/")
async def websocket_endpoint(websocket):
    """Endpoint WebSocket para comunicación en tiempo real."""
    # Validación básica de origen si es necesario
    # origin = websocket.headers.get("origin")
    
    scanner: ScannerService = app.state.scanner_service
    pdf_proc: PDFProcessor = app.state.pdf_processor
    doc_service: DocumentService = app.state.document_service

    handler = ScanBridgeHandler(websocket, scanner, pdf_proc, doc_service)  
    await handler.handle()                   