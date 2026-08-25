import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }

  const { productId, propuesta } = req.body || {};

  if (!productId || !propuesta) {
    return res.status(400).json({ success: false, mensaje: 'Faltan datos de la propuesta (productId, propuesta)' });
  }

  const { data, error } = await supabase
    .from('trabajos')
    .insert({
      producto: productId,
      material_id: productId,
      contexto: propuesta,
      estado: 'pendiente',
    })
    .select('id, estado, creado_en')
    .single();

  if (error) {
    console.error('Error registrando trabajo en Supabase:', error.message);
    return res.status(500).json({ success: false, mensaje: 'No se pudo registrar la propuesta' });
  }

  return res.status(200).json({
    success: true,
    mensaje: 'Propuesta registrada como trabajo pendiente en ARKON.',
    propuesta: {
      idPropuesta: data.id,
      productId,
      estado: data.estado,
      fecha: data.creado_en,
    },
  });
}
