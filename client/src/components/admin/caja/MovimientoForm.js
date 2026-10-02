import Modal, { Acciones } from '../Modal';
import { CATEGORIAS, uid } from '@/lib/negocio';
import { hoy, numero } from '@/lib/formato';

// Carga un gasto o una venta que no pasó por un pedido (por ejemplo, una feria).
export default function MovimientoForm({ tipo, actualizar, onGuardado, onClose }) {
  const gasto = tipo === 'gasto';

  function guardar(f) {
    const mov = { id: uid(), date: f.get('fecha') || hoy(), concepto: f.get('concepto').trim(), amount: numero(f.get('monto')) };
    actualizar((s) => {
      if (gasto) s.expenses.push({ ...mov, category: f.get('cat') });
      else s.incomes.push(mov);
    }, gasto ? 'Gasto cargado' : 'Venta cargada');
    onGuardado(mov.date);
    onClose();
  }

  return (
    <Modal onClose={onClose} onSubmit={guardar}>
      <h2>{gasto ? 'Nuevo gasto' : 'Venta suelta'}</h2>
      <label>
        {gasto ? 'Qué compraste' : 'Qué vendiste'}{' '}
        <input name="concepto" required placeholder={gasto ? 'Ej. 10 m de lienzo' : 'Ej. 3 tote bags en feria'} />
      </label>
      <div className="row2">
        <label>
          Monto <input name="monto" type="number" min="0" inputMode="decimal" required />
        </label>
        <label>
          Fecha <input name="fecha" type="date" defaultValue={hoy()} />
        </label>
      </div>
      {gasto && (
        <label>
          Categoría
          <select name="cat">
            {CATEGORIAS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      )}
      <Acciones onClose={onClose} />
    </Modal>
  );
}
