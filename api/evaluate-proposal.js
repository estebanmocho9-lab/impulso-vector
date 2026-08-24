// api/evaluate-proposal.js
// Endpoint: POST /api/evaluate-proposal
// Registra una propuesta de sustitución/optimización enviada desde el dashboard.
// NOTA: por ahora solo genera un ID y devuelve confirmación (mock).
// Cuando conectemos el motor madre ARKON, acá va la llamada real al motor de inferencia.

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, mensaje: 'Método no permitido' });
  }

  const { productId, propuesta } = req.body || {};

  if (!productId || !propuesta) {
    return res.status(400).json({ success: false, mensaje: 'Faltan datos de la propuesta (productId, propuesta)' });
  }

  const idPropuesta = 'PROP-' + Date.now().toString(36).toUpperCase();

  return res.status(200).json({
    success: true,
    mensaje: 'Propuesta registrada en el motor de inferencia de ARKON.',
    propuesta: {
      idPropuesta,
      productId,
      propuesta,
      fecha: new Date().toISOString()
    }
  });
}
