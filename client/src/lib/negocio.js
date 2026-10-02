// Constantes y cuentas del panel de administración.

export const ESTADOS = {
  pendiente: 'Pendiente',
  produccion: 'En producción',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
};
export const SIGUIENTE = { pendiente: 'produccion', produccion: 'listo', listo: 'entregado' };
export const CATEGORIAS = ['Tela', 'Hilos y avíos', 'Estampado', 'Envíos', 'Otros'];
export const METODOS = ['Efectivo', 'Transferencia', 'Mercado Pago'];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export const totalPedido = (o) => o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
export const pagadoPedido = (o) => o.payments.reduce((s, p) => s + p.amount, 0);
export const saldoPedido = (o) => totalPedido(o) - pagadoPedido(o);
export const detalleItems = (o) => o.items.map((i) => `${i.qty} × ${i.desc}`).join(', ');

export const buscarCliente = (state, id) => state.clients.find((c) => c.id === id);
export const buscarProducto = (state, id) => state.products.find((p) => p.id === id);

// Devuelve el id del cliente con ese nombre; si no existe, lo crea.
export function obtenerCliente(state, nombre, tel) {
  nombre = nombre.trim();
  tel = (tel || '').trim();
  let c = state.clients.find((x) => x.name.toLowerCase() === nombre.toLowerCase());
  if (!c) {
    c = { id: uid(), name: nombre, phone: tel };
    state.clients.push(c);
  } else if (tel) {
    c.phone = tel;
  }
  return c.id;
}
