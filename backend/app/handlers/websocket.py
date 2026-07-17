"""Manejador WebSocket con validación Pydantic y mitigación de desconexiones abruptas."""

import json
import logging
from typing import Any

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import ValidationError as PydanticValidationError

from app.exceptions import (
    PDFProcessingError,
    ScannerError,
    ValidationError,
)
from app.models import PageThumbnail
# ◄ CORREGIDO: Importamos CommandAdapter para resolver la unión discriminada
from app.schemas import ApplyEditsCommand, Command, CommandAdapter, StartScanCommand, LoadLocalPdfCommand
from app.services.pdf_processor import PDFProcessor
from app.services.scanner import ScannerService

logger = logging.getLogger(__name__)


class ScanBridgeHandler:
    """Orquesta los comandos recibidos por WebSocket utilizando los servicios."""

    def __init__(
        self,
        websocket: WebSocket,
        scanner: ScannerService,
        pdf_processor: PDFProcessor,
    ) -> None:
        self._websocket = websocket
        self._scanner = scanner
        self._pdf_processor = pdf_processor

    async def handle(self) -> None:
        """Bucle principal de mensajes con protección total contra desconexiones en hot-paths."""
        await self._websocket.accept()
        logger.info("Cliente frontend conectado al puente de hardware.")

        try:
            # DIAGNÓSTICO INICIAL: Protegido por el bloque try externo
            scanner_model = await self._scanner.detect_hardware_scanner()
            
            if scanner_model:
                await self._send_event("HARDWARE_STATUS", online=True, model=scanner_model)
            else:
                await self._send_event("HARDWARE_STATUS", online=False, model="Ninguno detectado")

            # BUCLE DE COMANDOS ELECTIVO
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
                else:
                    await self._send_error(
                        f"Comando no soportado: {type(command).__name__}"
                    )
        except WebSocketDisconnect:
            logger.info("Un canal WebSocket previo fue liberado o abandonado por el frontend.")
        except Exception:
            logger.exception("Error crítico inesperado en el bus del WebSocket")
            try:
                await self._send_error("Error interno del servidor")
            except Exception:
                pass

    def _parse_command(self, raw_data: str) -> Command | None:
        """Parsea y valida el mensaje entrante usando los esquemas Pydantic."""
        try:
            payload = json.loads(raw_data)
        except json.JSONDecodeError:
            self._send_error_sync("El payload no es un JSON válido")
            return None

        try:
            # ◄ CORREGIDO: Consumir la validación directa del adaptador de Pydantic v2
            return CommandAdapter.validate_python(payload)
        except PydanticValidationError as exc:
            self._send_error_sync(f"Error de validación: {exc.errors()}")
            return None

    def _send_error_sync(self, message: str) -> None:
        """Versión síncrona para enviar errores desde el parser."""
        import asyncio
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._send_error(message))
        except RuntimeError:
            pass

    async def _handle_start_scan(self, cmd: StartScanCommand) -> None:
        """Gestiona el comando START_SCAN."""
        logger.info("Comando recibido: START_SCAN")
        await self._send_event("SCAN_STARTED")
        await self._send_scan_status(15, "Inicializando alimentador del escáner...")

        try:
            result = await self._scanner.scan(duplex=cmd.duplex, resolution=cmd.resolution)
        except ScannerError as exc:
            logger.error("Error de escaneo: %s", exc)
            await self._send_error(f"Error de hardware en el escáner: {exc}")
            return

        if not result.success:
            logger.error("Error NAPS2: %s", result.stderr)
            await self._send_error(f"Error de hardware en el escáner: {result.stderr}")
            return

        await self._send_scan_status(70, "Digitalización completa. Generando vistas previas...")
        await self._send_event(
            "SCAN_COMPLETED",
            output_path=str(self._scanner.settings.raw_pdf_path),
        )

        try:
            pages = self._pdf_processor.generate_thumbnails()
            await self._send_event(
                "THUMBNAILS_READY",
                pages=[self._thumbnail_to_dict(p) for p in pages],
            )
        except PDFProcessingError as exc:
            logger.error("Error procesando PDF: %s", exc)
            await self._send_error(f"Error al procesar las páginas escaneadas: {exc}")
        except Exception:
            logger.exception("Error inesperado generando thumbnails")
            await self._send_error("Error interno al generar vistas previas")

    async def _handle_apply_edits(self, cmd: ApplyEditsCommand) -> None:
        """Gestiona el comando APPLY_EDITS."""
        logger.info("Comando recibido: APPLY_EDITS")
        from app.models import EditOperation

        operations = [
            EditOperation(source_index=op.source_index, rotation=op.rotation)
            for op in cmd.operations
        ]

        try:
            final_path = self._pdf_processor.apply_edits(operations)
            await self._send_event("EDITS_APPLIED", output_path=str(final_path))
        except PDFProcessingError as exc:
            logger.error("Error aplicando ediciones: %s", exc)
            await self._send_error(f"No se pudieron guardar las modificaciones: {exc}")
        except Exception:
            logger.exception("Error inesperado aplicando ediciones")
            await self._send_error("Error interno al aplicar modificaciones")

    async def _handle_load_local_pdf(self, cmd: LoadLocalPdfCommand) -> None:
        """Gestiona el comando LOAD_LOCAL_PDF."""
        logger.info("Comando recibido: LOAD_LOCAL_PDF")
        await self._send_event("SCAN_STARTED")
        await self._send_scan_status(25, "Inyectando flujo binario en repositorio...")

        try:
            self._pdf_processor.save_pdf_from_base64(cmd.base64_data)
            await self._send_scan_status(60, "Archivo verificado. Extrayendo páginas...")
            await self._send_event(
                "SCAN_COMPLETED",
                output_path=str(self._scanner.settings.raw_pdf_path),
            )
            
            pages = self._pdf_processor.generate_thumbnails()
            await self._send_event(
                "THUMBNAILS_READY",
                pages=[self._thumbnail_to_dict(p) for p in pages],
            )
            logger.info("PDF inyectado con éxito: %d páginas procesadas.", len(pages))
        except Exception as exc:
            logger.error("Error procesando PDF local: %s", exc)
            await self._send_error(f"Fallo al procesar el PDF cargado: {exc}")

    @staticmethod
    def _thumbnail_to_dict(thumbnail: PageThumbnail) -> dict[str, Any]:
        return {
            "page_index": thumbnail.page_index,
            "mime": thumbnail.mime,
            "base64": thumbnail.base64,
        }

    async def _send_event(self, event: str, **kwargs: Any) -> None:
        await self._websocket.send_text(json.dumps({"event": event, **kwargs}))

    async def _send_scan_status(self, progress: int, message: str) -> None:
        await self._send_event("scan_status", progress=progress, message=message)

    async def _send_error(self, message: str) -> None:
        await self._send_event("SCAN_ERROR", message=message)
