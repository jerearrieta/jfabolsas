'use client';

import { useState } from 'react';
import MovimientoForm from './MovimientoForm';
import { CATEGORIAS, buscarCliente, detalleItems, totalPedido } from '@/lib/negocio';
import { fechaCorta, hoy, pesos } from '@/lib/formato';

export default function CajaTab({ state, actualizar }) {
  const [mes, setMes] = useState(hoy().slice(0, 7));
  const [nuevo, setNuevo] = useState(null); // 'gasto' | 'ingreso'

  const delMes = (d) => d && d.startsWith(mes);
  const ingresos = [
    ...state.orders.flatMap((o) =>
      o.payments
        .filter((p) => delMes(p.date))
        .map((p) => ({
          id: p.id,
          date: p.date,
          concepto: `${buscarCliente(state, o.clientId)?.name || ''} · ${detalleItems(o)}`,
          detalle: p.method,
          amount: p.amount,
        }))
    ),
    ...state.incomes.filter((i) => delMes(i.date)).map((i) => ({ ...i, detalle: 'Venta suelta', suelta: true })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const gastos = state.expenses.filter((e) => delMes(e.date)).sort((a, b) => b.date.localeCompare(a.date));
  const vendido =
    state.orders.filter((o) => delMes(o.created)).reduce((s, o) => s + totalPedido(o), 0) +
    state.incomes.filter((i) => delMes(i.date)).reduce((s, i) => s + i.amount, 0);
  const cobrado = ingresos.reduce((s, i) => s + i.amount, 0);
  const gastado = gastos.reduce((s, g) => s + g.amount, 0);
  const porCategoria = CATEGORIAS.map((c) => [c, gastos.filter((g) => g.category === c).reduce((s, g) => s + g.amount, 0)]).filter(
    ([, v]) => v
  );

  function borrar(lista, id, texto) {
    if (!confirm(`¿Borrar ${texto}?`)) return;
    actualizar((s) => {
      s[lista] = s[lista].filter((x) => x.id !== id);
    }, lista === 'expenses' ? 'Gasto borrado' : 'Venta borrada');
  }

  return (
    <>
      <div className="toolbar">
        <label className="inline">
          Mes <input type="month" id="mes" value={mes} onChange={(e) => setMes(e.target.value || hoy().slice(0, 7))} />
        </label>
        <span>
          <button className="btn sm sec" onClick={() => setNuevo('ingreso')}>
            + Venta suelta
          </button>{' '}
          <button className="btn sm" data-act="nuevo-gasto" onClick={() => setNuevo('gasto')}>
            + Gasto
          </button>
        </span>
      </div>
      <div className="cards">
        <div className="stat">
          <span>Vendido</span>
          <strong>{pesos(vendido)}</strong>
          <small>pedidos tomados en el mes</small>
        </div>
        <div className="stat">
          <span>Cobrado</span>
          <strong>{pesos(cobrado)}</strong>
        </div>
        <div className="stat">
          <span>Gastado</span>
          <strong>{pesos(gastado)}</strong>
        </div>
        <div className={`stat ${cobrado - gastado >= 0 ? 'pos' : 'neg'}`}>
          <span>Quedó</span>
          <strong>{pesos(cobrado - gastado)}</strong>
          <small>cobrado − gastado</small>
        </div>
      </div>
      {porCategoria.length > 0 && (
        <p className="muted">Gastos: {porCategoria.map(([c, v]) => `${c} ${pesos(v)}`).join(' · ')}</p>
      )}
      <section className="panel">
        <h2>Cobros</h2>
        {ingresos.length ? (
          <ul className="movs">
            {ingresos.map((i) => (
              <li key={i.id}>
                <span>{fechaCorta(i.date)}</span>
                <span>
                  {i.concepto} <small className="muted">{i.detalle}</small>
                </span>
                <b className="ok">{pesos(i.amount)}</b>
                {i.suelta ? (
                  <button className="x" aria-label="Borrar" onClick={() => borrar('incomes', i.id, 'esta venta')}>
                    ×
                  </button>
                ) : (
                  <span />
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="vacio">Sin cobros este mes.</p>
        )}
      </section>
      <section className="panel">
        <h2>Gastos</h2>
        {gastos.length ? (
          <ul className="movs">
            {gastos.map((g) => (
              <li key={g.id}>
                <span>{fechaCorta(g.date)}</span>
                <span>
                  {g.concepto} <small className="muted">{g.category}</small>
                </span>
                <b className="debe">{pesos(g.amount)}</b>
                <button className="x" aria-label="Borrar" onClick={() => borrar('expenses', g.id, 'este gasto')}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="vacio">Sin gastos este mes.</p>
        )}
      </section>
      {nuevo && (
        <MovimientoForm
          tipo={nuevo}
          actualizar={actualizar}
          onGuardado={(fecha) => setMes(fecha.slice(0, 7))}
          onClose={() => setNuevo(null)}
        />
      )}
    </>
  );
}
