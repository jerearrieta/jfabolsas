'use client';

import { useState } from 'react';
import PedidoCard from './PedidoCard';
import PedidoForm from './PedidoForm';
import PagoForm from './PagoForm';
import MensajesWhatsApp from './MensajesWhatsApp';
import { saldoPedido, SIGUIENTE, ESTADOS } from '@/lib/negocio';
import { demoraDias, unidadesPendientes } from '@/lib/demora';
import { pesos, hoy } from '@/lib/formato';

const FILTROS = {
  activos: ['Por entregar', (o) => o.status !== 'entregado'],
  saldo: ['Con saldo', (o) => saldoPedido(o) > 0],
  entregados: ['Entregados', (o) => o.status === 'entregado'],
  todos: ['Todos', () => true],
};

export default function PedidosTab({ state, actualizar }) {
  const [filtro, setFiltro] = useState('activos');
  // Ventana abierta: { tipo: 'pedido' | 'pago' | 'wa', id? }
  const [ventana, setVentana] = useState(null);
  const cerrar = () => setVentana(null);

  const porEntregar = state.orders.filter((o) => o.status !== 'entregado').length;
  const aCobrar = state.orders.reduce((s, o) => s + Math.max(0, saldoPedido(o)), 0);
  const demora = demoraDias(state.settings, unidadesPendientes(state));
  const lista = state.orders
    .filter(FILTROS[filtro][1])
    .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const pedido = ventana?.id && state.orders.find((o) => o.id === ventana.id);

  function avanzar(id) {
    const o = state.orders.find((x) => x.id === id);
    const siguiente = SIGUIENTE[o.status];
    actualizar((s) => {
      const x = s.orders.find((y) => y.id === id);
      x.status = siguiente;
      if (siguiente === 'entregado') x.delivered = hoy();
    }, `Pedido: ${ESTADOS[siguiente]}`);
  }

  return (
    <>
      <div className="cards">
        <div className="stat">
          <span>Por entregar</span>
          <strong>{porEntregar}</strong>
        </div>
        <div className="stat">
          <span>A cobrar</span>
          <strong>{pesos(aCobrar)}</strong>
        </div>
        <div className="stat">
          <span>Demora para pedidos nuevos</span>
          <strong>{demora} días</strong>
        </div>
      </div>
      <div className="toolbar">
        <div className="chips">
          {Object.entries(FILTROS).map(([k, [texto]]) => (
            <button key={k} className={`chip ${filtro === k ? 'on' : ''}`} onClick={() => setFiltro(k)}>
              {texto}
            </button>
          ))}
        </div>
        <button className="btn" data-act="nuevo-pedido" onClick={() => setVentana({ tipo: 'pedido' })}>
          + Nuevo pedido
        </button>
      </div>
      {lista.length ? (
        lista.map((o) => (
          <PedidoCard
            key={o.id}
            state={state}
            pedido={o}
            onAvanzar={() => avanzar(o.id)}
            onPago={() => setVentana({ tipo: 'pago', id: o.id })}
            onWhatsApp={() => setVentana({ tipo: 'wa', id: o.id })}
            onEditar={() => setVentana({ tipo: 'pedido', id: o.id })}
          />
        ))
      ) : (
        <p className="vacio">No hay pedidos acá.</p>
      )}

      {ventana?.tipo === 'pedido' && (
        <PedidoForm state={state} pedido={pedido} demora={demora} actualizar={actualizar} onClose={cerrar} />
      )}
      {ventana?.tipo === 'pago' && pedido && <PagoForm state={state} pedido={pedido} actualizar={actualizar} onClose={cerrar} />}
      {ventana?.tipo === 'wa' && pedido && <MensajesWhatsApp state={state} pedido={pedido} onClose={cerrar} />}
    </>
  );
}
