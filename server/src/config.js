export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  port: Number(process.env.PORT) || 4000,
};

if (!config.supabaseUrl || !config.supabaseAnonKey) {
  console.warn('Faltan SUPABASE_URL o SUPABASE_ANON_KEY: la API no va a poder leer ni guardar datos.');
}
