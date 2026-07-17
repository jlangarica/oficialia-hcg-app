"""Servicio de escaneo usando NAPS2 CLI y SANE nativo, con soporte multiplataforma y exclusión mutua."""

import asyncio
import logging
import os
import platform
import shlex
from typing import Optional

from app.config import Settings
from app.exceptions import ScannerError
from app.models import ScanResult

logger = logging.getLogger(__name__)


class ScannerService:
    """Encapsula la interacción con el hardware de escaneo protegiendo el bus de datos."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        # Lock centralizado para evitar colisiones en el bus físico USB/SANE
        self._lock = asyncio.Lock()

    @property
    def settings(self) -> Settings:
        return self._settings

    async def scan(
        self, duplex: bool = False, resolution: int | None = None
    ) -> ScanResult:
        """Ejecuta un escaneo físico forzando el modo oculto y headless en Linux."""
        async with self._lock:
            cmd = [
                self._settings.scanner_binary,
                "-o", str(self._settings.raw_pdf_path),
                "-p", self._settings.scanner_profile,
                "--force",
                "--hide-progress",
            ]
            if duplex:
                cmd.append("--duplex")
            if resolution is not None:
                cmd.extend(["--dpi", str(resolution)])

            logger.debug("Comando a ejecutar: %s", shlex.join(cmd))

            # ════════════════════════════════════════════════════════════
            # AISLAMIENTO GRÁFICO: Forzar entorno headless en Linux
            # ════════════════════════════════════════════════════════════
            sub_env = os.environ.copy()
            if platform.system() == "Linux":
                sub_env.pop("DISPLAY", None)
                sub_env.pop("WAYLAND_DISPLAY", None)

            process: Optional[asyncio.subprocess.Process] = None
            try:
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    env=sub_env,  # Inyectar entorno sin pantalla
                )
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self._settings.scan_timeout,
                )
            except asyncio.TimeoutError as exc:
                logger.error("Timeout de escaneo alcanzado (%d s)", self._settings.scan_timeout)
                if process and process.returncode is None:
                    process.kill()
                    await process.wait()
                raise ScannerError("El escaneo excedió el tiempo límite.") from exc
            except FileNotFoundError as exc:
                raise ScannerError(
                    f"Binario '{self._settings.scanner_binary}' no encontrado. "
                    f"Sistema operativo: {platform.system()}."
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
        """Lista los dispositivos evitando popups gráficos mediante herramientas nativas."""
        async with self._lock:
            system = platform.system()
            
            # En Linux, NAPS2 inicializa la interfaz gráfica antes de procesar los argumentos.
            # Usamos 'scanimage -L' que consulta directamente a SANE de forma invisible en la terminal.
            if system == "Linux":
                cmd = ["scanimage", "-L"]
            else:
                cmd = [self._settings.scanner_binary, "--list-devices"]

            process: Optional[asyncio.subprocess.Process] = None
            try:
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, _ = await asyncio.wait_for(process.communicate(), timeout=5)

                if process.returncode == 0 and stdout:
                    decoded = stdout.decode().strip()
                    if system == "Linux":
                        # Parsear formato de scanimage: device `backend:dev' is a...
                        lines = decoded.splitlines()
                        devices = [
                            line.split("`")[1].split("'")[0]
                            for line in lines
                            if "`" in line and "'" in line
                        ]
                        if devices:
                            logger.info("Escáner físico SANE detectado: %s", devices[0])
                            return devices[0]
                    else:
                        lines = decoded.splitlines()
                        devices = [
                            line.strip()
                            for line in lines
                            if line.strip() and not line.startswith("---")
                        ]
                        if devices:
                            return devices[0]
                return None
            except asyncio.TimeoutError:
                logger.warning("Timeout detectando hardware. Limpiando subproceso...")
                if process and process.returncode is None:
                    try:
                        process.kill()
                        await process.wait()
                    except Exception:
                        pass
                return None
            except FileNotFoundError:
                if system == "Linux":
                    logger.warning("scanimage no encontrado, revisa los paquetes de SANE.")
                return None
            except Exception:
                logger.exception("Error al detectar hardware de escáner.")
                return None
