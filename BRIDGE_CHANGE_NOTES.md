# ARKON bridge change

This branch connects product analysis to the real ARKON neural-analysis response.

- Product materials come from `productos.material_ids` / `productos.material_id`.
- `materiales_vectores` is not used by the web analysis route.
- Each linked material is sent to ARKON `/api/neural-analysis`.
- The raw ARKON response is preserved for the UI when no index/cause/solution is returned.
- No demo values are generated.
