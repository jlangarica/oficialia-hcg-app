"""Punto de entrada de la aplicación FastAPI."""


import logging
from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import Settings
from app.handlers.websocket import ScanBridgeHandler
from app.services.pdf_processor import PDFProcessor
from app.services.scanner import ScannerService

# Configuración global de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

logger = logging.getLogger(__name__)

settings = Settings()

# Orígenes permitidos para conexiones WebSocket del navegador
_ALLOWED_WS_ORIGINS = frozenset({
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
})


def _is_origin_allowed(origin: str | None) -> bool:
    """Verifica si el origen de la petición WebSocket está permitido."""
    if not origin:
        # Conexiones no-browser (scripts, herramientas CLI)
        # no envían Origin; se permiten en entornos locales
        return True
    return origin in _ALLOWED_WS_ORIGINS


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

    logger.info(
        "Servicio iniciado en %s:%d | Raw PDF: %s",
        settings.host,
        settings.port,
        settings.raw_pdf_path,
    )
    yield

    logger.info("Apagando servicio de escaneo...")


app = FastAPI(title="ScanBridge", lifespan=lifespan)


@app.get("/api/pdf/raw")
async def serve_raw_pdf(path: str | None = None):
    """Sirve el archivo PDF crudo o procesado para visualización en el frontend.
    
    Args:
        path: Ruta opcional del PDF. Si no se proporciona, usa raw_pdf_path por defecto.
    
    Returns:
        FileResponse con el PDF binario.
    """
    try:
        # Determinar qué PDF servir
        if path:
            # Decodificar ruta URL-safe
            from urllib.parse import unquote
            pdf_path = Path(unquote(path))
        else:
            pdf_path = settings.raw_pdf_path
        
        # Validar que el archivo existe
        if not pdf_path.exists():
            return FileResponse(
                status_code=404,
                content={"error": f"PDF no encontrado: {pdf_path}"}
            )
        
        # Validar que es un archivo (no directorio)
        if not pdf_path.is_file():
            return FileResponse(
                status_code=400,
                content={"error": "La ruta no apunta a un archivo válido"}
            )
        
        # Servir el PDF con tipo MIME correcto
        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            filename=pdf_path.name
        )
    except Exception as e:
        logger.error("Error al servir PDF: %s", e)
        return FileResponse(
            status_code=500,
            content={"error": f"Error interno: {str(e)}"}
        )


@app.get("/api/pdf/processed")
async def serve_processed_pdf():
    """Sirve el archivo PDF procesado (después de apply_edits)."""
    pdf_path = settings.processed_pdf_path
    
    if not pdf_path.exists():
        return FileResponse(
            status_code=404,
            content={"error": "PDF procesado no encontrado"}
        )
    
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name
    )


@app.websocket("/")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Endpoint WebSocket principal para el puente de hardware de escaneo."""
    origin = websocket.headers.get("origin")

    if not _is_origin_allowed(origin):
        logger.warning(
            "Conexión WebSocket rechazada — origen no permitido: %s",
            origin,
        )
        await websocket.close(code=1008, reason="Origin not allowed")
        return

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
