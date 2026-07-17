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


# Tipo unión de todos los comandos reconocidos
Command = Annotated[
    StartScanCommand | ApplyEditsCommand | LoadLocalPdfCommand,
    Field(discriminator="command"),
]

# ════════════════════════════════════════════════════════════════
# ADAPTADOR DE UNIÓN: Resuelve el tipado estricto en Python 3.14
# ════════════════════════════════════════════════════════════════
CommandAdapter: TypeAdapter[Command] = TypeAdapter(Command)