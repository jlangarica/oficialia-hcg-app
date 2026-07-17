"""Modelos de datos inmutables del dominio."""

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True, slots=True)
class ScanResult:
    """Resultado de una operación de escaneo mediante NAPS2.

    Attributes:
        returncode: Código de salida del proceso naps2.console.
        stderr: Mensaje de error estándar del proceso, si existe.
    """

    returncode: int
    stderr: str

    @property
    def success(self) -> bool:
        """Indica si el escaneo finalizó sin errores del proceso."""
        return self.returncode == 0


@dataclass(frozen=True, slots=True)
class PageThumbnail:
    """Representación en miniatura de una página PDF codificada en base64.

    Attributes:
        page_index: Índice de la página dentro del documento (0-based).
        mime: Tipo MIME de la imagen generada.
        base64: Contenido de la imagen codificado en base64.
    """

    page_index: int
    mime: Literal["image/png"]
    base64: str


@dataclass(frozen=True, slots=True)
class EditOperation:
    """Operación de reordenamiento y rotación para una página específica.

    Attributes:
        source_index: Índice de la página fuente en el PDF original.
        rotation: Grados a rotar (se normaliza módulo 360 en el procesador).
    """

    source_index: int
    rotation: int
