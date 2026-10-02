import { uid } from '@/lib/negocio';
import { numero } from '@/lib/formato';

// Cada precio se guarda al salir del campo. La key incluye el precio para que un aumento
// refresque lo que se ve.
export default function ListaPrecios({ state, actualizar, mostrar }) {
  function cambiarPrecio(pid, sid, valor) {
    const p = state.products.find((x) => x.id === pid);
    const actual = sid ? p.sizes.find((x) => x.id === sid).price : p.printExtra;
    if (numero(valor) === (actual || 0)) return;
    actualizar((s) => {
      const prod = s.products.find((x) => x.id === pid);
      if (sid) prod.sizes.find((x) => x.id === sid).price = numero(valor);
      else prod.printExtra = numero(valor);
    });
    mostrar(sid ? 'Precio guardado' : 'Extra guardado');
  }

  function nuevoProducto() {
    const name = prompt('Nombre del producto')?.trim();
    if (name) actualizar((s) => s.products.push({ id: uid(), name, printExtra: 0, sizes: [] }), 'Producto agregado');
  }

  function nuevaMedida(pid) {
    const label = prompt('Medida (ej. 30×40 cm)')?.trim();
    if (label) actualizar((s) => s.products.find((p) => p.id === pid).sizes.push({ id: uid(), label, price: 0 }), 'Medida agregada');
  }

  function borrarMedida(p, talle) {
    if (!confirm(`¿Borrar la medida ${talle.label} de ${p.name}?`)) return;
    actualizar((s) => {
      const prod = s.products.find((x) => x.id === p.id);
      prod.sizes = prod.sizes.filter((x) => x.id !== talle.id);
    }, 'Medida borrada');
  }

  function borrarProducto(p) {
    if (!confirm(`¿Borrar ${p.name} con todas sus medidas?`)) return;
    actualizar((s) => {
      s.products = s.products.filter((x) => x.id !== p.id);
    }, 'Producto borrado');
  }

  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Lista de precios</h2>
        <button className="btn sm sec" onClick={nuevoProducto}>
          + Producto
        </button>
      </div>
      <p className="muted">Tocá un precio para cambiarlo. Se guarda solo.</p>
      {state.products.map((p) => (
        <div className="producto" key={p.id}>
          <div className="producto-head">
            <h3>{p.name}</h3>
            <span>
              <button className="link" onClick={() => nuevaMedida(p.id)}>
                + medida
              </button>{' '}
              <button className="link danger" onClick={() => borrarProducto(p)}>
                borrar
              </button>
            </span>
          </div>
          <label className="extra">
            Extra por estampado (c/u)
            <input
              key={`extra-${p.printExtra}`}
              type="number"
              min="0"
              inputMode="decimal"
              placeholder="$"
              data-extra={p.id}
              defaultValue={p.printExtra || ''}
              onBlur={(e) => cambiarPrecio(p.id, null, e.target.value)}
            />
          </label>
          <div className="precios">
            {p.sizes.map((s) => (
              <label className="precio" key={s.id}>
                <span>{s.label}</span>
                <input
                  key={`${s.id}-${s.price}`}
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="$"
                  data-precio={`${p.id}|${s.id}`}
                  defaultValue={s.price || ''}
                  onBlur={(e) => cambiarPrecio(p.id, s.id, e.target.value)}
                />
                <button type="button" className="x" aria-label="Borrar medida" onClick={() => borrarMedida(p, s)}>
                  ×
                </button>
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
