"""Configuración centralizada de la aplicación, con soporte para variables de entorno."""

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Final


@dataclass(frozen=True)
class Settings:
    """Configuración inmutable de la aplicación.

    Los valores pueden ser sobrescritos mediante variables de entorno
    (prefijo SCANBRIDGE_). Esto facilita la configuración en contenedores
    sin modificar el código fuente.

    Environment variables:
        SCANBRIDGE_RAW_PDF_PATH
        SCANBRIDGE_PROCESSED_PDF_PATH
        SCANBRIDGE_SCANNER_PROFILE
        SCANBRIDGE_DEFAULT_RESOLUTION
        SCANBRIDGE_THUMBNAIL_DPI
        SCANBRIDGE_HOST
        SCANBRIDGE_PORT
        SCANBRIDGE_SCAN_TIMEOUT
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
    default_resolution: int = int(
        os.getenv("SCANBRIDGE_DEFAULT_RESOLUTION", "300")
    )
    thumbnail_dpi: int = int(
        os.getenv("SCANBRIDGE_THUMBNAIL_DPI", "72")
    )
    host: str = os.getenv("SCANBRIDGE_HOST", "127.0.0.1")
    port: int = int(os.getenv("SCANBRIDGE_PORT", "8000"))
    scan_timeout: int = int(
        os.getenv("SCANBRIDGE_SCAN_TIMEOUT", "300")
    )