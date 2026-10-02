# JFA Bolsas

Página de bolsas de lienzo con cotizador y panel de administración (pedidos, pagos, precios y caja).

```
client/   Frontend en Next.js: la página pública (/) y el panel (/admin)
server/   Backend en Express: API que guarda y lee los datos en Supabase
```

## Cómo funciona

- El **panel** (`/admin`) inicia sesión contra la API, y la API contra Supabase. Cada cambio se guarda con `PUT /api/estado`.
- Al guardar, la API también publica una versión sin datos de clientes (precios y bolsas pendientes). Eso es lo que lee el **cotizador** de la página con `GET /api/publico`.
- La base y sus reglas de seguridad están en `server/supabase/` (ver `SUPABASE.md`).

| Ruta de la API | Para qué |
| --- | --- |
| `POST /api/auth/login` | Entrar al panel (email y contraseña) |
| `POST /api/auth/refresh` | Renovar la sesión |
| `GET /api/estado` | Leer todo el panel (requiere sesión) |
| `PUT /api/estado` | Guardar el panel y actualizar lo público (requiere sesión) |
| `GET /api/publico` | Precios y demora para el cotizador |
| `GET /api/salud` | Ver que la API está andando |

## Correrlo en la compu

Hace falta Node 22 o más nuevo.

```bash
npm run install:todo
cp server/.env.example server/.env          # ya trae los datos de Supabase
cp client/.env.example client/.env.local
npm run dev:server    # API en http://localhost:4000
npm run dev:client    # página en http://localhost:3000 (en otra terminal)
```

`npm test` corre las pruebas de la API y `npm run lint` revisa el frontend.

## Publicarlo en Vercel

Son dos proyectos de Vercel conectados al mismo repositorio:

1. **API**: Add New → Project → este repo, con **Root Directory** = `server`. En Environment Variables cargar `SUPABASE_URL` y `SUPABASE_ANON_KEY` (los de `server/.env.example`) y `CLIENT_ORIGIN` con la dirección de la página (por ejemplo `https://jfabolsas.vercel.app`). Se pueden poner varias separadas por coma, y un `*` sirve para las vistas previas: `https://jfabolsas-*-jerearrietas-projects.vercel.app`. Anotar la dirección que le da Vercel a la API.
2. **Página**: en el proyecto que ya existe, Settings → Build and Deployment → **Root Directory** = `client`. En Environment Variables cargar `NEXT_PUBLIC_API_URL` con la dirección de la API del paso 1, y volver a publicar.
