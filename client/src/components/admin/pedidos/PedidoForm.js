'use client';

import { useState } from 'react';
import Modal, { Acciones } from '../Modal';
import { ESTADOS, buscarCliente, buscarProducto, obtenerCliente, uid } from '@/lib/negocio';
import { hoy, numero, pesos, sumarDias } from '@/lib/formato';

// Una fila del formulario: producto elegido ("idProducto|idMedida" u "otro"), cantidad, precio y estampado.
function filaDesde(item) {
  return {
    key: uid(),
    sel: item.productId ? `${item.productId}|${item.sizeId}` : item.desc ? 'otro' : '',
    desc: item.productId ? '' : (item.desc || '').replace(/ con estampado$/, ''),
    qty: String(item.qty || 1),
    price: item.unitPrice != null ? String(item.unitPrice) : '',
    print: Boolean(item.print),
  };
}

export default function PedidoForm({ state, pedido, demora, actualizar, onClose }) {
  const nuevo = !pedido;
  const cliente = pedido && buscarCliente(state, pedido.clientId);
  const [filas, setFilas] = useState(() => (pedido ? pedido.items : [{}]).map(filaDesde));

  // Precio sugerido: el de la lista más el extra si lleva estampado.
  function precioDeLista(sel, print) {
    if (!sel || sel === 'otro') return null;
    const [pid, sid] = sel.split('|');
    const p = buscarProducto(state, pid);
    const s = p?.sizes.find((x) => x.id === sid);
    return (s?.price || 0) + (print ? p.printExtra || 0 : 0);
  }

  function cambiarFila(key, cambios) {
    setFilas((fs) =>
      fs.map((f) => {
        if (f.key !== key) return f;
        const g = { ...f, ...cambios };
        if ('sel' in cambios || 'print' in cambios) {
          const precio = precioDeLista(g.sel, g.print);
          if (precio !== null) g.price = precio ? String(precio) : '';
        }
        return g;
      })
    );
  }

  const total = filas.reduce((t, f) => t + numero(f.qty) * numero(f.price), 0);

  function guardar(f) {
    const items = filas
      .filter((r) => r.sel)
      .map((r) => {
        const qty = Math.max(1, numero(r.qty));
        const unitPrice = numero(r.price);
        const conEstampado = r.print ? ' con estampado' : '';
        if (r.sel === 'otro') return { desc: (r.desc.trim() || 'A medida') + conEstampado, qty, unitPrice, print: r.print };
        const [productId, sizeId] = r.sel.split('|');
        const p = buscarProducto(state, productId);
        const s = p?.sizes.find((x) => x.id === sizeId);
        return { productId, sizeId, desc: `${p?.name} ${s?.label}${conEstampado}`, qty, unitPrice, print: r.print };
      });
    if (!items.length) return alert('Agregá al menos un producto');

    actualizar(
      (s) => {
        const clientId = obtenerCliente(s, f.get('cliente'), f.get('tel'));
        const datos = { clientId, items, dueDate: f.get('due'), status: f.get('status'), notes: f.get('notas').trim() };
        if (nuevo) {
          const o = { id: uid(), created: hoy(), payments: [], ...datos };
          const sena = numero(f.get('sena'));
          if (sena > 0) o.payments.push({ id: uid(), date: hoy(), amount: sena, method: 'Efectivo' });
          if (datos.status === 'entregado') o.delivered = hoy();
          s.orders.push(o);
        } else {
          const o = s.orders.find((x) => x.id === pedido.id);
          if (datos.status === 'entregado' && o.status !== 'entregado') o.delivered = hoy();
          Object.assign(o, datos);
        }
      },
      nuevo ? 'Pedido cargado' : 'Pedido actualizado'
    );
    onClose();
  }

  function borrar() {
    if (!confirm('¿Borrar este pedido y sus pagos?')) return;
    actualizar((s) => {
      s.orders = s.orders.filter((o) => o.id !== pedido.id);
    }, 'Pedido borrado');
    onClose();
  }

  return (
    <Modal onClose={onClose} onSubmit={guardar}>
      <h2>{nuevo ? 'Nuevo pedido' : 'Editar pedido'}</h2>
      <label>
        Cliente
        <input name="cliente" list="lista-clientes" defaultValue={cliente?.name} required placeholder="Nombre" />
        <datalist id="lista-clientes">
          {state.clients.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </label>
      <label>
        Teléfono <input name="tel" inputMode="tel" defaultValue={cliente?.phone} placeholder="351 1234567" />
      </label>
      <fieldset>
        <legend>Qué lleva</legend>
        {filas.map((r) => (
          <div className="item-row" key={r.key}>
            <select name="item-prod" value={r.sel} onChange={(e) => cambiarFila(r.key, { sel: e.target.value })}>
              <option value="">Elegí producto…</option>
              {state.products.map((p) => (
                <optgroup key={p.id} label={p.name}>
                  {p.sizes.map((s) => (
                    <option key={s.id} value={`${p.id}|${s.id}`}>
                      {p.name} {s.label} ({pesos(s.price)})
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="otro">Otro / a medida</option>
            </select>
            {r.sel === 'otro' && (
              <input
                name="item-desc"
                placeholder="Descripción"
                value={r.desc}
                onChange={(e) => cambiarFila(r.key, { desc: e.target.value })}
              />
            )}
            <label className="check">
              <input
                type="checkbox"
                name="item-print"
                checked={r.print}
                onChange={(e) => cambiarFila(r.key, { print: e.target.checked })}
              />{' '}
              Estampado
            </label>
            <input
              name="item-qty"
              type="number"
              min="1"
              inputMode="numeric"
              aria-label="Cantidad"
              value={r.qty}
              onChange={(e) => cambiarFila(r.key, { qty: e.target.value })}
            />
            <input
              name="item-price"
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="$ c/u"
              aria-label="Precio unitario"
              value={r.price}
              onChange={(e) => cambiarFila(r.key, { price: e.target.value })}
            />
            <button
              type="button"
              className="x"
              aria-label="Quitar"
              onClick={() => setFilas((fs) => (fs.length > 1 ? fs.filter((x) => x.key !== r.key) : fs))}
            >
              ×
            </button>
          </div>
        ))}
        <button type="button" className="btn sm sec" onClick={() => setFilas((fs) => [...fs, filaDesde({})])}>
          + Agregar otro
        </button>
        <p className="total-form">
          Total: <b>{pesos(total)}</b>
        </p>
      </fieldset>
      <div className="row2">
        <label>
          Fecha de entrega <input name="due" type="date" defaultValue={pedido?.dueDate || sumarDias(hoy(), demora)} />
        </label>
        <label>
          Estado
          <select name="status" defaultValue={pedido?.status || 'pendiente'}>
            {Object.entries(ESTADOS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </label>
      </div>
      {nuevo && (
        <label>
          Seña recibida ($) <input name="sena" type="number" min="0" inputMode="decimal" placeholder="0" />
        </label>
      )}
      <label>
        Notas <textarea name="notas" placeholder="Color, logo, envío…" defaultValue={pedido?.notes} />
      </label>
      <Acciones onClose={onClose}>
        {!nuevo && (
          <button type="button" className="btn danger" onClick={borrar}>
            Borrar
          </button>
        )}
      </Acciones>
    </Modal>
  );
}

