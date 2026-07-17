// src/scripts/archivo-data.js

/**
 * Datos mock del Archivo Documental.
 * En producción, esto sería fetch() a tu API/BigQuery.
 */

export const ARCHIVO_MOCK = [
  {
    folio: 'OD-2023-001',
    fecha: '2023-10-24 09:15',
    remitente: 'Secretaría de Finanzas',
    asunto: 'Solicitud de ampliación presupuestal Q4',
    estatus: 'procesado',
    pdfUrl: '/docs/OD-2023-001.pdf',
    metadatos: {
      remitente: 'Secretaría de Finanzas',
      fechaRecepcion: '2023-10-24T09:15:00Z',
      asunto: 'Solicitud de ampliación presupuestal Q4',
      tipo: 'Oficio',
      anexos: 2
    },
    aiDiff: {
      original: { remitente: 'Secretaría de Finaanzas' },
      corregido: { remitente: 'Secretaría de Finanzas' },
      confidence: 0.87
    }
  },
  {
    folio: 'OD-2023-002',
    fecha: '2023-10-24 10:30',
    remitente: 'Dirección Jurídica',
    asunto: 'Amparo indirecto 145/2023 notificaciones',
    estatus: 'revision',
    pdfUrl: '/docs/OD-2023-002.pdf',
    metadatos: {
      remitente: 'Dirección Jurídica',
      fechaRecepcion: '2023-10-24T10:30:00Z',
      asunto: 'Amparo indirecto 145/2023 notificaciones',
      tipo: 'Amparo',
      anexos: 5
    },
    aiDiff: null
  },
  {
    folio: 'OD-2023-003',
    fecha: '2023-10-24 11:45',
    remitente: 'Oficina del C. Gobernador',
    asunto: 'Acuerdo delegatorio de facultades',
    estatus: 'pendiente',
    pdfUrl: '/docs/OD-2023-003.pdf',
    metadatos: {
      remitente: 'Oficina del C. Gobernador',
      fechaRecepcion: '2023-10-24T11:45:00Z',
      asunto: 'Acuerdo delegatorio de facultades',
      tipo: 'Acuerdo',
      anexos: 1
    },
    aiDiff: {
      original: { remitente: 'Oficina dle C. Gobernador' },
      corregido: { remitente: 'Oficina del C. Gobernador' },
      confidence: 0.92
    }
  },
  {
    folio: 'OD-2023-004',
    fecha: '2023-10-25 08:20',
    remitente: 'Secretaría de Educación',
    asunto: 'Informe de actividades octubre 2023',
    estatus: 'procesado',
    pdfUrl: '/docs/OD-2023-004.pdf',
    metadatos: {
      remitente: 'Secretaría de Educación',
      fechaRecepcion: '2023-10-25T08:20:00Z',
      asunto: 'Informe de actividades octubre 2023',
      tipo: 'Informe',
      anexos: 3
    },
    aiDiff: null
  },
  {
    folio: 'OD-2023-005',
    fecha: '2023-10-25 14:00',
    remitente: 'Coordinación de Comunicación Social',
    asunto: 'Boletín de prensa 245/2023',
    estatus: 'revision',
    pdfUrl: '/docs/OD-2023-005.pdf',
    metadatos: {
      remitente: 'Coordinación de Comunicación Social',
      fechaRecepcion: '2023-10-25T14:00:00Z',
      asunto: 'Boletín de prensa 245/2023',
      tipo: 'Boletín',
      anexos: 0
    },
    aiDiff: {
      original: { asunto: 'Boletín de prenssa 245/2023' },
      corregido: { asunto: 'Boletín de prensa 245/2023' },
      confidence: 0.95
    }
  },
  {
    folio: 'OD-2023-006',
    fecha: '2023-10-26 09:45',
    remitente: 'Secretaría de Salud',
    asunto: 'Solicitud de insumos médicos hospitalarios',
    estatus: 'pendiente',
    pdfUrl: '/docs/OD-2023-006.pdf',
    metadatos: {
      remitente: 'Secretaría de Salud',
      fechaRecepcion: '2023-10-26T09:45:00Z',
      asunto: 'Solicitud de insumos médicos hospitalarios',
      tipo: 'Oficio',
      anexos: 4
    },
    aiDiff: null
  },
  {
    folio: 'OD-2023-007',
    fecha: '2023-10-26 16:30',
    remitente: 'Unidad de Transparencia',
    asunto: 'Respuesta solicitud de información 00123/2023',
    estatus: 'procesado',
    pdfUrl: '/docs/OD-2023-007.pdf',
    metadatos: {
      remitente: 'Unidad de Transparencia',
      fechaRecepcion: '2023-10-26T16:30:00Z',
      asunto: 'Respuesta solicitud de información 00123/2023',
      tipo: 'Oficio',
      anexos: 1
    },
    aiDiff: {
      original: { folio: 'OD-2023-0O7' },
      corregido: { folio: 'OD-2023-007' },
      confidence: 0.89
    }
  },
  {
    folio: 'OD-2023-008',
    fecha: '2023-10-27 10:15',
    remitente: 'Dirección de Recursos Humanos',
    asunto: 'Convocatoria concurso de plazas 2024',
    estatus: 'revision',
    pdfUrl: '/docs/OD-2023-008.pdf',
    metadatos: {
      remitente: 'Dirección de Recursos Humanos',
      fechaRecepcion: '2023-10-27T10:15:00Z',
      asunto: 'Convocatoria concurso de plazas 2024',
      tipo: 'Convocatoria',
      anexos: 2
    },
    aiDiff: null
  },
  {
    folio: 'OD-2023-009',
    fecha: '2023-10-27 13:00',
    remitente: 'Secretaría Técnica del Consejo Estatal',
    asunto: 'Acta de sesión ordinaria 45/2023',
    estatus: 'pendiente',
    pdfUrl: '/docs/OD-2023-009.pdf',
    metadatos: {
      remitente: 'Secretaría Técnica del Consejo Estatal',
      fechaRecepcion: '2023-10-27T13:00:00Z',
      asunto: 'Acta de sesión ordinaria 45/2023',
      tipo: 'Acta',
      anexos: 0
    },
    aiDiff: {
      original: { asunto: 'Acta de sessión ordinaria 45/2023' },
      corregido: { asunto: 'Acta de sesión ordinaria 45/2023' },
      confidence: 0.91
    }
  },
  {
    folio: 'OD-2023-010',
    fecha: '2023-10-28 08:00',
    remitente: 'Coordinación General de Administración',
    asunto: 'Circular administrativa 12/2023',
    estatus: 'procesado',
    pdfUrl: '/docs/OD-2023-010.pdf',
    metadatos: {
      remitente: 'Coordinación General de Administración',
      fechaRecepcion: '2023-10-28T08:00:00Z',
      asunto: 'Circular administrativa 12/2023',
      tipo: 'Circular',
      anexos: 1
    },
    aiDiff: null
  }
];

/**
 * Servicio de datos — en producción reemplazar por llamadas API.
 */
export const ArchivoService = {
  _data: [...ARCHIVO_MOCK],

  getAll() {
    return this._data;
  },

  getByFolio(folio) {
    return this._data.find(d => d.folio === folio) || null;
  },

  filter({ search = '', fechaDesde = '', fechaHasta = '', estatus = '' }) {
    return this._data.filter(item => {
      // Búsqueda global (texto, remitente, metadata)
      if (search) {
        const q = search.toLowerCase();
        const match = item.folio.toLowerCase().includes(q) ||
          item.remitente.toLowerCase().includes(q) ||
          item.asunto.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Filtro de fecha
      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        const itemDate = new Date(item.fecha);
        if (itemDate < desde) return false;
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        const itemDate = new Date(item.fecha);
        if (itemDate > hasta) return false;
      }
      // Filtro de estatus
      if (estatus && item.estatus !== estatus) return false;
      return true;
    });
  },

  paginate(data, page, perPage) {
    const start = (page - 1) * perPage;
    return {
      rows: data.slice(start, start + perPage),
      total: data.length,
      page,
      perPage,
      totalPages: Math.ceil(data.length / perPage)
    };
  }
};
