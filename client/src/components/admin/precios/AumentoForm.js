import { buscarProducto } from '@/lib/negocio';
import { fechaCorta, hoy, numero, pesos } from '@/lib/formato';

// Sube todos los precios (o los de un producto) por porcentaje o monto fijo, con deshacer.
export default function AumentoForm({ state, actualizar }) {
  const ultimo = state.priceHistory[state.priceHistory.length - 1];

  function aplicar(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const valor = numero(f.get('valor'));
    const tipo = f.get('tipo');
    const alcance = f.get('alcance');
    const redondeo = numero(f.get('redondeo')) || 1;
    if (!valor) return;
    const label = `${tipo === 'pct' ? valor + '%' : pesos(valor)} a ${alcance ? buscarProducto(state, alcance).name : 'todos'}`;

    actualizar((s) => {
      const prods = s.products.filter((p) => !alcance || p.id === alcance);
      const antes = prods.flatMap((p) => [[p.id, null, p.printExtra], ...p.sizes.map((x) => [p.id, x.id, x.price])]);
      const subir = (precio) => {
        if (!precio) return precio;
        const nuevo = tipo === 'pct' ? precio * (1 + valor / 100) : precio + valor;
        return Math.max(0, Math.round(nuevo / redondeo) * redondeo);
      };
      prods.forEach((p) => {
        p.sizes.forEach((x) => (x.price = subir(x.price)));
        // Un aumento en $ fijos es por bolsa; el extra de estampado sube solo con porcentaje.
        if (tipo === 'pct') p.printExtra = subir(p.printExtra);
      });
      s.priceHistory.push({ date: hoy(), label, antes });
    }, `Aumento aplicado: ${label}`);
    e.currentTarget.reset();
  }

  function deshacer() {
    actualizar((s) => {
      const h = s.priceHistory.pop();
      h?.antes.forEach(([pid, sid, precio]) => {
        const p = s.products.find((x) => x.id === pid);
        if (!p) return;
        if (sid === null) p.printExtra = precio;
        const talle = p.sizes.find((x) => x.id === sid);
        if (talle) talle.price = precio;
      });
    }, 'Aumento deshecho');
  }

  return (
    <section className="panel">
      <h2>Aplicar un aumento</h2>
      <p className="muted">Cambia todos los precios de una vez. Podés deshacerlo si te equivocás.</p>
      <form id="form-aumento" className="aumento" onSubmit={aplicar}>
        <label>
          Aumento
          <div className="input-unidad">
            <input name="valor" type="number" step="any" inputMode="decimal" required placeholder="10" />
            <select name="tipo">
              <option value="pct">%</option>
              <option value="monto">$ fijos</option>
            </select>
          </div>
        </label>
        <label>
          A qué productos
          <select name="alcance">
            <option value="">Todos</option>
            {state.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Redondear a
          <select name="redondeo" defaultValue="100">
            <option value="1">Sin redondeo</option>
            <option value="10">$10</option>
            <option value="50">$50</option>
            <option value="100">$100</option>
          </select>
        </label>
        <button className="btn">Aplicar aumento</button>
      </form>
      {ultimo && (
        <p className="muted">
          Último: {ultimo.label} el {fechaCorta(ultimo.date)} ·{' '}
          <button type="button" className="link" data-act="deshacer-aumento" onClick={deshacer}>
            Deshacer
          </button>
        </p>
      )}
    </section>
  );
}
