# Conectar el panel a Supabase

Supabase (gratis) es la base de datos que usa la API de `server`. Ahí quedan los pedidos, clientes, pagos, gastos y precios, y lo que muestra el cotizador de la página.

1. Crear una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (región São Paulo, plan Free). Guardar la contraseña de la base en algún lado.
2. **SQL Editor → New query**: pegar todo `supabase.sql`, cambiar `EMAIL_DE_TU_PAPA@gmail.com` por el email real y tocar **Run**.
3. **Authentication → Users → Add user → Create new user**: ese mismo email y una contraseña. Marcar "Auto Confirm User".
4. **Authentication → Sign In / Providers**: desactivar **Allow new users to sign up**, así nadie más puede crearse una cuenta.
5. Copiar la **Project URL** (en **Project Settings → Data API**) y la clave pública (en **Project Settings → API Keys**: la **anon public** de "Legacy API Keys", que empieza con `eyJ`, o la **Publishable key**) en `server/.env` y en las variables de entorno del proyecto de la API en Vercel (`SUPABASE_URL` y `SUPABASE_ANON_KEY`).

   La clave pública no es secreta: lo que protege los datos son las reglas de `supabase.sql` (solo el email de `admins` puede leer o cambiar el panel, y el público solo puede leer precios).
