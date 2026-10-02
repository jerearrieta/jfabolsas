// Reglas del negocio: forma de los datos, demora de entrega y qué se publica en la página.

const CATALOGO = [
  ['Bolsita tipo marinera', ['10×10', '10×15', '15×15', '15×20', '20×20', '20×25', '25×25', '25×30', '30×30', '40×40']],
  ['Mochila', ['20×30', '25×30', '30×40', '40×50']],
  ['Tote Bag', ['20×25', '25×30', '30×40', '40×40']],
  ['Funda para lentes', ['8×17', '10×20']],
  ['Funda para botellas', ['20×34']],
  ['Bolsita para regalo', ['10×15', '15×20']],
];

let contador = 0;
function uid() {
  return Date.now().toString(36) + (contador++).toString(36) + Math.random().toString(36).slice(2, 6);
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

// Completa campos que faltan (datos nuevos o de versiones anteriores).
export function normalizar(data) {
  const s = { ...estadoInicial(), ...(data || {}) };
  s.settings = { baseDays: 3, unitsPerDay: 20, ...s.settings };
  s.products.forEach((p) => {
    p.printExtra ??= 0;
    p.sizes ??= [];
  });
  return s;
}

export function esEstadoValido(data) {
  return Boolean(
    data &&
      typeof data === 'object' &&
      Array.isArray(data.products) &&
      Array.isArray(data.orders) &&
      Array.isArray(data.clients)
  );
}

// Bolsas de pedidos que todavía no se terminaron: lo que define la demora.
export function unidadesPendientes(state) {
  return state.orders
    .filter((o) => o.status === 'pendiente' || o.status === 'produccion')
    .reduce((s, o) => s + o.items.reduce((t, i) => t + (Number(i.qty) || 0), 0), 0);
}

// Días hasta poder entregar un pedido nuevo de `nuevas` bolsas.
export function demoraDias(settings, pendientes, nuevas = 0) {
  const porDia = Math.max(1, Number(settings?.unitsPerDay) || 1);
  return (Number(settings?.baseDays) || 0) + Math.ceil((pendientes + nuevas) / porDia);
}

// Lo que ve cualquiera en la página: precios y carga de trabajo, nunca datos de clientes.
export function datosPublicos(state) {
  return {
    actualizado: new Date().toISOString(),
    pendientes: unidadesPendientes(state),
    settings: { baseDays: state.settings.baseDays, unitsPerDay: state.settings.unitsPerDay },
    products: state.products.map((p) => ({
      name: p.name,
      printExtra: Number(p.printExtra) || 0,
      sizes: p.sizes.map((s) => ({ label: s.label, price: Number(s.price) || 0 })),
    })),
  };
}
