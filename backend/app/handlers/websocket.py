"""Manejador WebSocket con validación Pydantic y orquestación de servicios."""


import asyncio
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
from app.models import EditOperation, PageThumbnail
from app.schemas import (
    ApplyEditsCommand,
    Command,
    LoadLocalPdfCommand,
    StartScanCommand,
)
from app.services.pdf_processor import PDFProcessor
from app.services.scanner import ScannerService

logger = logging.getLogger(__name__)


class ScanBridgeHandler:
    """Orquesta los comandos recibidos por WebSocket utilizando los servicios.

    Utiliza modelos Pydantic para la validación de los mensajes entrantes,
    garantizando que los datos cumplen con el esquema esperado antes de
    procesarlos.
    """

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
        """Bucle principal de manejo de conexiones WebSocket."""
        await self._websocket.accept()
        logger.info("Cliente frontend conectado al puente de hardware.")

        # Diagnosticar presencia de hardware real
        scanner_model = await self._scanner.detect_hardware_scanner()
        if scanner_model:
            await self._send_event(
                "HARDWARE_STATUS", online=True, model=scanner_model
            )
        else:
            await self._send_event(
                "HARDWARE_STATUS",
                online=False,
                model="Ninguno detectado",
            )

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
        """Parsea y valida el mensaje entrante usando los esquemas Pydantic.

        Args:
            raw_data: Texto crudo recibido por WebSocket.

        Returns:
            Instancia del comando validado o None si el mensaje no es válido.
        """
        try:
            payload = json.loads(raw_data)
        except json.JSONDecodeError:
            self._send_error_async("El payload no es un JSON válido")
            return None

        try:
            return Command(**payload)  # type: ignore[arg-type]
        except PydanticValidationError as exc:
            self._send_error_async(
                f"Error de validación: {exc.errors()}"
            )
            return None

    def _send_error_async(self, message: str) -> None:
        """Programa el envío de un error sin bloquear el parser.

        Usa asyncio.create_task para no bloquear el flujo síncrono
        del parser de comandos.
        """
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._send_error(message))
        except RuntimeError:
            # No hay event loop disponible (caso improbable)
            logger.error(
                "No se pudo enviar error WebSocket: sin event loop"
            )

    async def _handle_start_scan(self, cmd: StartScanCommand) -> None:
        """Gestiona el comando START_SCAN."""
        logger.info("Comando recibido: START_SCAN")
        await self._send_event("SCAN_STARTED")
        await self._send_scan_status(
            15, "Inicializando alimentador del escáner..."
        )

        try:
            result = await self._scanner.scan(
                duplex=cmd.duplex, resolution=cmd.resolution
            )
        except ScannerError as exc:
            logger.error("Error de escaneo: %s", exc)
            await self._send_error(
                f"Error de hardware en el escáner: {exc}"
            )
            return

        if not result.success:
            logger.error("Error NAPS2: %s", result.stderr)
            await self._send_error(
                f"Error de hardware en el escáner: {result.stderr}"
            )
            return

        await self._send_scan_status(
            70, "Digitalización completa. Generando vistas previas..."
        )
        await self._send_event(
            "SCAN_COMPLETED",
            output_path=str(self._scanner.settings.raw_pdf_path),
        )

        try:
            # Delegar operación CPU-bound al pool de threads
            pages = await asyncio.to_thread(
                self._pdf_processor.generate_thumbnails
            )
            await self._send_event(
                "THUMBNAILS_READY",
                pages=[self._thumbnail_to_dict(p) for p in pages],
            )
        except PDFProcessingError as exc:
            logger.error("Error procesando PDF: %s", exc)
            await self._send_error(
                f"Error al procesar las páginas escaneadas: {exc}"
            )
        except Exception:
            logger.exception("Error inesperado generando thumbnails")
            await self._send_error(
                "Error interno al generar vistas previas"
            )

    async def _handle_apply_edits(self, cmd: ApplyEditsCommand) -> None:
        """Gestiona el comando APPLY_EDITS."""
        logger.info("Comando recibido: APPLY_EDITS")

        operations = [
            EditOperation(
                source_index=op.source_index,
                rotation=op.rotation,
            )
            for op in cmd.operations
        ]

        try:
            final_path = await asyncio.to_thread(
                self._pdf_processor.apply_edits, operations
            )
            await self._send_event(
                "EDITS_APPLIED", output_path=str(final_path)
            )
        except PDFProcessingError as exc:
            logger.error("Error aplicando ediciones: %s", exc)
            await self._send_error(
                f"No se pudieron guardar las modificaciones: {exc}"
            )
        except Exception:
            logger.exception("Error inesperado aplicando ediciones")
            await self._send_error(
                "Error interno al aplicar modificaciones"
            )

    async def _handle_load_local_pdf(self, cmd: LoadLocalPdfCommand) -> None:
        """Gestiona el comando LOAD_LOCAL_PDF."""
        logger.info("Comando recibido: LOAD_LOCAL_PDF")
        await self._send_event("SCAN_STARTED")
        await self._send_scan_status(
            25, "Inyectando flujo binario en repositorio..."
        )

        try:
            # Escritura de archivo: también delegar a thread
            await asyncio.to_thread(
                self._pdf_processor.save_pdf_from_base64,
                cmd.base64_data,
            )

            await self._send_scan_status(
                60, "Archivo verificado. Extrayendo páginas..."
            )
            await self._send_event(
                "SCAN_COMPLETED",
                output_path=str(self._scanner.settings.raw_pdf_path),
            )

            # Generación de miniaturas en thread separado
            pages = await asyncio.to_thread(
                self._pdf_processor.generate_thumbnails
            )
            await self._send_event(
                "THUMBNAILS_READY",
                pages=[self._thumbnail_to_dict(p) for p in pages],
            )
            logger.info(
                "PDF inyectado con éxito: %d páginas procesadas.",
                len(pages),
            )

        except Exception as exc:
            logger.error("Error procesando PDF local: %s", exc)
            await self._send_error(
                f"Fallo al procesar el PDF cargado: {exc}"
            )

    @staticmethod
    def _thumbnail_to_dict(thumbnail: PageThumbnail) -> dict[str, Any]:
        """Serializa un PageThumbnail a diccionario JSON-friendly."""
        return {
            "page_index": thumbnail.page_index,
            "mime": thumbnail.mime,
            "base64": thumbnail.base64,
        }

    async def _send_event(self, event: str, **kwargs: Any) -> None:
        """Envía un evento estructurado por WebSocket."""
        message = {"event": event, **kwargs}
        await self._websocket.send_text(json.dumps(message))

    async def _send_scan_status(
        self, progress: int, message: str
    ) -> None:
        """Envía un evento de estado de progreso del escaneo."""
        await self._send_event(
            "scan_status", progress=progress, message=message
        )

    async def _send_error(self, message: str) -> None:
        """Envía un evento de error al cliente."""
        await self._send_event("SCAN_ERROR", message=message)
