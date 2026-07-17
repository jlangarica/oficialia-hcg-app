"""Punto de entrada de la aplicación FastAPI."""

import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, WebSocket

from app.config import Settings
from app.handlers.websocket import ScanBridgeHandler
from app.services.pdf_processor import PDFProcessor
from app.services.scanner import ScannerService

# Configuración global de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestiona el ciclo de vida de la aplicación.

    Inicializa los servicios compartidos al arrancar y libera recursos
    al detenerse.
    """
    scanner_service = ScannerService(settings)
    pdf_processor = PDFProcessor(settings)

    # Inyección de dependencias a través del estado de la app
    app.state.scanner_service = scanner_service
    app.state.pdf_processor = pdf_processor

    logger = logging.getLogger(__name__)
    logger.info(
        "Servicio iniciado en %s:%d | Raw PDF: %s",
        settings.host,
        settings.port,
        settings.raw_pdf_path,
    )
    yield

    logger.info("Apagando servicio de escaneo...")


app = FastAPI(title="ScanBridge", lifespan=lifespan)


@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Endpoint WebSocket principal para el puente de hardware de escaneo."""
    scanner: ScannerService = app.state.scanner_service
    pdf_proc: PDFProcessor = app.state.pdf_processor

    handler = ScanBridgeHandler(websocket, scanner, pdf_proc)
    await handler.handle()


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )