import { demoraDias, unidadesPendientes } from '@/lib/demora';
import { numero } from '@/lib/formato';

export default function DemoraAjustes({ state, actualizar }) {
  const pendientes = unidadesPendientes(state);

  function cambiar(campo, valor) {
    const v = Math.max(campo === 'unitsPerDay' ? 1 : 0, numero(valor));
    if (v === state.settings[campo]) return;
    actualizar((s) => (s.settings[campo] = v), 'Demora guardada');
  }

  return (
    <section className="panel">
      <h2>Demora de entrega</h2>
      <p className="muted">
        Se calcula sola con las bolsas que faltan entregar: días mínimos + bolsas pendientes ÷ bolsas por día.
      </p>
      <div className="row2">
        <label>
          Días mínimos{' '}
          <input
            key={`bd-${state.settings.baseDays}`}
            type="number"
            min="0"
            data-ajuste="baseDays"
            defaultValue={state.settings.baseDays}
            onBlur={(e) => cambiar('baseDays', e.target.value)}
          />
        </label>
        <label>
          Bolsas que hace por día{' '}
          <input
            key={`upd-${state.settings.unitsPerDay}`}
            type="number"
            min="1"
            data-ajuste="unitsPerDay"
            defaultValue={state.settings.unitsPerDay}
            onBlur={(e) => cambiar('unitsPerDay', e.target.value)}
          />
        </label>
      </div>
      <p className="demora-hoy">
        Hoy tiene <b>{pendientes}</b> bolsas pendientes, así que un pedido nuevo sale en{' '}
        <b>{demoraDias(state.settings, pendientes)} días</b>.
      </p>
    </section>
  );
}
