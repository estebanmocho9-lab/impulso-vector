import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error('Faltan variables de Supabase en Vercel.');
  return createClient(url, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const productId = Number(body.productId);
    const propuesta = body.propuesta;

    if (!Number.isInteger(productId) || productId <= 0 || propuesta === null || propuesta === undefined ||
        (typeof propuesta === 'string' && !propuesta.trim())) {
      return res.status(400).json({ success: false, mensaje: 'Se requiere un productId numérico y una propuesta no vacía.' });
    }

    const supabase = getSupabase();
    const { data: producto, error: productError } = await supabase
      .from('productos')
      .select('id, material_id, activo')
      .eq('id', productId)
      .eq('activo', true)
      .maybeSingle();

    if (productError) throw new Error(`Error consultando producto: ${productError.message}`);
    if (!producto) return res.status(404).json({ success: false, mensaje: 'El producto no existe o no está activo.' });
    if (!producto.material_id) return res.status(422).json({ success: false, mensaje: 'El producto no tiene material_id asociado.' });

    const { data, error } = await supabase
      .from('trabajos')
      .insert({
        producto: producto.id,
        material_id: producto.material_id,
        contexto: typeof propuesta === 'string' ? propuesta.trim().slice(0, 4000) : JSON.stringify(propuesta).slice(0, 4000),
        estado: 'pendiente',
      })
      .select('id, estado, creado_en')
      .single();

    if (error) throw new Error(`No se pudo registrar la propuesta: ${error.message}`);

    return res.status(200).json({
      success: true,
      mensaje: 'Propuesta registrada como trabajo pendiente. Este registro no equivale a una evaluación científica ni a una validación experimental.',
      propuesta: {
        idPropuesta: data.id,
        productId: producto.id,
        materialId: producto.material_id,
        estado: data.estado,
        fecha: data.creado_en,
      },
    });
  } catch (error) {
    console.error('Error registrando propuesta:', error);
    return res.status(500).json({ success: false, mensaje: error instanceof Error ? error.message : 'Error interno al registrar la propuesta.' });
  }
}
