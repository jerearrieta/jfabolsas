// Cotizador de la página: toma los precios y la carga de trabajo que publica el panel
// y arma el mensaje de WhatsApp con el presupuesto listo.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { demoraDias } from './admin/store.js';

const WHATSAPP = '5493516808341';
const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const $$ = (n) => fmt.format(Math.round(n));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function leerDatos() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/publico?id=eq.1&select=data`, {
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    if (!r.ok) return null;
    return (await r.json())[0]?.data || null;
  }
  try {
    return JSON.parse(localStorage.getItem('jfa-publico'));
  } catch {
    return null;
  }
}

function fechaLarga(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const el = (id) => document.getElementById(id);

async function iniciar() {
  const datos = await leerDatos().catch(() => null);
  const productos = (datos?.products || []).filter((p) => p.sizes.some((s) => s.price > 0));
  if (!productos.length) return; // sin precios cargados la sección queda oculta

  el('cotizador').hidden = false;
  document.querySelectorAll('[data-solo-cotizador]').forEach((x) => (x.hidden = false));
  const prod = el('cot-producto');
  const medida = el('cot-medida');
  const cant = el('cot-cantidad');
  const estampado = el('cot-estampado');

  prod.innerHTML = productos.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('');

  function cargarMedidas() {
    const p = productos[prod.value];
    medida.innerHTML = p.sizes
      .filter((s) => s.price > 0)
      .map((s, i) => `<option value="${i}">${esc(s.label)}</option>`)
      .join('');
  }

  function calcular() {
    const p = productos[prod.value];
    const s = p.sizes.filter((x) => x.price > 0)[medida.value];
    const n = Math.max(1, parseInt(cant.value, 10) || 1);
    const conEstampado = estampado.checked;
    const extra = conEstampado ? p.printExtra : 0;
    const unit = s.price + extra;
    const dias = demoraDias(datos.settings || {}, datos.pendientes || 0, n);
    const estampadoACotizar = conEstampado && !p.printExtra;

    el('cot-unitario').textContent = $$(unit);
    el('cot-total').textContent = $$(unit * n);
    el('cot-demora').textContent = `${dias} días (aprox. ${fechaLarga(dias)})`;
    el('cot-nota-estampado').hidden = !estampadoACotizar;

    const detalle = `${n} × ${p.name} ${s.label}${conEstampado ? ' con estampado' : ''}`;
    const nombre = el('cot-nombre').value.trim();
    let msg = `Hola! Quiero hacer este pedido: ${detalle}.`;
    msg += `\nPrecio según la web: ${$$(unit)} c/u, total ${$$(unit * n)}${estampadoACotizar ? ' (+ estampado a cotizar)' : ''}.`;
    msg += `\nEntrega estimada: ${dias} días.`;
    if (nombre) msg += `\nMi nombre es ${nombre}.`;
    el('cot-enviar').href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }

  prod.addEventListener('change', () => {
    cargarMedidas();
    calcular();
  });
  [medida, cant, estampado, el('cot-nombre')].forEach((x) => x.addEventListener('input', calcular));
  medida.addEventListener('change', calcular);

  if (datos.actualizado) {
    el('cot-actualizado').textContent = new Date(datos.actualizado).toLocaleDateString('es-AR');
  }
  cargarMedidas();
  calcular();
}

iniciar();
