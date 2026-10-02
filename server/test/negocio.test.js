import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizar, demoraDias, unidadesPendientes, datosPublicos, esEstadoValido } from '../src/negocio/estado.js';

test('normalizar completa un estado vacío con el catálogo y ajustes por defecto', () => {
  const s = normalizar(null);
  assert.equal(s.products.length, 6);
  assert.deepEqual(s.settings, { baseDays: 3, unitsPerDay: 20 });
  assert.equal(s.products[0].printExtra, 0);
});

test('demora: días mínimos más pendientes divididas por bolsas por día', () => {
  assert.equal(demoraDias({ baseDays: 2, unitsPerDay: 10 }, 25), 5);
  assert.equal(demoraDias({ baseDays: 2, unitsPerDay: 10 }, 25, 10), 6);
  assert.equal(demoraDias({ baseDays: 0, unitsPerDay: 0 }, 3), 3);
});

test('solo cuentan como pendientes los pedidos sin terminar', () => {
  const s = normalizar({
    orders: [
      { status: 'pendiente', items: [{ qty: 10 }, { qty: 5 }] },
      { status: 'produccion', items: [{ qty: 3 }] },
      { status: 'listo', items: [{ qty: 100 }] },
      { status: 'entregado', items: [{ qty: 100 }] },
    ],
  });
  assert.equal(unidadesPendientes(s), 18);
});

test('los datos públicos no incluyen clientes ni pedidos', () => {
  const s = normalizar({ clients: [{ name: 'Ana', phone: '351' }], orders: [] });
  const p = datosPublicos(s);
  assert.deepEqual(Object.keys(p).sort(), ['actualizado', 'pendientes', 'products', 'settings']);
  assert.ok(!JSON.stringify(p).includes('Ana'));
});

test('valida la forma mínima de los datos', () => {
  assert.equal(esEstadoValido({ products: [], orders: [], clients: [] }), true);
  assert.equal(esEstadoValido({ products: [] }), false);
  assert.equal(esEstadoValido(null), false);
});
