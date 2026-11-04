# Impulso Vector · ARKON

**English summary:** Impulso Vector is a web demo for exploring product/material properties using the data currently available to ARKON. ARKON produces operational indicators and candidate ideas; an optional Meta Llama model hosted by Cloudflare Workers AI explains ARKON's returned evidence. The model does not validate formulas or experimental results.

## Qué demuestra esta aplicación

Impulso Vector conecta un catálogo de productos con los materiales y propiedades que ARKON puede consultar. La cobertura varía según el material y las fuentes cargadas; la interfaz muestra propiedades disponibles, faltantes y la cobertura del análisis.

El flujo es:

1. El usuario selecciona un producto activo. La ruta `/api/analizar` lee su registro y su `material_id` desde Supabase.
2. La ruta de servidor de Next.js en Vercel envía el material al servicio ARKON. El motor consulta sus datos normalizados de Google Sheets (`NORMALIZACION`) y devuelve activaciones, indicadores, fórmulas, alertas, reglas y/o principios TRIZ disponibles.
3. Si está configurado Cloudflare Workers AI, la misma ruta envía a Meta Llama 3.2 un resumen de la respuesta de ARKON. La IA devuelve una explicación breve, separada de los cálculos. No consulta por sí sola Turso, libros, manuales ni fuentes web, y no valida experimentalmente los resultados.
4. La interfaz muestra el estado de esa solicitud. Llama solo se considera conectada cuando aparece **“Conectada · respuesta recibida”** y se presenta una respuesta con proveedor y modelo.

Si el servicio integral de ARKON no responde, existe un respaldo al motor de activación neuronal. Ese respaldo entrega solo las activaciones y propiedades disponibles; no genera fórmulas de mezcla ni soluciones nuevas.

## Interpretación responsable

Las puntuaciones, la confianza media del motor y los umbrales de alerta son indicadores operativos de la implementación y de los datos cargados. No equivalen por sí mismos a límites normativos, fallas confirmadas ni ensayos de laboratorio.

Las propuestas de mejora, mezclas y principios TRIZ deben tratarse como **hipótesis para investigar y validar**, no como recetas de fabricación. Antes de probarlas, hay que verificar composición y porcentajes, unidades, fuentes bibliográficas, compatibilidad de materiales, seguridad y resultados experimentales. Si faltan fracciones verificadas de la composición, la aplicación no calcula un promedio de mezcla.

La conexión de Llama es una capa explicativa opcional; no participa en las fórmulas deterministas de ARKON y una respuesta generativa puede equivocarse. El estado real de la llamada se muestra en pantalla. No se debe interpretar la presencia del código de integración como prueba de una invocación exitosa.

## Integración del modelo

La llamada está implementada del lado servidor en [`app/api/analizar/route.ts`](app/api/analizar/route.ts). Usa el endpoint REST de Cloudflare Workers AI y el modelo `@cf/meta/llama-3.2-3b-instruct`. La clave no se incluye en el navegador ni en GitHub: se configura como variable secreta en Vercel. La ruta devuelve un estado seguro si falta configuración, Cloudflare rechaza la solicitud o se agota el tiempo de espera; el análisis de ARKON se conserva.

Variables usadas por la aplicación (configurar en Vercel o en un `.env.local` local; **no subir valores secretos**):

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública/anon de Supabase con las políticas apropiadas. |
| `CLOUDFLARE_ACCOUNT_ID` | Identifica la cuenta de Workers AI. |
| `CLOUDFLARE_API_TOKEN` | Token secreto con permiso de Workers AI. |
| `ARKON_BRIDGE_URL` | URL base del servicio ARKON; si se omite, la ruta usa la URL de Render definida como valor por defecto en el código. |
| `ARKON_BRIDGE_TOKEN` | Token opcional para autenticar la llamada al puente ARKON. |

El código también reconoce `SUPABASE_URL` y `SUPABASE_KEY` como alternativas del lado servidor. No publiques tokens, credenciales de Supabase ni archivos `.env`.

## Alcance de este repositorio público

Este repositorio contiene la aplicación web, las rutas API que conectan Supabase y Cloudflare Workers AI, y la interfaz que muestra las respuestas. El motor ARKON completo y el extractor documental se mantienen en repositorios separados y no están incluidos aquí; por lo tanto, este repo por sí solo no permite auditar todo el razonamiento interno del backend. La aplicación actualmente no integra Turso en este flujo.

## Desarrollo local

Requisitos: Node.js y npm.

```bash
npm ci
# Configurar las variables necesarias en .env.local (no versionar ese archivo)
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`. Para comprobar cambios antes de publicarlos:

```bash
npx tsc --noEmit
npm run build
```

## Demo

Aplicación: [impulso-vector.vercel.app](https://impulso-vector.vercel.app/)
