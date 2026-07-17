"""Servicio de escaneo usando SANE nativo (Linux) y NAPS2 CLI (Windows), con exclusión mutua."""

import asyncio
import logging
import os
import platform
import shlex
import shutil
from typing import Optional
import fitz  # ◄ Usado para la conversión instantánea y atómica de PNG a PDF en Linux

from app.config import Settings
from app.exceptions import ScannerError
from app.models import ScanResult

logger = logging.getLogger(__name__)


class ScannerService:
    """Encapsula la interacción con el hardware de escaneo protegiendo el bus de datos."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._lock = asyncio.Lock()
        self._detected_device: Optional[str] = None

    @property
    def settings(self) -> Settings:
        return self._settings

    async def scan(
        self, duplex: bool = False, resolution: int | None = None
    ) -> ScanResult:
        """Ejecuta un escaneo físico protegiendo el bus de hardware via Lock."""
        async with self._lock:
            system = platform.system()

            # ════════════════════════════════════════════════════════════
            # MODO LINUX: SANE nativo con scanimage (Headless y Robusto)
            # ════════════════════════════════════════════════════════════
            if system == "Linux":
                if not self._detected_device:
                    raise ScannerError("No se ha detectado ningún escáner físico activo.")

                # Generamos una imagen temporal limpia en el directorio temporal
                temp_img_path = str(self._settings.raw_pdf_path.with_suffix(".png"))
                dpi = resolution or self._settings.default_resolution

                cmd = [
                    "scanimage",
                    "-d", self._detected_device,
                    "--format", "png",
                    "--resolution", str(dpi),
                    "-o", temp_img_path,
                ]

                duplex_failed = True
                
                # Intentamos escaneo duplex en ADF si el usuario lo solicita
                if duplex:
                    cmd_duplex = cmd + ["--source", "ADF Duplex"]
                    logger.info("Intentando escaneo duplex en Linux: %s", shlex.join(cmd_duplex))
                    process = await asyncio.create_subprocess_exec(
                        *cmd_duplex,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=self._settings.scan_timeout,
                    )
                    if process.returncode == 0:
                        duplex_failed = False
                    else:
                        logger.warning("Duplex no soportado por este hardware. Reintentando simplex...")
                        if os.path.exists(temp_img_path):
                            try:
                                os.remove(temp_img_path)
                            except Exception:
                                pass

                # Fallback o ejecución inicial Simplex
                if duplex_failed:
                    logger.info("Ejecutando escaneo simplex en Linux: %s", shlex.join(cmd))
                    process = await asyncio.create_subprocess_exec(
                        *cmd,
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=self._settings.scan_timeout,
                    )

                stdout_str = stdout.decode().strip() if stdout else ""
                stderr_str = stderr.decode().strip() if stderr else ""

                if process.returncode != 0:
                    logger.error("scanimage falló con código %d", process.returncode)
                    if stdout_str:
                        logger.error("scanimage stdout: %s", stdout_str)
                    if stderr_str:
                        logger.error("scanimage stderr: %s", stderr_str)
                    return ScanResult(
                        returncode=process.returncode,
                        stderr=stderr_str or stdout_str or "Error de comunicación con SANE",
                    )

                # Conversión transparente de PNG a PDF usando PyMuPDF (fitz)
                try:
                    if not os.path.exists(temp_img_path):
                        raise ScannerError("La imagen digitalizada no fue generada.")

                    logger.info("Empaquetando imagen a PDF de forma atómica...")
                    doc = fitz.open()
                    img_doc = fitz.open(temp_img_path)
                    pdf_bytes = img_doc.convert_to_pdf()
                    pdf_mem = fitz.open("pdf", pdf_bytes)
                    doc.insert_pdf(pdf_mem)
                    
                    # Guardamos el PDF definitivo en la ruta oficial de Oficialía
                    doc.save(str(self._settings.raw_pdf_path))
                    doc.close()
                    img_doc.close()

                    # Limpieza del archivo de imagen temporal
                    os.remove(temp_img_path)
                    logger.info("Estructura PDF consolidada con éxito en: %s", self._settings.raw_pdf_path)
                    return ScanResult(returncode=0, stderr="")

                except Exception as exc:
                    logger.exception("Fallo crítico en post-procesamiento de imagen a PDF")
                    return ScanResult(returncode=1, stderr=f"Error al compilar el PDF final: {exc}")

            # ════════════════════════════════════════════════════════════
            # MODO WINDOWS: NAPS2 nativo (Headless nativo en Windows)
            # ════════════════════════════════════════════════════════════
            else:
                if self._detected_device:
                    cmd = [
                        self._settings.scanner_binary,
                        "-d", self._detected_device,
                        "-o", str(self._settings.raw_pdf_path),
                        "--force",
                        "--hide-progress",
                    ]
                else:
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

                logger.debug("Comando Windows a ejecutar: %s", shlex.join(cmd))

                process = None
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
                    logger.error("Timeout de escaneo en Windows")
                    if process and process.returncode is None:
                        process.kill()
                        await process.wait()
                    raise ScannerError("El escaneo excedió el tiempo límite.") from exc
                except FileNotFoundError as exc:
                    raise ScannerError(
                        f"Binario '{self._settings.scanner_binary}' no encontrado."
                    ) from exc
                except Exception as exc:
                    logger.exception("Error inesperado en Windows")
                    raise ScannerError(f"Fallo en el proceso de escaneo: {exc}") from exc

                if process is None:
                    raise ScannerError("No se pudo iniciar el proceso de escaneo.")

                stdout_str = stdout.decode().strip() if stdout else ""
                stderr_str = stderr.decode().strip() if stderr else ""

                if process.returncode != 0:
                    return ScanResult(
                        returncode=process.returncode,
                        stderr=stderr_str or stdout_str or f"Error Windows (Código: {process.returncode})",
                    )

                return ScanResult(returncode=0, stderr="")

    async def detect_hardware_scanner(self) -> str | None:
        """Lista los dispositivos evitando popups gráficos mediante SANE nativo en Linux."""
        async with self._lock:
            system = platform.system()
            
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
                        lines = decoded.splitlines()
                        devices = [
                            line.split("`")[1].split("'")[0]
                            for line in lines
                            if "`" in line and "'" in line
                        ]
                        if devices:
                            logger.info("Escáner físico SANE detectado: %s", devices[0])
                            self._detected_device = devices[0]
                            return devices[0]
                    else:
                        lines = decoded.splitlines()
                        devices = [
                            line.strip()
                            for line in lines
                            if line.strip() and not line.startswith("---")
                        ]
                        if devices:
                            self._detected_device = devices[0]
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
