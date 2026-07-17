"""Esquemas de validación de datos usando Pydantic."""

from typing import Annotated, Literal

from pydantic import BaseModel, Field


class StartScanCommand(BaseModel):
    """Comando para iniciar el escaneo de documentos."""

    command: Literal["START_SCAN"]
    dpi: int = Field(ge=72, le=600, default=300)
    color_mode: Literal["Color", "Grayscale", "BlackWhite"] = "Color"
    duplex: bool = False


class ApplyEditsCommand(BaseModel):
    """Comando para aplicar ediciones de metadatos al PDF."""

    command: Literal["APPLY_EDITS"]
    metadata: dict[str, str]
    # Se pueden agregar campos específicos si se requiere validación estricta


class LoadLocalPdfCommand(BaseModel):
    """Comando para cargar un PDF local existente."""

    command: Literal["LOAD_LOCAL_PDF"]
    file_path: str


class SaveDocumentCommand(BaseModel):
    """Comando para guardar un documento con sus metadatos validados."""

    command: Literal["SAVE_DOCUMENT"]
    clasificacion: str = Field(min_length=1, max_length=200)
    remitente: str = Field(min_length=1, max_length=500)
    fecha_doc: str = Field(  # ISO date: "2026-10-15"
        min_length=10, max_length=10, pattern=r"^\d{4}-\d{2}-\d{2}$"
    )
    asunto: str = Field(min_length=1, max_length=2000)
    total_paginas: int = Field(ge=0, default=0)
    ai_metadata: dict | None = None
    ai_diff: dict | None = None


# Tipo unión ACTUALIZADO — agregar SaveDocumentCommand
Command = Annotated[
    StartScanCommand
    | ApplyEditsCommand
    | LoadLocalPdfCommand
    | SaveDocumentCommand,
    Field(discriminator="command"),
]