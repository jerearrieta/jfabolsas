import Modal, { Acciones } from '../Modal';
import { METODOS, buscarCliente, saldoPedido, totalPedido, uid } from '@/lib/negocio';
import { fechaCorta, hoy, numero, pesos } from '@/lib/formato';

export default function PagoForm({ state, pedido, actualizar, onClose }) {
  const c = buscarCliente(state, pedido.clientId);

  function guardar(f) {
    actualizar((s) => {
      s.orders
        .find((o) => o.id === pedido.id)
        .payments.push({ id: uid(), date: f.get('fecha') || hoy(), amount: numero(f.get('monto')), method: f.get('metodo') });
    }, 'Pago registrado');
    onClose();
  }

  return (
    <Modal onClose={onClose} onSubmit={guardar}>
      <h2>Pago de {c?.name}</h2>
      <p className="muted">
        Debe {pesos(saldoPedido(pedido))} de {pesos(totalPedido(pedido))}
      </p>
      {pedido.payments.length > 0 && (
        <ul className="pagos">
          {pedido.payments.map((p) => (
            <li key={p.id}>
              {fechaCorta(p.date)} · {p.method} <b>{pesos(p.amount)}</b>
            </li>
          ))}
        </ul>
      )}
      <div className="row2">
        <label>
          Monto{' '}
          <input name="monto" type="number" min="1" inputMode="decimal" defaultValue={Math.max(0, saldoPedido(pedido))} required />
        </label>
        <label>
          Fecha <input name="fecha" type="date" defaultValue={hoy()} />
        </label>
      </div>
      <label>
        Forma de pago
        <select name="metodo">
          {METODOS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <Acciones onClose={onClose} textoOk="Registrar" />
    </Modal>
  );
}
