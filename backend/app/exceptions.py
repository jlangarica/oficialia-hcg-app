"""Excepciones de dominio para la aplicación de escaneo."""


class ScannerError(RuntimeError):
    """Error durante la ejecución del escaneo físico mediante NAPS2."""


class PDFProcessingError(RuntimeError):
    """Error durante la manipulación, generación o edición de PDFs."""


class ValidationError(ValueError):
    """Error de validación en mensajes de entrada o parámetros de operación."""