"""Procesador de PDFs con operaciones de miniatura y edición."""

import base64
import logging
from contextlib import contextmanager
from pathlib import Path
from typing import Iterable

import fitz

from app.config import Settings
from app.exceptions import PDFProcessingError
from app.models import EditOperation, PageThumbnail

logger = logging.getLogger(__name__)


@contextmanager
def _open_pdf_document(path: Path):
    """Context manager seguro para documentos PyMuPDF.

    Args:
        path: Ruta al archivo PDF.

    Yields:
        Instancia abierta de fitz.Document.

    Raises:
        FileNotFoundError: Si el archivo no existe en la ruta indicada.
    """
    if not path.exists():
        raise FileNotFoundError(f"No se encontró el archivo: {path}")
    doc = fitz.open(path)
    try:
        yield doc
    finally:
        doc.close()


class PDFProcessor:
    """Operaciones de lectura, generación de miniaturas y edición de PDFs."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def generate_thumbnails(self) -> list[PageThumbnail]:
        """Convierte cada página del PDF crudo a una imagen PNG en base64.

        Returns:
            Lista de PageThumbnail con page_index, mime y base64.

        Raises:
            FileNotFoundError: Si el PDF crudo no existe.
            PDFProcessingError: Si ocurre un error durante la renderización.
        """
        thumbnails: list[PageThumbnail] = []
        try:
            with _open_pdf_document(self._settings.raw_pdf_path) as doc:
                for page_num in range(len(doc)):
                    page = doc.load_page(page_num)
                    pix = page.get_pixmap(dpi=self._settings.thumbnail_dpi)
                    png_bytes = pix.tobytes("png")
                    b64_string = base64.b64encode(png_bytes).decode("utf-8")
                    thumbnails.append(
                        PageThumbnail(
                            page_index=page_num,
                            mime="image/png",
                            base64=b64_string,
                        )
                    )
        except FileNotFoundError:
            raise
        except Exception as exc:
            raise PDFProcessingError(
                f"Error generando miniaturas: {exc}"
            ) from exc
        return thumbnails

    def apply_edits(self, operations: Iterable[EditOperation]) -> Path:
        """Aplica reordenamiento y rotación según las operaciones dadas.

        Args:
            operations: Secuencia de EditOperation con source_index y rotation.

        Returns:
            Ruta del PDF procesado final.

        Raises:
            FileNotFoundError: Si el PDF fuente no existe.
            PDFProcessingError: Si los índices están fuera de rango o falla
                la manipulación del documento.
        """
        src_path = self._settings.raw_pdf_path
        if not src_path.exists():
            raise FileNotFoundError(
                f"No se encontró el archivo fuente: {src_path}"
            )

        with _open_pdf_document(src_path) as src_doc:
            out_doc = fitz.open()
            try:
                total_pages = len(src_doc)
                for op in operations:
                    if not (0 <= op.source_index < total_pages):
                        raise PDFProcessingError(
                            f"Índice de página fuera de rango: "
                            f"{op.source_index} "
                            f"(rango válido: 0-{total_pages - 1})"
                        )
                    out_doc.insert_pdf(
                        src_doc,
                        from_page=op.source_index,
                        to_page=op.source_index,
                    )
                    last_page = out_doc[-1]
                    new_rotation = (last_page.rotation + op.rotation) % 360
                    last_page.set_rotation(new_rotation)

                processed_path = self._settings.processed_pdf_path
                out_doc.save(str(processed_path))
            except PDFProcessingError:
                raise
            except Exception as exc:
                raise PDFProcessingError(
                    f"Error al manipular el PDF: {exc}"
                ) from exc
            finally:
                out_doc.close()

        return processed_path

    def save_pdf_from_base64(self, b64_data: str) -> None:
        """Decodifica un string base64, limpia metadatos de DataURL si existen
        y escribe el archivo PDF real en la ruta del repositorio temporal.
        """
        try:
            if "," in b64_data:
                # Separar el encabezado 'data:application/pdf;base64,' del flujo puro
                b64_data = b64_data.split(",", 1)[1]
            
            binary_pdf = base64.b64decode(b64_data)
            
            with open(self._settings.raw_pdf_path, "wb") as pdf_file:
                pdf_file.write(binary_pdf)
        except Exception as e:
            raise PDFProcessingError(f"Fallo de escritura en almacenamiento temporal: {e}")