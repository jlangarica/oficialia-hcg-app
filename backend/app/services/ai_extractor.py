"""Servicio de extracción inteligente de metadatos usando Gemini API."""

import os
import asyncio
import logging
from pathlib import Path

import google.generativeai as genai
from pydantic import BaseModel, Field

from app.exceptions import ValidationError

logger = logging.getLogger(__name__)


class FieldExtraction(BaseModel):
    """Representa un campo extraído con su valor y confianza."""
    value: str = Field(
        description="El valor textual extraído o inferido del campo."
    )
    confidence: float = Field(
        description="Puntuación de confianza del campo entre 0.0 y 1.0 basada en la claridad del dato en el documento."
    )


class ExtractedDocumentMetadata(BaseModel):
    """Esquema estructurado para los metadatos extraídos del documento."""
    classification: FieldExtraction = Field(
        description="Clasificación del documento. Opciones: 'Oficio Externo', 'Circular Interna', 'Factura'."
    )
    folio: FieldExtraction = Field(
        description="Número de folio oficial visible. Si no existe, genera uno siguiendo el patrón detectado."
    )
    sender: FieldExtraction = Field(
        description="Nombre completo o cargo del remitente institucional."
    )
    date: FieldExtraction = Field(
        description="Fecha del documento en formato YYYY-MM-DD."
    )
    subject: FieldExtraction = Field(
        description="Resumen ejecutivo del asunto (máximo 2 párrafos)."
    )


class AIExtractorService:
    """Servicio que utiliza Gemini para extraer metadatos estructurados de PDFs."""

    def __init__(self) -> None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY no configurada en el entorno actual.")
        genai.configure(api_key=api_key)
        self.model_name = "gemini-2.0-flash-exp"

    async def extract_metadata(self, pdf_path: Path) -> ExtractedDocumentMetadata:
        """Sube el PDF consolidado a la API de Gemini y fuerza una respuesta estructurada."""
        if not pdf_path.exists():
            raise ValidationError(
                f"El archivo PDF a procesar no existe en la ruta: {pdf_path}"
            )

        def read_file_bytes() -> bytes:
            return pdf_path.read_bytes()

        pdf_bytes = await asyncio.to_thread(read_file_bytes)

        prompt = (
            "Analiza detalladamente este documento oficial de la Oficialía Digital. "
            "Realiza el OCR, identifica los actores y extrae los campos solicitados con sus respectivos "
            "niveles de confianza basados en la legibilidad y certidumbre del dato físico."
        )

        model = genai.GenerativeModel(self.model_name)

        response = await model.generate_content_async(
            contents=[
                {"mime_type": "application/pdf", "data": pdf_bytes},
                prompt,
            ],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ExtractedDocumentMetadata,
                temperature=0.1,
            ),
        )

        return ExtractedDocumentMetadata.model_validate_json(response.text)
