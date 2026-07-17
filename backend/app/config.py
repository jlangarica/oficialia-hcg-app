"""Configuración centralizada, multiplataforma y validada."""

import logging
import os
import platform
import shutil
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

logger = logging.getLogger(__name__)

# ─── Helpers privados ────────────────────────────────────────────
def _env_int(name: str, default: int) -> int:
    """Convierte variable de entorno a entero, con default seguro."""
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        logger.warning("Valor inválido para %s, usando %d", name, default)
        return default


def _detect_scanner_binary() -> str:
    """
    Devuelve el nombre del binario de NAPS2 según el SO actual.
    Si la variable SCANBRIDGE_SCANNER_BINARY está definida, se usa esa.
    """
    explicit = os.getenv("SCANBRIDGE_SCANNER_BINARY")
    if explicit:
        logger.info("Usando binario de escáner desde variable de entorno: %s", explicit)
        return explicit

    system = platform.system()
    if system == "Windows":
        binary = "naps2.console"     # Sin extensión, asyncio lo resuelve en PATH
    elif system == "Linux":
        binary = "naps2"
    else:
        logger.warning(
            "Sistema operativo no reconocido (%s), usando 'naps2' por defecto.", system
        )
        binary = "naps2"

    # Verificación temprana: ¿existe en el PATH?
    if shutil.which(binary) is None:
        logger.error(
            "El binario '%s' no se encuentra en el PATH. "
            "Asegúrate de que NAPS2 esté instalado y accesible.",
            binary,
        )
    else:
        logger.info("Binario NAPS2 detectado en PATH: %s", shutil.which(binary))

    return binary


# ─── Configuración inmutable ─────────────────────────────────────
@dataclass(frozen=True)
class Settings:
    """Configuración de la aplicación ScanBridge."""

    # Rutas de archivos (usan directorio temporal del SO)
    raw_pdf_path: Path = field(default_factory=lambda: Path(
        os.getenv("SCANBRIDGE_RAW_PDF_PATH",
                  str(Path(tempfile.gettempdir()) / "raw_scan.pdf"))
    ))
    processed_pdf_path: Path = field(default_factory=lambda: Path(
        os.getenv("SCANBRIDGE_PROCESSED_PDF_PATH",
                  str(Path(tempfile.gettempdir()) / "oficialia_final_processed.pdf"))
    ))

    # Perfil del escáner
    scanner_profile: str = os.getenv("SCANBRIDGE_SCANNER_PROFILE", "Oficialia_Estandar")

    # Binario dinámico (evaluado una sola vez gracias a default_factory)
    scanner_binary: str = field(default_factory=_detect_scanner_binary)

    # Parámetros de escaneo
    default_resolution: int = _env_int("SCANBRIDGE_DEFAULT_RESOLUTION", 300)
    thumbnail_dpi: int = _env_int("SCANBRIDGE_THUMBNAIL_DPI", 72)

    # Red
    host: str = os.getenv("SCANBRIDGE_HOST", "127.0.0.1")
    port: int = _env_int("SCANBRIDGE_PORT", 8001)

    # Timeout de escaneo
    scan_timeout: int = _env_int("SCANBRIDGE_SCAN_TIMEOUT", 300)

    # ── Validación post-inicialización ─────────────────────────
    def __post_init__(self) -> None:
        """Comprueba que las rutas de salida tengan directorios escribibles."""
        for path_attr in ("raw_pdf_path", "processed_pdf_path"):
            path = getattr(self, path_attr)
            parent = path.parent
            if not parent.exists():
                logger.warning(
                    "El directorio %s no existe, se intentará crear al escribir.", parent
                )
            elif not os.access(parent, os.W_OK):
                logger.error("Sin permisos de escritura en %s", parent)