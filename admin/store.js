// Guarda todos los datos del panel. Sin Supabase configurado viven en el navegador
// (localStorage); con Supabase se guardan en la nube y quedan en el navegador como copia.
// También publica una versión reducida (precios y carga de trabajo, sin clientes)
// que lee el cotizador de la página.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const KEY = 'jfa-admin-v1';
const KEY_PUBLICO = 'jfa-publico';
const KEY_SESION = 'jfa-sesion';

export const remoto = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const CATALOGO = [
  ['Bolsita tipo marinera', ['10×10', '10×15', '15×15', '15×20', '20×20', '20×25', '25×25', '25×30', '30×30', '40×40']],
  ['Mochila', ['20×30', '25×30', '30×40', '40×50']],
  ['Tote Bag', ['20×25', '25×30', '30×40', '40×40']],
  ['Funda para lentes', ['8×17', '10×20']],
  ['Funda para botellas', ['20×34']],
  ['Bolsita para regalo', ['10×15', '15×20']],
];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function estadoInicial() {
  return {
    version: 1,
    products: CATALOGO.map(([name, sizes]) => ({
      id: uid(),
      name,
      printExtra: 0,
      sizes: sizes.map((label) => ({ id: uid(), label: `${label} cm`, price: 0 })),
    })),
    clients: [],
    orders: [],
    expenses: [],
    incomes: [],
    priceHistory: [],
    settings: {},
  };
}

// Completa campos que no existían en versiones anteriores de los datos.
function normalizar(data) {
  const s = { ...estadoInicial(), ...data };
  s.settings = { baseDays: 3, unitsPerDay: 20, ...s.settings };
  s.products.forEach((p) => (p.printExtra ??= 0));
  return s;
}

// ---------- Supabase (API REST, sin librerías) ----------

let sesion = null;
try {
  sesion = JSON.parse(localStorage.getItem(KEY_SESION));
} catch {}

function guardarSesion(s) {
  sesion = s && { access: s.access_token, refresh: s.refresh_token, expira: Date.now() + (s.expires_in - 60) * 1000 };
  if (sesion) localStorage.setItem(KEY_SESION, JSON.stringify(sesion));
  else localStorage.removeItem(KEY_SESION);
}

async function auth(grant, body) {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('auth');
  guardarSesion(await r.json());
}

export function necesitaLogin() {
  return remoto && !sesion;
}

export async function login(email, password) {
  await auth('password', { email, password });
}

export function logout() {
  guardarSesion(null);
}

async function token() {
  if (sesion && Date.now() > sesion.expira) {
    try {
      await auth('refresh_token', { refresh_token: sesion.refresh });
    } catch {
      guardarSesion(null);
      throw new Error('sesion');
    }
  }
  return sesion?.access;
}

async function api(tabla, opciones = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}`, {
    ...opciones,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${await token()}`,
      'Content-Type': 'application/json',
      ...opciones.headers,
    },
  });
  if (r.status === 401) {
    guardarSesion(null);
    throw new Error('sesion');
  }
  if (!r.ok) throw new Error(`${tabla}: ${r.status}`);
  return r.status === 204 || r.status === 201 ? null : r.json();
}

function upsert(tabla, data) {
  return api(tabla, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }),
  });
}

// ---------- API del panel ----------

function leerLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('No se pudieron leer los datos guardados', e);
  }
  return null;
}

export async function load() {
  if (remoto) {
    const filas = await api('estado?id=eq.1&select=data');
    if (filas.length) return normalizar(filas[0].data);
    // Primera vez con Supabase: sube lo que hubiera en este navegador.
    const s = normalizar(leerLocal() || {});
    await save(s);
    return s;
  }
  return normalizar(leerLocal() || {});
}

let pendiente = null;
let enCurso = Promise.resolve();

// Guarda al instante en el navegador y, con Supabase, sube a la nube agrupando
// los cambios seguidos en un solo envío.
export function save(state, alError) {
  localStorage.setItem(KEY, JSON.stringify(state));
  localStorage.setItem(KEY_PUBLICO, JSON.stringify(datosPublicos(state)));
  if (!remoto) return Promise.resolve();
  clearTimeout(pendiente);
  return new Promise((resolve) => {
    pendiente = setTimeout(() => {
      enCurso = enCurso
        .then(() => Promise.all([upsert('estado', state), upsert('publico', datosPublicos(state))]))
        .catch((e) => alError?.(e))
        .then(resolve);
    }, 600);
  });
}

export function reset() {
  localStorage.removeItem(KEY);
  return normalizar({});
}

export function validar(data) {
  return data && Array.isArray(data.products) && Array.isArray(data.orders) && Array.isArray(data.clients);
}

// Unidades que faltan entregar: lo que define la demora.
export function unidadesPendientes(state) {
  return state.orders
    .filter((o) => o.status === 'pendiente' || o.status === 'produccion')
    .reduce((s, o) => s + o.items.reduce((t, i) => t + i.qty, 0), 0);
}

// Días hasta poder entregar un pedido nuevo de `nuevas` unidades.
export function demoraDias(settings, pendientes, nuevas = 0) {
  const porDia = Math.max(1, settings.unitsPerDay || 1);
  return (settings.baseDays || 0) + Math.ceil((pendientes + nuevas) / porDia);
}

export function datosPublicos(state) {
  return {
    actualizado: new Date().toISOString(),
    pendientes: unidadesPendientes(state),
    settings: { baseDays: state.settings.baseDays, unitsPerDay: state.settings.unitsPerDay },
    products: state.products.map((p) => ({
      name: p.name,
      printExtra: p.printExtra || 0,
      sizes: p.sizes.map((s) => ({ label: s.label, price: s.price || 0 })),
    })),
  };
}
