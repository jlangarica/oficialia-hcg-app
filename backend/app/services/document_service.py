"""Servicio de persistencia de documentos oficiales.

Genera folios secuenciales y guarda registros en SQLite.
En producción puede migrarse a PostgreSQL/BigQuery.
"""

import json
import logging
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from sqlite3 import Connection, connect as sqlite_connect

from app.config import Settings
from app.exceptions import PDFProcessingError

logger = logging.getLogger(__name__)


class DocumentService:
    """Gestiona el almacenamiento y foliado de documentos procesados."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._db_path: Path = settings.raw_pdf_path.parent / "oficialia.db"
        self._storage_dir: Path = settings.raw_pdf_path.parent / "documentos"
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_conn(self) -> Connection:
        """Devuelve una conexión SQLite con row_factory."""
        conn = sqlite_connect(str(self._db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _init_db(self) -> None:
        """Crea la tabla de documentos si no existe."""
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS documentos (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    folio         TEXT    NOT NULL UNIQUE,
                    clasificacion TEXT    NOT NULL,
                    remitente     TEXT    NOT NULL,
                    fecha_doc     TEXT    NOT NULL,
                    asunto        TEXT    NOT NULL,
                    pdf_ruta      TEXT    NOT NULL,
                    estatus       TEXT    NOT NULL DEFAULT 'procesado',
                    ai_metadata   TEXT,                          -- JSON original de la IA
                    ai_diff       TEXT,                          -- JSON correcciones de la IA
                    total_paginas INTEGER NOT NULL DEFAULT 0,
                    creado_en     TEXT    NOT NULL,
                    modificado_en TEXT    NOT NULL
                )
            """)
            conn.commit()
        logger.info("Base de datos verificada: %s", self._db_path)

    def generate_folio(self, year: int | None = None) -> str:
        """Genera el siguiente folio secuencial: OF-{YYYY}-{NNNNN}.

        El consecutivo es por año. Si no hay registros para ese año,
        empieza en 00001.
        """
        if year is None:
            year = datetime.now(timezone.utc).year

        with self._get_conn() as conn:
            row = conn.execute(
                """
                SELECT MAX(CAST(SUBSTR(folio, -5) AS INTEGER)) AS ultimo
                FROM documentos
                WHERE folio LIKE ?
                """,
                (f"OF-{year}-%",),
            ).fetchone()

            siguiente = (row["ultimo"] or 0) + 1

        return f"OF-{year}-{siguiente:05d}"

    def save_document(
        self,
        clasificacion: str,
        remitente: str,
        fecha_doc: str,
        asunto: str,
        source_pdf_path: str,
        total_paginas: int = 0,
        ai_metadata: dict | None = None,
        ai_diff: dict | None = None,
    ) -> dict:
        """Guarda un documento procesado en la DB y copia el PDF al storage.

        Returns:
            Diccionario con el folio asignado y la ruta final del PDF.
        """
        now = datetime.now(timezone.utc)
        folio = self.generate_folio(now.year)

        # Copiar PDF al almacenamiento organizado
        source = Path(source_pdf_path)
        if not source.exists():
            raise PDFProcessingError(
                f"El PDF procesado no existe: {source_pdf_path}"
            )

        dest_dir = self._storage_dir / str(now.year)
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_pdf = dest_dir / f"{folio}.pdf"

        shutil.copy2(str(source), str(dest_pdf))
        logger.info("PDF copiado: %s → %s", source, dest_pdf)

        # Guardar registro en SQLite
        with self._get_conn() as conn:
            conn.execute(
                """
                INSERT INTO documentos
                    (folio, clasificacion, remitente, fecha_doc, asunto,
                     pdf_ruta, ai_metadata, ai_diff, total_paginas,
                     creado_en, modificado_en)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    folio,
                    clasificacion,
                    remitente,
                    fecha_doc,
                    asunto,
                    str(dest_pdf),
                    json.dumps(ai_metadata, ensure_ascii=False) if ai_metadata else None,
                    json.dumps(ai_diff, ensure_ascii=False) if ai_diff else None,
                    total_paginas,
                    now.isoformat(),
                    now.isoformat(),
                ),
            )
            conn.commit()

        logger.info("Documento registrado: %s", folio)

        return {
            "folio": folio,
            "pdf_path": str(dest_pdf),
            "estatus": "procesado",
            "creado_en": now.isoformat(),
            "total_paginas": total_paginas,
        }
