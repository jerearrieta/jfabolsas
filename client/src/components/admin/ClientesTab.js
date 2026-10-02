'use client';

import { useState } from 'react';
import Modal, { Acciones } from './Modal';
import { ESTADOS, detalleItems, saldoPedido } from '@/lib/negocio';
import { fechaCorta, pesos } from '@/lib/formato';

export default function ClientesTab({ state, actualizar }) {
  const [editando, setEditando] = useState(null);

  const filas = state.clients
    .map((c) => {
      const pedidos = state.orders.filter((o) => o.clientId === c.id);
      return { c, pedidos, saldo: pedidos.reduce((s, o) => s + saldoPedido(o), 0) };
    })
    .sort((a, b) => b.saldo - a.saldo || a.c.name.localeCompare(b.c.name));

  if (!filas.length) return <p className="vacio">Los clientes se crean solos al cargar un pedido.</p>;

  return (
    <>
      <p className="muted">Ordenados por lo que deben.</p>
      {filas.map(({ c, pedidos, saldo }) => (
        <details className="cliente" key={c.id}>
          <summary>
            <span>
              <b>{c.name}</b> <small className="muted">{c.phone}</small>
            </span>
            <span className={saldo > 0 ? 'debe' : 'ok'}>{saldo > 0 ? `Debe ${pesos(saldo)}` : 'Al día'}</span>
          </summary>
          <ul>
            {pedidos.length ? (
              pedidos.map((o) => (
                <li key={o.id}>
                  {fechaCorta(o.created)} · {detalleItems(o)} · {ESTADOS[o.status]} · saldo <b>{pesos(saldoPedido(o))}</b>
                </li>
              ))
            ) : (
              <li>Sin pedidos</li>
            )}
          </ul>
          <div className="acciones">
            <button className="btn sm sec" onClick={() => setEditando(c)}>
              Editar datos
            </button>
          </div>
        </details>
      ))}
      {editando && (
        <Modal
          onClose={() => setEditando(null)}
          onSubmit={(f) => {
            actualizar((s) => {
              const c = s.clients.find((x) => x.id === editando.id);
              c.name = f.get('nombre').trim();
              c.phone = f.get('tel').trim();
            }, 'Cliente actualizado');
            setEditando(null);
          }}
        >
          <h2>Cliente</h2>
          <label>
            Nombre <input name="nombre" defaultValue={editando.name} required />
          </label>
          <label>
            Teléfono <input name="tel" inputMode="tel" defaultValue={editando.phone} />
          </label>
          <Acciones onClose={() => setEditando(null)} />
        </Modal>
      )}
    </>
  );
}
