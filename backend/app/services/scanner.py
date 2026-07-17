"""Servicio de escaneo usando NAPS2 CLI, con soporte multiplataforma."""

import asyncio
import logging
import platform  # ◄ CORREGIDO: Importado para evitar NameError en excepciones
import shlex
from typing import Optional

from app.config import Settings
from app.exceptions import ScannerError
from app.models import ScanResult

logger = logging.getLogger(__name__)


class ScannerService:
    """Encapsula la interacción con el CLI de NAPS2."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def settings(self) -> Settings:
        return self._settings

    async def scan(
        self, duplex: bool = False, resolution: int | None = None
    ) -> ScanResult:
        """
        Ejecuta un escaneo utilizando el binario configurado automáticamente.

        Args:
            duplex: Activa el escaneo a doble cara.
            resolution: DPI personalizado (usa default si es None).

        Returns:
            ScanResult con el código de salida y stderr.

        Raises:
            ScannerError: Si el proceso falla, timeout o binario no encontrado.
        """
        cmd = [
            self._settings.scanner_binary,
            "-o", str(self._settings.raw_pdf_path),
            "-p", self._settings.scanner_profile,
            "--force",
        ]
        if duplex:
            cmd.append("--duplex")
        if resolution is not None:
            cmd.extend(["--dpi", str(resolution)])

        logger.debug("Comando a ejecutar: %s", shlex.join(cmd))

        process: Optional[asyncio.subprocess.Process] = None
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=self._settings.scan_timeout,
            )
        except asyncio.TimeoutError:
            logger.error("Timeout de escaneo alcanzado (%d s)", self._settings.scan_timeout)
            if process and process.returncode is None:
                process.kill()
                await process.wait()
            raise ScannerError("El escaneo excedió el tiempo límite.")
        except FileNotFoundError as exc:
            raise ScannerError(
                f"Binario '{self._settings.scanner_binary}' no encontrado. "
                f"Sistema operativo: {platform.system()}. Verifica la instalación de NAPS2."
            ) from exc
        except Exception as exc:
            logger.exception("Error inesperado durante el escaneo")
            raise ScannerError(f"Fallo en el proceso de escaneo: {exc}") from exc

        if process is None:
            raise ScannerError("No se pudo iniciar el proceso de escaneo.")

        return ScanResult(
            returncode=process.returncode,
            stderr=stderr.decode().strip() if stderr else "",
        )

    async def detect_hardware_scanner(self) -> str | None:
        """
        Lista los dispositivos de escaneo y devuelve el primero encontrado,
        o None si no hay ninguno disponible.
        """
        cmd = [self._settings.scanner_binary, "--list-devices"]
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(process.communicate(), timeout=10)

            if process.returncode == 0 and stdout:
                lines = stdout.decode().strip().splitlines()
                devices = [
                    line.strip()
                    for line in lines
                    if line.strip() and not line.startswith("---")
                ]
                if devices:
                    logger.info("Dispositivos detectados: %s", devices)
                    return devices[0]
            return None
        except FileNotFoundError:
            logger.warning("Binario NAPS2 no encontrado durante diagnóstico.")
            return None
        except Exception:
            logger.exception("Error al detectar hardware de escáner.")
            return None