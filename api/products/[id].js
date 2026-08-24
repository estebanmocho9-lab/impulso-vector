// api/products/[id].js
// Endpoint: GET /api/products/:id
// Devuelve el detalle de un producto puntual (usado por loadProductDetail en el front).
// NOTA: datos de ejemplo (mock), a reemplazar por la conexión real al motor ARKON.

const PRODUCTS_DETAIL = {
  'MA.001': {
    id: 'MA.001',
    nombre: 'Placa Antihumedad de Yeso Cerámico',
    categoria: 'Construcción / Interiores',
    estado: 'Disponible',
    alternativas: [
      { opcion: 'Material Silíceo Liviano', costo: '-12%', absorcion: '-18%', resistencia: '+8%', impactoAmbiental: '-15%' }
    ]
  },
  'MA.002': {
    id: 'MA.002',
    nombre: 'Mortero Autonivelante de Alta Resistencia',
    categoria: 'Pisos / Estructural',
    estado: 'Disponible',
    alternativas: []
  },
  'MA.003': {
    id: 'MA.003',
    nombre: 'Ladrillo Térmico Celular Alveolar',
    categoria: 'Mampostería / Térmico',
    estado: 'Disponible',
    alternativas: []
  }
};

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }

  const { id } = req.query;
  const product = PRODUCTS_DETAIL[id];

  if (!product) {
    return res.status(404).json({ success: false, mensaje: 'Producto no encontrado' });
  }

  return res.status(200).json({ success: true, product });
}
