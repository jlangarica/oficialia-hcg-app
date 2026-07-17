"""Modelos Pydantic para validación de mensajes del WebSocket."""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field, model_validator, TypeAdapter


class StartScanCommand(BaseModel):
    """Comando para iniciar un escaneo."""

    command: Literal["START_SCAN"]
    duplex: bool = False
    resolution: int | None = Field(
        default=None, ge=50, le=1200, description="DPI entre 50 y 1200"
    )


class EditOperationSchema(BaseModel):
    """Operación individual de edición."""

    source_index: int = Field(ge=0)
    rotation: int


class ApplyEditsCommand(BaseModel):
    """Comando para aplicar ediciones a un PDF escaneado."""

    command: Literal["APPLY_EDITS"]
    operations: list[EditOperationSchema] = Field(min_length=1)


class LoadLocalPdfCommand(BaseModel):
    """◄ NUEVO: Validador estructural para carga de archivos locales"""
    command: Literal["LOAD_LOCAL_PDF"]
    base64_data: str


class ExtractMetadataCommand(BaseModel):
    """Comando para iniciar la extracción inteligente de metadatos vía Gemini."""
    command: Literal["EXTRACT_METADATA"]


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


# Tipo unión de todos los comandos reconocidos
Command = Annotated[
    StartScanCommand
    | ApplyEditsCommand
    | LoadLocalPdfCommand
    | ExtractMetadataCommand
    | SaveDocumentCommand,
    Field(discriminator="command"),
]

# ════════════════════════════════════════════════════════════════
# ADAPTADOR DE UNIÓN: Resuelve el tipado estricto en Python 3.14
# ════════════════════════════════════════════════════════════════
CommandAdapter: TypeAdapter[Command] = TypeAdapter(Command)