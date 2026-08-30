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
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return res.status(400).json({
      success: false,
      mensaje: 'El endpoint de producto requiere el id numérico del registro en productos.',
    });
  }

  const { data: producto, error } = await supabase
    .from('productos')
    .select('id, nombre, contexto, composicion, material_id, activo, created_at')
    .eq('id', numericId)
    .eq('activo', true)
    .maybeSingle();

  if (error) {
    console.error('Error consultando producto en Supabase:', error.message);
    return res.status(500).json({ success: false, mensaje: 'Error al consultar el producto' });
  }

  if (!producto) {
    return res.status(404).json({ success: false, mensaje: 'Producto no encontrado en el catálogo de ARKON' });
  }

  const materialId = producto.material_id ? String(producto.material_id).trim() : '';

  return res.status(200).json({
    success: true,
    product: {
      id: String(producto.id),
      nombre: producto.nombre,
      categoria: producto.contexto || 'general',
      estado: materialId ? 'Disponible' : 'Sin material_id',
      materialId,
      composicion: producto.composicion || null,
    },
  });
}
