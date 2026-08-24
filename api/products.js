// api/products.js
// Endpoint: GET /api/products
// Devuelve el catálogo de productos usado por el dashboard ARKON.
// NOTA: estos son datos de ejemplo (mock). Cuando conectemos el sistema
// madre ARKON, esta función va a leer de la base real (Supabase/Turso)
// en lugar de este array fijo.

const PRODUCTS = [
  {
    id: 'MA.001',
    nombre: 'Placa Antihumedad de Yeso Cerámico',
    categoria: 'Construcción / Interiores',
    estado: 'Disponible',
    ultimoAnalisis: '23/05/2026',
    alternativas: [
      { opcion: 'Material Silíceo Liviano', costo: '-12%', absorcion: '-18%', resistencia: '+8%', impactoAmbiental: '-15%' }
    ]
  },
  {
    id: 'MA.002',
    nombre: 'Mortero Autonivelante de Alta Resistencia',
    categoria: 'Pisos / Estructural',
    estado: 'Disponible',
    ultimoAnalisis: '14/04/2026',
    alternativas: []
  },
  {
    id: 'MA.003',
    nombre: 'Ladrillo Térmico Celular Alveolar',
    categoria: 'Mampostería / Térmico',
    estado: 'Disponible',
    ultimoAnalisis: '02/03/2026',
    alternativas: []
  }
];

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }
  return res.status(200).json(PRODUCTS);
}
