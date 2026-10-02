import { API_URL } from './config';

export class ErrorSesion extends Error {}

async function pedir(ruta, { token, body, method } = {}) {
  const r = await fetch(`${API_URL}/api${ruta}`, {
    method: method || (body ? 'POST' : 'GET'),
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body && JSON.stringify(body),
  });
  if (r.status === 401) throw new ErrorSesion((await r.json().catch(() => ({}))).error || 'Sesión inválida');
  if (!r.ok) throw new Error(`API ${ruta}: ${r.status}`);
  return r.json();
}

export const api = {
  publico: () => pedir('/publico'),
  login: (email, password) => pedir('/auth/login', { body: { email, password } }),
  renovar: (refreshToken) => pedir('/auth/refresh', { body: { refreshToken } }),
  leerEstado: (token) => pedir('/estado', { token }),
  guardarEstado: (token, state) => pedir('/estado', { token, body: state, method: 'PUT' }),
};
