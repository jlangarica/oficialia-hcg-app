"""Configuración centralizada de la aplicación, con soporte para variables de entorno."""

import os
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Final

logger = logging.getLogger(__name__)


def _env_int(key: str, default: int) -> int:
    """Lee una variable de entorno como entero con fallback seguro.

    Si el valor no es un entero válido, registra una advertencia
    y retorna el valor por defecto.
    """
    raw = os.getenv(key)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        logger.warning(
            "Variable de entorno %s='%s' no es un entero válido. Usando default: %d",
            key, raw, default
        )
        return default


@dataclass(frozen=True)
class Settings:
    """Configuración inmutable de la aplicación.

    Los valores pueden ser sobrescritos mediante variables de entorno
    (prefijo SCANBRIDGE_).
    """

    raw_pdf_path: Path = Path(
        os.getenv("SCANBRIDGE_RAW_PDF_PATH", "/tmp/raw_scan.pdf")
    )
    processed_pdf_path: Path = Path(
        os.getenv("SCANBRIDGE_PROCESSED_PDF_PATH", "/tmp/oficialia_final_processed.pdf")
    )
    scanner_profile: str = os.getenv(
        "SCANBRIDGE_SCANNER_PROFILE", "Oficialia_Estandar"
    )
    default_resolution: int = _env_int("SCANBRIDGE_DEFAULT_RESOLUTION", 300)
    thumbnail_dpi: int = _env_int("SCANBRIDGE_THUMBNAIL_DPI", 72)
    host: str = os.getenv("SCANBRIDGE_HOST", "127.0.0.1")
    port: int = _env_int("SCANBRIDGE_PORT", 8000)
    scan_timeout: int = _env_int("SCANBRIDGE_SCAN_TIMEOUT", 300)