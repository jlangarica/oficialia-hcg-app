# backend/app/services/ai_extractor.py
import os
import asyncio
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from google import genai  # ◄ NUEVO SDK
from google.genai import types  # ◄ NUEVOS TIPOS
from app.exceptions import ValidationError

logger = logging.getLogger(__name__)

class FieldExtraction(BaseModel):
    value: str = Field(description="El valor textual extraído o inferido del campo.")
    confidence: float = Field(description="Puntuación de confianza del campo entre 0.0 y 1.0.")

class ExtractedDocumentMetadata(BaseModel):
    classification: FieldExtraction = Field(description="Clasificación del documento. Opciones: 'Oficio Externo', 'Circular Interna', 'Factura'.")
    folio: FieldExtraction = Field(description="Número de folio oficial visible.")
    sender: FieldExtraction = Field(description="Nombre completo o cargo del remitente institucional.")
    date: FieldExtraction = Field(description="Fecha del documento en formato YYYY-MM-DD.")
    subject: FieldExtraction = Field(description="Resumen ejecutivo del asunto.")

class AIExtractorService:
    def __init__(self):
        # El nuevo cliente inicializa automáticamente usando la variable GEMINI_API_KEY del entorno
        self.client = genai.Client()
        self.model_name = "gemini-2.5-flash"

    async def extract_metadata(self, pdf_path: Path) -> ExtractedDocumentMetadata:
        """Sube el PDF consolidado a la API de Gemini usando el nuevo SDK y retorna datos estructurados."""
        if not pdf_path.exists():
            raise ValidationError(f"El archivo PDF a procesar no existe en la ruta: {pdf_path}")

        # Lectura de disco en un hilo secundario para no bloquear el loop de asyncio
        def read_file_bytes():
            return pdf_path.read_bytes()

        pdf_bytes = await asyncio.to_thread(read_file_bytes)

        prompt = (
            "Analiza detalladamente este documento oficial de la Oficialía Digital. "
            "Realiza el OCR, identifica los actores y extrae los campos solicitados con sus respectivos "
            "niveles de confianza basados en la legibilidad y certidumbre del dato físico."
        )

        # Invocación asíncrona usando la interfaz .aio del nuevo SDK
        response = await self.client.aio.models.generate_content(
            model=self.model_name,
            contents=[
                types.Part.from_bytes(
                    data=pdf_bytes,
                    mime_type="application/pdf"
                ),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ExtractedDocumentMetadata,
                temperature=0.1,
            ),
        )

        # Retornamos el modelo de Pydantic validado con la respuesta de Gemini
        return ExtractedDocumentMetadata.model_validate_json(response.text)
