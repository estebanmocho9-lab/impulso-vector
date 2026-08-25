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

  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, contexto, material_id, activo, created_at')
    .eq('activo', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error consultando productos en Supabase:', error.message);
    return res.status(500).json({ success: false, mensaje: 'Error al consultar el catálogo' });
  }

  const catalogo = (data || []).map((p) => ({
    id: p.material_id || String(p.id),
    nombre: p.nombre,
    categoria: p.contexto || 'Sin categoría asignada',
    estado: 'Disponible',
    ultimoAnalisis: new Date(p.created_at).toLocaleDateString('es-AR'),
  }));

  return res.status(200).json(catalogo);
}
