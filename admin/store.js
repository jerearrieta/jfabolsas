// Guarda todos los datos del panel. Hoy viven en el navegador (localStorage);
// para usarlo desde varios dispositivos alcanza con reemplazar load/save por
// una base remota sin tocar el resto del panel.

const KEY = 'jfa-admin-v1';

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
      sizes: sizes.map((label) => ({ id: uid(), label: `${label} cm`, price: 0 })),
    })),
    clients: [],
    orders: [],
    expenses: [],
    incomes: [],
    priceHistory: [],
    settings: { deliveryDays: 10 },
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...estadoInicial(), ...JSON.parse(raw) };
  } catch (e) {
    console.error('No se pudieron leer los datos guardados', e);
  }
  return estadoInicial();
}

export function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function reset() {
  localStorage.removeItem(KEY);
  return estadoInicial();
}

export function validar(data) {
  return data && Array.isArray(data.products) && Array.isArray(data.orders) && Array.isArray(data.clients);
}
