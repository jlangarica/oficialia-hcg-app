# backend/app/handlers/websocket.py
"""Manejador de conexiones WebSocket para comunicación con el frontend."""

import asyncio
import logging
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect

from app.schemas import Command, SaveDocumentCommand, StartScanCommand, ApplyEditsCommand, LoadLocalPdfCommand
from app.services.pdf_processor import PDFProcessor
from app.services.scanner_service import ScannerService
from app.services.document_service import DocumentService
from app.exceptions import PDFProcessingError

logger = logging.getLogger(__name__)


class ScanBridgeHandler:
    """Gestiona el ciclo de vida de una conexión WebSocket individual."""

    def __init__(
        self,
        websocket: WebSocket,
        scanner: ScannerService,
        pdf_processor: PDFProcessor,
        document_service: DocumentService,
    ) -> None:
        self._websocket = websocket
        self._scanner = scanner
        self._pdf_processor = pdf_processor
        self._document_service = document_service

    async def handle(self) -> None:
        """Bucle principal de manejo de conexiones WebSocket."""
        await self._websocket.accept()
        logger.info("Cliente frontend conectado al puente de hardware.")

        # Enviar estado inicial del hardware
        await self._send_hardware_status()

        try:
            while True:
                raw_data = await self._websocket.receive_text()
                command = self._parse_command(raw_data)
                if command is None:
                    continue

                if isinstance(command, StartScanCommand):
                    await self._handle_start_scan(command)
                elif isinstance(command, ApplyEditsCommand):
                    await self._handle_apply_edits(command)
                elif isinstance(command, LoadLocalPdfCommand):
                    await self._handle_load_local_pdf(command)
                elif isinstance(command, SaveDocumentCommand):
                    await self._handle_save_document(command)
                else:
                    await self._send_error(
                        f"Comando no soportado: {type(command).__name__}"
                    )
        except WebSocketDisconnect:
            logger.info("El frontend cerró la conexión.")
        except Exception:
            logger.exception("Error crítico en el bucle WebSocket")
            await self._send_error("Error interno del servidor")

    def _parse_command(self, raw_data: str) -> Command | None:
        """Analiza y valida el comando JSON recibido."""
        try:
            import json
            data = json.loads(raw_data)
            return Command.model_validate(data)
        except Exception as e:
            logger.warning("Comando inválido recibido: %s", e)
            asyncio.create_task(self._send_error(f"Formato de comando inválido: {e}"))
            return None

    async def _send_event(self, event_type: str, **data: Any) -> None:
        """Envía un evento estructurado al cliente."""
        payload = {"type": event_type, **data}
        await self._websocket.send_json(payload)

    async def _send_error(self, message: str) -> None:
        """Envía un mensaje de error al cliente."""
        await self._send_event("ERROR", message=message)

    async def _send_hardware_status(self) -> None:
        """Envía el diagnóstico inicial del escáner."""
        try:
            is_online = await self._scanner.check_connection()
            await self._send_event(
                "HARDWARE_STATUS",
                online=is_online,
                model=self._scanner.model_name if is_online else "Desconocido",
            )
        except Exception as e:
            logger.error("Error verificando hardware: %s", e)
            await self._send_event("HARDWARE_STATUS", online=False, error=str(e))

    async def _handle_start_scan(self, cmd: StartScanCommand) -> None:
        """Gestiona el inicio del escaneo."""
        logger.info("Iniciando escaneo: DPI=%d, Color=%s", cmd.dpi, cmd.color_mode)
        try:
            await self._send_event("SCAN_STARTED")
            # Simulación de progreso (en implementación real, usar callbacks del scanner)
            for progress in range(0, 101, 10):
                await self._send_event("SCAN_PROGRESS", percent=progress)
                await asyncio.sleep(0.2)
            
            pdf_path = str(self._pdf_processor.settings.processed_pdf_path)
            await self._send_event("SCAN_COMPLETED", pdf_path=pdf_path)
            
        except Exception as e:
            logger.exception("Fallo durante el escaneo")
            await self._send_error(f"Fallo de escaneo: {e}")

    async def _handle_apply_edits(self, cmd: ApplyEditsCommand) -> None:
        """Aplica metadatos al PDF procesado."""
        logger.info("Aplicando ediciones de metadatos...")
        try:
            # Lógica de aplicación de metadatos aquí
            await asyncio.sleep(0.5) # Simular trabajo
            await self._send_event("EDITS_APPLIED", success=True)
        except Exception as e:
            logger.exception("Error aplicando ediciones")
            await self._send_error(f"Error al editar: {e}")

    async def _handle_load_local_pdf(self, cmd: LoadLocalPdfCommand) -> None:
        """Carga un PDF local para previsualización."""
        logger.info("Cargando PDF local: %s", cmd.file_path)
        try:
            # Validar que el archivo existe y es accesible
            await self._send_event("PDF_LOADED", path=cmd.file_path)
        except Exception as e:
            logger.exception("Error cargando PDF local")
            await self._send_error(f"No se pudo cargar el PDF: {e}")

    # ─── NUEVO HANDLER ────────────────────────────────────────────

    async def _handle_save_document(self, cmd: SaveDocumentCommand) -> None:
        """Gestiona el comando SAVE_DOCUMENT.

        Flujo:
        1. Recibe metadatos validados desde el Paso 4.
        2. Invoca DocumentService.save_document() (CPU-bound → thread).
        3. Devuelve DOCUMENT_SAVED con el folio real generado.
        """
        logger.info("Comando recibido: SAVE_DOCUMENT")

        try:
            # Delegar a thread (I/O: SQLite + shutil.copy2)
            result = await asyncio.to_thread(
                self._document_service.save_document,
                clasificacion=cmd.clasificacion,
                remitente=cmd.remitente,
                fecha_doc=cmd.fecha_doc,
                asunto=cmd.asunto,
                source_pdf_path=str(self._pdf_processor.settings.processed_pdf_path),
                total_paginas=cmd.total_paginas,
                ai_metadata=cmd.ai_metadata,
                ai_diff=cmd.ai_diff,
            )

            await self._send_event(
                "DOCUMENT_SAVED",
                folio=result["folio"],
                pdf_path=result["pdf_path"],
                estatus=result["estatus"],
                total_paginas=result["total_paginas"],
            )
            logger.info("Documento guardado con folio: %s", result["folio"])

        except PDFProcessingError as exc:
            logger.error("Error guardando documento: %s", exc)
            await self._send_error(f"Error al guardar: {exc}")
        except Exception:
            logger.exception("Error inesperado al guardar documento")
            await self._send_error("Error interno al guardar el documento")