import { ESTADOS, SIGUIENTE, buscarCliente, detalleItems, saldoPedido, totalPedido } from '@/lib/negocio';
import { fechaCorta, hoy, pesos } from '@/lib/formato';

export default function PedidoCard({ state, pedido: o, onAvanzar, onPago, onWhatsApp, onEditar }) {
  const c = buscarCliente(state, o.clientId) || { name: '(sin cliente)' };
  const total = totalPedido(o);
  const saldo = saldoPedido(o);
  const atrasado = o.status !== 'entregado' && o.dueDate && o.dueDate < hoy();
  const siguiente = SIGUIENTE[o.status];

  return (
    <article className={`pedido ${o.status}`}>
      <div className="pedido-top">
        <div>
          <h3>{c.name}</h3>
          <p className="muted">{detalleItems(o)}</p>
          {o.notes && <p className="muted nota">{o.notes}</p>}
        </div>
        <span className={`badge ${o.status}`}>{ESTADOS[o.status]}</span>
      </div>
      <div className="pedido-nums">
        <div>
          <span>Total</span>
          <b>{pesos(total)}</b>
        </div>
        <div>
          <span>Pagó</span>
          <b>{pesos(total - saldo)}</b>
        </div>
        <div>
          <span>Saldo</span>
          <b className={saldo > 0 ? 'debe' : 'ok'}>{pesos(saldo)}</b>
        </div>
        <div>
          <span>Entrega</span>
          <b className={atrasado ? 'debe' : ''}>{fechaCorta(o.dueDate) || '—'}</b>
        </div>
      </div>
      <div className="acciones">
        {siguiente && (
          <button className="btn sm" data-act="avanzar" onClick={onAvanzar}>
            Pasar a: {ESTADOS[siguiente]}
          </button>
        )}
        {saldo > 0 && (
          <button className="btn sm sec" data-act="pago" onClick={onPago}>
            Registrar pago
          </button>
        )}
        <button className="btn sm sec" data-act="wa" onClick={onWhatsApp}>
          WhatsApp
        </button>
        <button className="btn sm sec" data-act="editar-pedido" onClick={onEditar}>
          Editar
        </button>
      </div>
    </article>
  );
}
