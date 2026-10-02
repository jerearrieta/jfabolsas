import { load, save, reset, uid, validar } from './store.js';

let state = load();
let tab = 'pedidos';
let filtroPedidos = 'activos';
let mesCaja = hoy().slice(0, 7);

const app = document.getElementById('app');
const dlg = document.getElementById('dlg');
const dlgForm = document.getElementById('dlg-form');

const ESTADOS = {
  pendiente: 'Pendiente',
  produccion: 'En producción',
  listo: 'Listo para entregar',
  entregado: 'Entregado',
};
const SIGUIENTE = { pendiente: 'produccion', produccion: 'listo', listo: 'entregado' };
const CATEGORIAS = ['Tela', 'Hilos y avíos', 'Estampado', 'Envíos', 'Otros'];
const METODOS = ['Efectivo', 'Transferencia', 'Mercado Pago'];

// ---------- utilidades ----------

function hoy() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function sumarDias(iso, dias) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

const fmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const $$ = (n) => fmt.format(Math.round(n || 0));

function fecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function num(v) {
  const s = String(v ?? '').trim();
  // Acepta "1.500,50" (formato argentino) y "1500.5" (lo que devuelven los inputs numéricos).
  const n = parseFloat(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
  return isNaN(n) ? 0 : n;
}

function guardar(msg) {
  save(state);
  render();
  if (msg) toast(msg);
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

const cliente = (id) => state.clients.find((c) => c.id === id);
const producto = (id) => state.products.find((p) => p.id === id);

function totalPedido(o) {
  return o.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
}
function pagadoPedido(o) {
  return o.payments.reduce((s, p) => s + p.amount, 0);
}
function saldoPedido(o) {
  return totalPedido(o) - pagadoPedido(o);
}

function linkWhatsApp(tel, texto) {
  let d = String(tel || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = '549' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(texto)}`;
}

function detalleItems(o) {
  return o.items.map((i) => `${i.qty} × ${i.desc}`).join(', ');
}

// ---------- pestañas ----------

document.querySelectorAll('.tabs button').forEach((b) =>
  b.addEventListener('click', () => {
    tab = b.dataset.tab;
    document.querySelectorAll('.tabs button').forEach((x) => x.classList.toggle('active', x === b));
    render();
  })
);

function render() {
  const vistas = { pedidos: vistaPedidos, clientes: vistaClientes, precios: vistaPrecios, caja: vistaCaja, datos: vistaDatos };
  app.innerHTML = vistas[tab]();
}

// ---------- Pedidos ----------

function vistaPedidos() {
  const activos = state.orders.filter((o) => o.status !== 'entregado');
  const aCobrar = state.orders.reduce((s, o) => s + Math.max(0, saldoPedido(o)), 0);
  const filtros = {
    activos: (o) => o.status !== 'entregado',
    saldo: (o) => saldoPedido(o) > 0,
    entregados: (o) => o.status === 'entregado',
    todos: () => true,
  };
  const lista = state.orders
    .filter(filtros[filtroPedidos])
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

  return `
    <div class="cards">
      <div class="stat"><span>Por entregar</span><strong>${activos.length}</strong></div>
      <div class="stat"><span>A cobrar</span><strong>${$$(aCobrar)}</strong></div>
    </div>
    <div class="toolbar">
      <div class="chips">
        ${[['activos', 'Por entregar'], ['saldo', 'Con saldo'], ['entregados', 'Entregados'], ['todos', 'Todos']]
          .map(([k, l]) => `<button class="chip ${filtroPedidos === k ? 'on' : ''}" data-act="filtro" data-v="${k}">${l}</button>`)
          .join('')}
      </div>
      <button class="btn" data-act="nuevo-pedido">+ Nuevo pedido</button>
    </div>
    ${lista.length ? lista.map(tarjetaPedido).join('') : '<p class="vacio">No hay pedidos acá.</p>'}
  `;
}

function tarjetaPedido(o) {
  const c = cliente(o.clientId) || { name: '(sin cliente)' };
  const total = totalPedido(o);
  const saldo = saldoPedido(o);
  const atrasado = o.status !== 'entregado' && o.dueDate && o.dueDate < hoy();
  const sig = SIGUIENTE[o.status];
  return `
    <article class="pedido ${o.status}">
      <div class="pedido-top">
        <div>
          <h3>${esc(c.name)}</h3>
          <p class="muted">${esc(detalleItems(o))}</p>
          ${o.notes ? `<p class="muted nota">${esc(o.notes)}</p>` : ''}
        </div>
        <span class="badge ${o.status}">${ESTADOS[o.status]}</span>
      </div>
      <div class="pedido-nums">
        <div><span>Total</span><b>${$$(total)}</b></div>
        <div><span>Pagó</span><b>${$$(total - saldo)}</b></div>
        <div><span>Saldo</span><b class="${saldo > 0 ? 'debe' : 'ok'}">${$$(saldo)}</b></div>
        <div><span>Entrega</span><b class="${atrasado ? 'debe' : ''}">${fecha(o.dueDate) || '—'}</b></div>
      </div>
      <div class="acciones">
        ${sig ? `<button class="btn sm" data-act="avanzar" data-id="${o.id}">Pasar a: ${ESTADOS[sig]}</button>` : ''}
        ${saldo > 0 ? `<button class="btn sm sec" data-act="pago" data-id="${o.id}">Registrar pago</button>` : ''}
        <button class="btn sm sec" data-act="wa" data-id="${o.id}">WhatsApp</button>
        <button class="btn sm sec" data-act="editar-pedido" data-id="${o.id}">Editar</button>
      </div>
    </article>
  `;
}

function opcionesProductos(sel) {
  return state.products
    .map((p) => `<optgroup label="${esc(p.name)}">${p.sizes
      .map((s) => `<option value="${p.id}|${s.id}" ${sel === p.id + '|' + s.id ? 'selected' : ''}>${esc(p.name)} ${esc(s.label)} (${$$(s.price)})</option>`)
      .join('')}</optgroup>`)
    .join('') + `<option value="otro" ${sel === 'otro' ? 'selected' : ''}>Otro / a medida</option>`;
}

function filaItem(i = {}) {
  const sel = i.productId ? `${i.productId}|${i.sizeId}` : i.desc ? 'otro' : '';
  return `
    <div class="item-row">
      <select name="item-prod"><option value="">Elegí producto…</option>${opcionesProductos(sel)}</select>
      <input name="item-desc" placeholder="Descripción" value="${esc(sel === 'otro' ? i.desc : '')}" ${sel === 'otro' ? '' : 'hidden'}>
      <input name="item-qty" type="number" min="1" inputmode="numeric" value="${i.qty || 1}" aria-label="Cantidad">
      <input name="item-price" type="number" min="0" inputmode="decimal" value="${i.unitPrice ?? ''}" placeholder="$ c/u" aria-label="Precio unitario">
      <button type="button" class="x" data-act="quitar-item" aria-label="Quitar">×</button>
    </div>`;
}

function formPedido(o) {
  const nuevo = !o;
  o = o || { items: [{}], payments: [], dueDate: sumarDias(hoy(), state.settings.deliveryDays), status: 'pendiente' };
  const c = cliente(o.clientId);
  abrirDialogo(`
    <h2>${nuevo ? 'Nuevo pedido' : 'Editar pedido'}</h2>
    <label>Cliente
      <input name="cliente" list="lista-clientes" value="${esc(c?.name)}" required placeholder="Nombre">
      <datalist id="lista-clientes">${state.clients.map((x) => `<option value="${esc(x.name)}">`).join('')}</datalist>
    </label>
    <label>Teléfono <input name="tel" inputmode="tel" value="${esc(c?.phone)}" placeholder="351 1234567"></label>
    <fieldset>
      <legend>Qué lleva</legend>
      <div id="items">${o.items.map(filaItem).join('')}</div>
      <button type="button" class="btn sm sec" data-act="agregar-item">+ Agregar otro</button>
      <p class="total-form">Total: <b id="total-form">${$$(totalPedido({ items: o.items.filter((i) => i.qty) }))}</b></p>
    </fieldset>
    <div class="row2">
      <label>Fecha de entrega <input name="due" type="date" value="${o.dueDate || ''}"></label>
      <label>Estado <select name="status">${Object.entries(ESTADOS)
        .map(([k, l]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${l}</option>`)
        .join('')}</select></label>
    </div>
    ${nuevo ? `<label>Seña recibida ($) <input name="sena" type="number" min="0" inputmode="decimal" placeholder="0"></label>` : ''}
    <label>Notas <textarea name="notas" placeholder="Color, logo, envío…">${esc(o.notes)}</textarea></label>
    <div class="dlg-actions">
      ${nuevo ? '' : `<button type="button" class="btn danger" data-act="borrar-pedido" data-id="${o.id}">Borrar</button>`}
      <button value="cancel" formnovalidate class="btn sec">Cancelar</button>
      <button value="ok" class="btn">Guardar</button>
    </div>
  `, (f) => {
    const items = [...dlgForm.querySelectorAll('.item-row')]
      .map((r) => {
        const v = r.querySelector('[name=item-prod]').value;
        if (!v) return null;
        const qty = Math.max(1, num(r.querySelector('[name=item-qty]').value));
        const unitPrice = num(r.querySelector('[name=item-price]').value);
        if (v === 'otro') return { desc: r.querySelector('[name=item-desc]').value.trim() || 'A medida', qty, unitPrice };
        const [productId, sizeId] = v.split('|');
        const p = producto(productId);
        const s = p?.sizes.find((x) => x.id === sizeId);
        return { productId, sizeId, desc: `${p?.name} ${s?.label}`, qty, unitPrice };
      })
      .filter(Boolean);
    if (!items.length) {
      toast('Agregá al menos un producto');
      return false;
    }
    const clientId = obtenerCliente(f.get('cliente'), f.get('tel'));
    const datos = { clientId, items, dueDate: f.get('due'), status: f.get('status'), notes: f.get('notas').trim() };
    if (nuevo) {
      const pedido = { id: uid(), created: hoy(), payments: [], ...datos };
      const sena = num(f.get('sena'));
      if (sena > 0) pedido.payments.push({ id: uid(), date: hoy(), amount: sena, method: 'Efectivo' });
      if (datos.status === 'entregado') pedido.delivered = hoy();
      state.orders.push(pedido);
    } else {
      if (datos.status === 'entregado' && o.status !== 'entregado') o.delivered = hoy();
      Object.assign(o, datos);
    }
    guardar(nuevo ? 'Pedido cargado' : 'Pedido actualizado');
  });
  actualizarTotalForm();
}

function obtenerCliente(nombre, tel) {
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

function actualizarTotalForm() {
  const el = document.getElementById('total-form');
  if (!el) return;
  let t = 0;
  dlgForm.querySelectorAll('.item-row').forEach((r) => {
    t += num(r.querySelector('[name=item-qty]').value) * num(r.querySelector('[name=item-price]').value);
  });
  el.textContent = $$(t);
}

function formPago(o) {
  const c = cliente(o.clientId);
  abrirDialogo(`
    <h2>Pago de ${esc(c?.name)}</h2>
    <p class="muted">Debe ${$$(saldoPedido(o))} de ${$$(totalPedido(o))}</p>
    ${o.payments.length ? `<ul class="pagos">${o.payments
      .map((p) => `<li>${fecha(p.date)} · ${esc(p.method)} <b>${$$(p.amount)}</b></li>`)
      .join('')}</ul>` : ''}
    <div class="row2">
      <label>Monto <input name="monto" type="number" min="1" inputmode="decimal" value="${Math.max(0, saldoPedido(o))}" required></label>
      <label>Fecha <input name="fecha" type="date" value="${hoy()}"></label>
    </div>
    <label>Forma de pago <select name="metodo">${METODOS.map((m) => `<option>${m}</option>`).join('')}</select></label>
    <div class="dlg-actions">
      <button value="cancel" formnovalidate class="btn sec">Cancelar</button>
      <button value="ok" class="btn">Registrar</button>
    </div>
  `, (f) => {
    o.payments.push({ id: uid(), date: f.get('fecha') || hoy(), amount: num(f.get('monto')), method: f.get('metodo') });
    guardar('Pago registrado');
  });
}

function formWhatsApp(o) {
  const c = cliente(o.clientId);
  const saldo = saldoPedido(o);
  const nombre = c?.name.split(' ')[0] || '';
  const mensajes = [
    ['Pedido listo', `Hola ${nombre}! Tu pedido (${detalleItems(o)}) ya está listo para retirar.${saldo > 0 ? ` Te queda un saldo de ${$$(saldo)}.` : ''} Gracias!`],
    ['Recordar saldo', `Hola ${nombre}! Te recuerdo que del pedido (${detalleItems(o)}) queda un saldo de ${$$(saldo)}. Gracias!`],
    ['Confirmar pedido', `Hola ${nombre}! Te confirmo el pedido: ${detalleItems(o)}. Total ${$$(totalPedido(o))}.${o.dueDate ? ` Entrega estimada: ${fecha(o.dueDate)}.` : ''} Gracias!`],
  ];
  abrirDialogo(`
    <h2>Mensaje para ${esc(c?.name)}</h2>
    ${c?.phone ? '' : '<p class="aviso">Este cliente no tiene teléfono cargado; WhatsApp te va a pedir elegir el contacto.</p>'}
    <div class="wa-list">
      ${mensajes
        .map(([t, m]) => `<a class="wa-msg" target="_blank" rel="noopener" href="${c?.phone ? linkWhatsApp(c.phone, m) : 'https://wa.me/?text=' + encodeURIComponent(m)}"><b>${t}</b><span>${esc(m)}</span></a>`)
        .join('')}
    </div>
    <div class="dlg-actions"><button value="cancel" class="btn sec">Cerrar</button></div>
  `);
}

// ---------- Clientes ----------

function vistaClientes() {
  const filas = state.clients
    .map((c) => {
      const ped = state.orders.filter((o) => o.clientId === c.id);
      return { c, ped, saldo: ped.reduce((s, o) => s + saldoPedido(o), 0) };
    })
    .sort((a, b) => b.saldo - a.saldo || a.c.name.localeCompare(b.c.name));
  if (!filas.length) return '<p class="vacio">Los clientes se crean solos al cargar un pedido.</p>';
  return `
    <p class="muted">Ordenados por lo que deben.</p>
    ${filas
      .map(({ c, ped, saldo }) => `
      <details class="cliente">
        <summary>
          <span><b>${esc(c.name)}</b> <small class="muted">${esc(c.phone)}</small></span>
          <span class="${saldo > 0 ? 'debe' : 'ok'}">${saldo > 0 ? 'Debe ' + $$(saldo) : 'Al día'}</span>
        </summary>
        <ul>${ped
          .map((o) => `<li>${fecha(o.created)} · ${esc(detalleItems(o))} · ${ESTADOS[o.status]} · saldo <b>${$$(saldoPedido(o))}</b></li>`)
          .join('') || '<li>Sin pedidos</li>'}</ul>
        <div class="acciones">
          <button class="btn sm sec" data-act="editar-cliente" data-id="${c.id}">Editar datos</button>
        </div>
      </details>`)
      .join('')}
  `;
}

function formCliente(c) {
  abrirDialogo(`
    <h2>Cliente</h2>
    <label>Nombre <input name="nombre" value="${esc(c.name)}" required></label>
    <label>Teléfono <input name="tel" inputmode="tel" value="${esc(c.phone)}"></label>
    <div class="dlg-actions">
      <button value="cancel" formnovalidate class="btn sec">Cancelar</button>
      <button value="ok" class="btn">Guardar</button>
    </div>
  `, (f) => {
    c.name = f.get('nombre').trim();
    c.phone = f.get('tel').trim();
    guardar('Cliente actualizado');
  });
}

// ---------- Precios ----------

function vistaPrecios() {
  const ultimo = state.priceHistory[state.priceHistory.length - 1];
  return `
    <section class="panel">
      <h2>Aplicar un aumento</h2>
      <p class="muted">Cambia todos los precios de una vez. Podés deshacerlo si te equivocás.</p>
      <form id="form-aumento" class="aumento">
        <label>Aumento
          <div class="input-unidad">
            <input name="valor" type="number" step="any" inputmode="decimal" required placeholder="10">
            <select name="tipo"><option value="pct">%</option><option value="monto">$ fijos</option></select>
          </div>
        </label>
        <label>A qué productos
          <select name="alcance"><option value="">Todos</option>${state.products
            .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
            .join('')}</select>
        </label>
        <label>Redondear a
          <select name="redondeo"><option value="1">Sin redondeo</option><option value="10">$10</option><option value="50">$50</option><option value="100" selected>$100</option></select>
        </label>
        <button class="btn">Aplicar aumento</button>
      </form>
      ${ultimo ? `<p class="muted">Último: ${esc(ultimo.label)} el ${fecha(ultimo.date)} · <button class="link" data-act="deshacer-aumento">Deshacer</button></p>` : ''}
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Lista de precios</h2>
        <button class="btn sm sec" data-act="nuevo-producto">+ Producto</button>
      </div>
      <p class="muted">Tocá un precio para cambiarlo. Se guarda solo.</p>
      ${state.products
        .map((p) => `
        <div class="producto">
          <div class="producto-head">
            <h3>${esc(p.name)}</h3>
            <span>
              <button class="link" data-act="nueva-medida" data-id="${p.id}">+ medida</button>
              <button class="link danger" data-act="borrar-producto" data-id="${p.id}">borrar</button>
            </span>
          </div>
          <div class="precios">
            ${p.sizes
              .map((s) => `
              <label class="precio">
                <span>${esc(s.label)}</span>
                <input type="number" min="0" inputmode="decimal" value="${s.price || ''}" placeholder="$" data-precio="${p.id}|${s.id}">
                <button type="button" class="x" data-act="borrar-medida" data-id="${p.id}|${s.id}" aria-label="Borrar medida">×</button>
              </label>`)
              .join('')}
          </div>
        </div>`)
        .join('')}
    </section>

    <section class="panel">
      <h2>Demora de entrega</h2>
      <label class="inline">Días que tarda un pedido nuevo
        <input type="number" min="0" id="demora" value="${state.settings.deliveryDays}">
      </label>
      <p class="muted">Se usa para proponer la fecha de entrega al cargar un pedido.</p>
    </section>
  `;
}

function aplicarAumento(f) {
  const valor = num(f.get('valor'));
  const tipo = f.get('tipo');
  const alcance = f.get('alcance');
  const redondeo = num(f.get('redondeo')) || 1;
  if (!valor) return;
  const prods = state.products.filter((p) => !alcance || p.id === alcance);
  const antes = prods.flatMap((p) => p.sizes.map((s) => [p.id, s.id, s.price]));
  prods.forEach((p) =>
    p.sizes.forEach((s) => {
      if (!s.price) return;
      const nuevo = tipo === 'pct' ? s.price * (1 + valor / 100) : s.price + valor;
      s.price = Math.max(0, Math.round(nuevo / redondeo) * redondeo);
    })
  );
  const label = `${tipo === 'pct' ? valor + '%' : $$(valor)} a ${alcance ? producto(alcance).name : 'todos'}`;
  state.priceHistory.push({ date: hoy(), label, antes });
  guardar(`Aumento aplicado: ${label}`);
}

function deshacerAumento() {
  const h = state.priceHistory.pop();
  if (!h) return;
  h.antes.forEach(([pid, sid, price]) => {
    const s = producto(pid)?.sizes.find((x) => x.id === sid);
    if (s) s.price = price;
  });
  guardar('Aumento deshecho');
}

// ---------- Caja ----------

function movimientosDelMes() {
  const delMes = (d) => d && d.startsWith(mesCaja);
  const ingresos = [
    ...state.orders.flatMap((o) =>
      o.payments.filter((p) => delMes(p.date)).map((p) => ({
        date: p.date,
        concepto: `${cliente(o.clientId)?.name || ''} · ${detalleItems(o)}`,
        detalle: p.method,
        amount: p.amount,
      }))
    ),
    ...state.incomes.filter((i) => delMes(i.date)).map((i) => ({ ...i, detalle: 'Venta suelta', id: i.id, tipo: 'income' })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const gastos = state.expenses.filter((e) => delMes(e.date)).sort((a, b) => b.date.localeCompare(a.date));
  const vendido = state.orders.filter((o) => delMes(o.created)).reduce((s, o) => s + totalPedido(o), 0)
    + state.incomes.filter((i) => delMes(i.date)).reduce((s, i) => s + i.amount, 0);
  return { ingresos, gastos, vendido };
}

function vistaCaja() {
  const { ingresos, gastos, vendido } = movimientosDelMes();
  const totIng = ingresos.reduce((s, i) => s + i.amount, 0);
  const totGas = gastos.reduce((s, g) => s + g.amount, 0);
  const porCat = CATEGORIAS.map((c) => [c, gastos.filter((g) => g.category === c).reduce((s, g) => s + g.amount, 0)]).filter(([, v]) => v);
  return `
    <div class="toolbar">
      <label class="inline">Mes <input type="month" id="mes" value="${mesCaja}"></label>
      <span>
        <button class="btn sm sec" data-act="nuevo-ingreso">+ Venta suelta</button>
        <button class="btn sm" data-act="nuevo-gasto">+ Gasto</button>
      </span>
    </div>
    <div class="cards">
      <div class="stat"><span>Vendido</span><strong>${$$(vendido)}</strong><small>pedidos tomados en el mes</small></div>
      <div class="stat"><span>Cobrado</span><strong>${$$(totIng)}</strong></div>
      <div class="stat"><span>Gastado</span><strong>${$$(totGas)}</strong></div>
      <div class="stat ${totIng - totGas >= 0 ? 'pos' : 'neg'}"><span>Quedó</span><strong>${$$(totIng - totGas)}</strong><small>cobrado − gastado</small></div>
    </div>
    ${porCat.length ? `<p class="muted">Gastos: ${porCat.map(([c, v]) => `${c} ${$$(v)}`).join(' · ')}</p>` : ''}
    <section class="panel">
      <h2>Cobros</h2>
      ${ingresos.length ? `<ul class="movs">${ingresos
        .map((i) => `<li><span>${fecha(i.date)}</span><span>${esc(i.concepto)} <small class="muted">${esc(i.detalle)}</small></span><b class="ok">${$$(i.amount)}</b>${i.tipo === 'income' ? `<button class="x" data-act="borrar-ingreso" data-id="${i.id}" aria-label="Borrar">×</button>` : '<span></span>'}</li>`)
        .join('')}</ul>` : '<p class="vacio">Sin cobros este mes.</p>'}
    </section>
    <section class="panel">
      <h2>Gastos</h2>
      ${gastos.length ? `<ul class="movs">${gastos
        .map((g) => `<li><span>${fecha(g.date)}</span><span>${esc(g.concepto)} <small class="muted">${esc(g.category)}</small></span><b class="debe">${$$(g.amount)}</b><button class="x" data-act="borrar-gasto" data-id="${g.id}" aria-label="Borrar">×</button></li>`)
        .join('')}</ul>` : '<p class="vacio">Sin gastos este mes.</p>'}
    </section>
  `;
}

function formMovimiento(tipo) {
  const gasto = tipo === 'gasto';
  abrirDialogo(`
    <h2>${gasto ? 'Nuevo gasto' : 'Venta suelta'}</h2>
    <label>${gasto ? 'Qué compraste' : 'Qué vendiste'} <input name="concepto" required placeholder="${gasto ? 'Ej. 10 m de lienzo' : 'Ej. 3 tote bags en feria'}"></label>
    <div class="row2">
      <label>Monto <input name="monto" type="number" min="0" inputmode="decimal" required></label>
      <label>Fecha <input name="fecha" type="date" value="${hoy()}"></label>
    </div>
    ${gasto ? `<label>Categoría <select name="cat">${CATEGORIAS.map((c) => `<option>${c}</option>`).join('')}</select></label>` : ''}
    <div class="dlg-actions">
      <button value="cancel" formnovalidate class="btn sec">Cancelar</button>
      <button value="ok" class="btn">Guardar</button>
    </div>
  `, (f) => {
    const mov = { id: uid(), date: f.get('fecha') || hoy(), concepto: f.get('concepto').trim(), amount: num(f.get('monto')) };
    if (gasto) state.expenses.push({ ...mov, category: f.get('cat') });
    else state.incomes.push(mov);
    mesCaja = mov.date.slice(0, 7);
    guardar(gasto ? 'Gasto cargado' : 'Venta cargada');
  });
}

// ---------- Datos ----------

function vistaDatos() {
  return `
    <section class="panel">
      <h2>Copia de seguridad</h2>
      <p class="muted">Por ahora los datos quedan guardados en este navegador. Descargá una copia cada tanto, y usala para pasar los datos a otro celular o computadora.</p>
      <div class="acciones">
        <button class="btn" data-act="exportar">Descargar copia</button>
        <label class="btn sec">Cargar copia <input type="file" accept="application/json" id="importar" hidden></label>
      </div>
    </section>
    <section class="panel">
      <h2>Empezar de cero</h2>
      <p class="muted">Borra todos los pedidos, clientes, gastos y precios de este navegador.</p>
      <button class="btn danger" data-act="borrar-todo">Borrar todo</button>
    </section>
  `;
}

function exportar() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `jfa-bolsas-${hoy()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---------- diálogo ----------

let alConfirmar = null;

function abrirDialogo(html, onOk) {
  dlgForm.innerHTML = html;
  alConfirmar = onOk || null;
  dlg.showModal();
}

dlgForm.addEventListener('submit', (e) => {
  if (e.submitter?.value !== 'ok' || !alConfirmar) return;
  if (alConfirmar(new FormData(dlgForm)) === false) e.preventDefault();
});

dlgForm.addEventListener('input', (e) => {
  if (e.target.matches('[name=item-qty],[name=item-price]')) actualizarTotalForm();
});

dlgForm.addEventListener('change', (e) => {
  if (!e.target.matches('[name=item-prod]')) return;
  const row = e.target.closest('.item-row');
  const v = e.target.value;
  row.querySelector('[name=item-desc]').hidden = v !== 'otro';
  if (v && v !== 'otro') {
    const [pid, sid] = v.split('|');
    const s = producto(pid)?.sizes.find((x) => x.id === sid);
    row.querySelector('[name=item-price]').value = s?.price || '';
  }
  actualizarTotalForm();
});

// ---------- eventos ----------

function buscarPedido(id) {
  return state.orders.find((o) => o.id === id);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const { act, id, v } = b.dataset;
  switch (act) {
    case 'filtro': filtroPedidos = v; render(); break;
    case 'nuevo-pedido': formPedido(); break;
    case 'editar-pedido': formPedido(buscarPedido(id)); break;
    case 'pago': formPago(buscarPedido(id)); break;
    case 'wa': formWhatsApp(buscarPedido(id)); break;
    case 'avanzar': {
      const o = buscarPedido(id);
      o.status = SIGUIENTE[o.status];
      if (o.status === 'entregado') o.delivered = hoy();
      guardar(`Pedido: ${ESTADOS[o.status]}`);
      break;
    }
    case 'agregar-item': document.getElementById('items').insertAdjacentHTML('beforeend', filaItem()); break;
    case 'quitar-item': {
      const rows = dlgForm.querySelectorAll('.item-row');
      if (rows.length > 1) b.closest('.item-row').remove();
      actualizarTotalForm();
      break;
    }
    case 'borrar-pedido':
      if (confirm('¿Borrar este pedido y sus pagos?')) {
        state.orders = state.orders.filter((o) => o.id !== id);
        dlg.close();
        guardar('Pedido borrado');
      }
      break;
    case 'editar-cliente': formCliente(cliente(id)); break;
    case 'deshacer-aumento': deshacerAumento(); break;
    case 'nuevo-producto': {
      const name = prompt('Nombre del producto');
      if (name?.trim()) {
        state.products.push({ id: uid(), name: name.trim(), sizes: [] });
        guardar('Producto agregado');
      }
      break;
    }
    case 'nueva-medida': {
      const label = prompt('Medida (ej. 30×40 cm)');
      if (label?.trim()) {
        producto(id).sizes.push({ id: uid(), label: label.trim(), price: 0 });
        guardar('Medida agregada');
      }
      break;
    }
    case 'borrar-medida': {
      const [pid, sid] = id.split('|');
      const p = producto(pid);
      if (confirm(`¿Borrar la medida ${p.sizes.find((s) => s.id === sid)?.label} de ${p.name}?`)) {
        p.sizes = p.sizes.filter((s) => s.id !== sid);
        guardar('Medida borrada');
      }
      break;
    }
    case 'borrar-producto':
      if (confirm(`¿Borrar ${producto(id).name} con todas sus medidas?`)) {
        state.products = state.products.filter((p) => p.id !== id);
        guardar('Producto borrado');
      }
      break;
    case 'nuevo-gasto': formMovimiento('gasto'); break;
    case 'nuevo-ingreso': formMovimiento('ingreso'); break;
    case 'borrar-gasto':
      if (confirm('¿Borrar este gasto?')) {
        state.expenses = state.expenses.filter((g) => g.id !== id);
        guardar('Gasto borrado');
      }
      break;
    case 'borrar-ingreso':
      if (confirm('¿Borrar esta venta?')) {
        state.incomes = state.incomes.filter((g) => g.id !== id);
        guardar('Venta borrada');
      }
      break;
    case 'exportar': exportar(); break;
    case 'borrar-todo':
      if (confirm('¿Seguro? Se borra todo lo cargado en este navegador.')) {
        state = reset();
        guardar('Datos borrados');
      }
      break;
  }
});

app.addEventListener('submit', (e) => {
  if (e.target.id !== 'form-aumento') return;
  e.preventDefault();
  aplicarAumento(new FormData(e.target));
});

app.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.precio) {
    const [pid, sid] = t.dataset.precio.split('|');
    const s = producto(pid)?.sizes.find((x) => x.id === sid);
    if (s) {
      s.price = num(t.value);
      save(state);
      toast('Precio guardado');
    }
  } else if (t.id === 'demora') {
    state.settings.deliveryDays = Math.max(0, num(t.value));
    save(state);
    toast('Demora guardada');
  } else if (t.id === 'mes') {
    mesCaja = t.value || hoy().slice(0, 7);
    render();
  } else if (t.id === 'importar' && t.files[0]) {
    t.files[0].text().then((txt) => {
      try {
        const data = JSON.parse(txt);
        if (!validar(data)) throw new Error('formato');
        if (!confirm('Esto reemplaza los datos de este navegador por los de la copia. ¿Seguir?')) return;
        state = { ...load(), ...data };
        guardar('Copia cargada');
      } catch {
        toast('Ese archivo no es una copia válida');
      }
    });
  }
});

render();
