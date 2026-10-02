import { hoy } from '@/lib/formato';

function esValido(d) {
  return d && Array.isArray(d.products) && Array.isArray(d.orders) && Array.isArray(d.clients);
}

export default function DatosTab({ state, reemplazar, mostrar, logout }) {
  function descargar() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jfa-bolsas-${hoy()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function cargar(e) {
    const archivo = e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      const data = JSON.parse(await archivo.text());
      if (!esValido(data)) throw new Error('formato');
      if (!confirm('Esto reemplaza todos los datos del panel por los de la copia. ¿Seguir?')) return;
      reemplazar({ ...state, ...data }, 'Copia cargada');
    } catch {
      mostrar('Ese archivo no es una copia válida');
    }
  }

  return (
    <>
      <section className="panel">
        <h2>Copia de seguridad</h2>
        <p className="muted">
          Los datos se guardan en la nube y se ven igual desde cualquier dispositivo. Igual conviene descargar una copia
          cada tanto.
        </p>
        <div className="acciones">
          <button className="btn" onClick={descargar}>
            Descargar copia
          </button>
          <label className="btn sec">
            Cargar copia <input type="file" accept="application/json" hidden onChange={cargar} />
          </label>
        </div>
      </section>
      <section className="panel">
        <h2>Sesión</h2>
        <button className="btn sec" onClick={logout}>
          Cerrar sesión
        </button>
      </section>
    </>
  );
}
