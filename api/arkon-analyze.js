export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }

  const { materialId, tipoProducto, producto, contexto } = req.body || {};
  if (!materialId) {
    return res.status(400).json({ success: false, mensaje: 'Falta materialId' });
  }

  try {
    const resp = await fetch('https://arkon-backend-2026.vercel.app/api/analizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material_id: materialId,
        producto: producto || materialId,
        contexto: contexto || tipoProducto || 'general',
      }),
    });

    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); }
    catch { data = { error: text || 'Respuesta no JSON del motor ARKON' }; }

    return res.status(resp.status).json(data);
  } catch (error) {
    return res.status(502).json({
      success: false,
      mensaje: 'No se pudo conectar con el motor ARKON',
      error: error?.message || String(error),
    });
  }
}
