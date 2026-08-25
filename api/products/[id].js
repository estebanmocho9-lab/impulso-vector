import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }

  const { id } = req.query;

  let { data: producto, error } = await supabase
    .from('productos')
    .select('id, nombre, contexto, composicion, material_id, activo, created_at')
    .eq('material_id', id)
    .eq('activo', true)
    .limit(1)
    .maybeSingle();

  if (!producto && !error) {
    const numericId = Number(id);
    if (!Number.isNaN(numericId)) {
      const resp = await supabase
        .from('productos')
        .select('id, nombre, contexto, composicion, material_id, activo, created_at')
        .eq('id', numericId)
        .maybeSingle();
      producto = resp.data;
      error = resp.error;
    }
  }

  if (error) {
    console.error('Error consultando producto en Supabase:', error.message);
    return res.status(500).json({ success: false, mensaje: 'Error al consultar el producto' });
  }

  if (!producto) {
    return res.status(404).json({ success: false, mensaje: 'Producto no encontrado en el catálogo de ARKON' });
  }

  let componentesReales = [];
  if (producto.material_id) {
    const { data: comps } = await supabase
      .from('componentes_materiales')
      .select('nombre_componente, porcentaje_texto, porcentaje_min, porcentaje_max')
      .eq('id_material', producto.material_id);
    componentesReales = comps || [];
  }

  return res.status(200).json({
    success: true,
    product: {
      id: producto.material_id || String(producto.id),
      nombre: producto.nombre,
      categoria: producto.contexto || 'Sin categoría asignada',
      estado: 'Disponible',
      composicion: producto.composicion || null,
      componentes: componentesReales,
      alternativas: [],
    },
  });
}
