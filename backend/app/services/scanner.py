"""Servicio de interacción con el CLI de NAPS2."""

import asyncio
import logging
from pathlib import Path

from app.config import Settings
from app.exceptions import ScannerError
from app.models import ScanResult

logger = logging.getLogger(__name__)


class ScannerService:
    """Encapsula la interacción con el CLI de NAPS2.

    Gestiona timeouts y cancelación segura del subproceso.
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    @property
    def settings(self) -> Settings:
        """Expone la configuración inmutable del servicio."""
        return self._settings

    async def scan(
        self, duplex: bool = False, resolution: int | None = None
    ) -> ScanResult:
        """Ejecuta NAPS2 y devuelve el resultado del proceso.

        Args:
            duplex: Habilita el escaneo a doble cara.
            resolution: DPI de escaneo. Si es None, se usa el valor
                configurado en Settings.

        Returns:
            Instancia de ScanResult con el código de retorno y stderr.

        Raises:
            ScannerError: Si el ejecutable no se encuentra, el proceso
                excede el tiempo límite o no puede iniciarse.
        """
        cmd = [
            "naps2.console",
            "-o", str(self._settings.raw_pdf_path),
            "-p", self._settings.scanner_profile,
            "--force",
        ]
        if duplex:
            cmd.append("--duplex")
        if resolution is not None:
            cmd.extend(["--dpi", str(resolution)])

        process: asyncio.subprocess.Process | None = None
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
        except asyncio.TimeoutError as exc:
            logger.error(
                "Timeout durante el escaneo con NAPS2 después de %ds",
                self._settings.scan_timeout,
            )
            if process is not None and process.returncode is None:
                process.kill()
                await process.wait()
            raise ScannerError(
                f"El escaneo excedió el tiempo límite de "
                f"{self._settings.scan_timeout}s"
            ) from exc
        except FileNotFoundError as exc:
            raise ScannerError(
                "El ejecutable naps2.console no fue encontrado en el PATH"
            ) from exc
        except Exception as exc:
            logger.exception("Error inesperado al ejecutar NAPS2")
            raise ScannerError(
                f"Error al ejecutar el proceso de escaneo: {exc}"
            ) from exc

        if process is None:
            raise ScannerError("No se pudo iniciar el proceso de escaneo")

        return ScanResult(
            returncode=process.returncode,
            stderr=stderr.decode().strip(),
        )

    async def detect_hardware_scanner(self) -> str | None:
        """Ejecuta NAPS2 para listar dispositivos USB/Red conectados.

        Retorna el nombre del primer escáner real encontrado o None.
        Maneja de forma segura la ausencia del ejecutable.
        """
        cmd = ["naps2.console", "--list-devices"]
        process: asyncio.subprocess.Process | None = None
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _stderr = await asyncio.wait_for(
                process.communicate(), timeout=10
            )

            if process.returncode == 0 and stdout:
                lines = stdout.decode().strip().split('\n')
                devices = [
                    line.strip()
                    for line in lines
                    if line.strip() and not line.startswith("---")
                ]
                if devices:
                    return devices[0]
            return None
        except FileNotFoundError:
            logger.warning(
                "El ejecutable 'naps2.console' no fue encontrado. "
                "La detección de escáner está deshabilitada."
            )
            return None
        except asyncio.TimeoutError:
            logger.warning(
                "Timeout al buscar escáneres con 'naps2.console'."
            )
            if process is not None and process.returncode is None:
                process.kill()
                await process.wait()
            return None
        except Exception as e:
            logger.error(
                "Fallo inesperado al diagnosticar hardware: %s", e
            )
            return None