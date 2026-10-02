# Conectar el panel a Supabase

Sin esto el panel guarda los datos solo en el navegador donde se cargan. Con Supabase (gratis) los datos quedan en la nube: tu papá los ve iguales desde el celular y la compu, y el cotizador de la página muestra siempre los precios y la demora reales.

1. Crear una cuenta en [supabase.com](https://supabase.com) y un proyecto nuevo (región São Paulo, plan Free). Guardar la contraseña de la base en algún lado.
2. **SQL Editor → New query**: pegar todo `supabase.sql`, cambiar `EMAIL_DE_TU_PAPA@gmail.com` por el email real y tocar **Run**.
3. **Authentication → Users → Add user → Create new user**: ese mismo email y una contraseña. Marcar "Auto Confirm User".
4. **Authentication → Sign In / Providers**: desactivar **Allow new users to sign up**, así nadie más puede crearse una cuenta.
5. **Project Settings → API**: copiar la **Project URL** y la **anon public key** en `config.js`:

   ```js
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJ...';
   ```

   La anon key es pública por diseño; lo que protege los datos son las reglas de `supabase.sql` (solo el email de `admins` puede leer o cambiar el panel, y el público solo puede leer precios).

6. Subir el cambio. La primera vez que tu papá entre a `/admin` con su email y contraseña, lo que tenga cargado en ese navegador se sube solo a la nube.
