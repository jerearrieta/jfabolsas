// Acceso a Supabase por su API REST. Las consultas del panel usan el token del usuario,
// así las reglas de seguridad de la base (supabase.sql) siguen decidiendo quién ve qué.

import { config } from '../config.js';

export class ErrorSupabase extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

async function pedir(ruta, { token, ...opciones } = {}) {
  const r = await fetch(`${config.supabaseUrl}${ruta}`, {
    ...opciones,
    headers: {
      apikey: config.supabaseAnonKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });
  if (!r.ok) throw new ErrorSupabase(r.status, `Supabase ${ruta}: ${r.status}`);
  const texto = await r.text();
  return texto ? JSON.parse(texto) : null;
}

export async function iniciarSesion(email, password) {
  return pedir('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function renovarSesion(refreshToken) {
  return pedir('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function leerFila(tabla, token) {
  const filas = await pedir(`/rest/v1/${tabla}?id=eq.1&select=data`, { token });
  return filas?.[0]?.data ?? null;
}

export async function guardarFila(tabla, data, token) {
  await pedir(`/rest/v1/${tabla}`, {
    method: 'POST',
    token,
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }),
  });
}
