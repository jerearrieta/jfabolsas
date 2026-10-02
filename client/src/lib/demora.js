// Misma cuenta que server/src/negocio/estado.js: días mínimos + bolsas pendientes ÷ bolsas por día.
export function demoraDias(settings, pendientes, nuevas = 0) {
  const porDia = Math.max(1, Number(settings?.unitsPerDay) || 1);
  return (Number(settings?.baseDays) || 0) + Math.ceil((pendientes + nuevas) / porDia);
}

export function unidadesPendientes(state) {
  return state.orders
    .filter((o) => o.status === 'pendiente' || o.status === 'produccion')
    .reduce((s, o) => s + o.items.reduce((t, i) => t + (Number(i.qty) || 0), 0), 0);
}
