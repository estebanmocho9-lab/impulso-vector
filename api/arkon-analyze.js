export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }

  const { materialId, tipoProducto } = req.body || {};
  if (!materialId || !tipoProducto) {
    return res.status(400).json({ success: false, mensaje: 'Faltan materialId y tipoProducto' });
  }

  try {
    const resp = await fetch('https://arkon-backend-2026.vercel.app/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialId, tipoProducto }),
    });
    const data = await resp.json();
    return res.status(resp.status).json(data);
  } catch (error) {
    return res.status(500).json({
      success: false,
      mensaje: 'No se pudo conectar con el motor ARKON',
      error: error.message,
    });
  }
}
