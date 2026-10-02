'use client';

import { useState } from 'react';
import { useAdmin } from './useAdmin';
import Login from './Login';
import PedidosTab from './pedidos/PedidosTab';
import ClientesTab from './ClientesTab';
import PreciosTab from './precios/PreciosTab';
import CajaTab from './caja/CajaTab';
import DatosTab from './DatosTab';

const PESTANAS = [
  ['pedidos', 'Pedidos'],
  ['clientes', 'Clientes'],
  ['precios', 'Precios'],
  ['caja', 'Caja'],
  ['datos', 'Datos'],
];

export default function AdminApp() {
  const admin = useAdmin();
  const [tab, setTab] = useState('pedidos');
  const { fase, state, actualizar, mostrar } = admin;

  let contenido;
  if (fase === 'cargando') contenido = <p className="vacio">Cargando…</p>;
  else if (fase === 'login') contenido = <Login aviso={admin.aviso} onLogin={admin.login} />;
  else if (fase === 'error')
    contenido = <p className="vacio">No se pudieron cargar los datos. Revisá la conexión y recargá la página.</p>;
  else {
    const props = { state, actualizar, mostrar };
    contenido = {
      pedidos: <PedidosTab {...props} />,
      clientes: <ClientesTab {...props} />,
      precios: <PreciosTab {...props} />,
      caja: <CajaTab {...props} />,
      datos: <DatosTab {...props} reemplazar={admin.reemplazar} logout={admin.logout} />,
    }[tab];
  }

  return (
    <>
      <header className="top">
        <div className="logo">
          JFA <span>Bolsas</span> <small>Panel</small>
        </div>
        {fase === 'listo' && (
          <nav className="tabs" role="tablist">
            {PESTANAS.map(([k, texto]) => (
              <button key={k} data-tab={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
                {texto}
              </button>
            ))}
          </nav>
        )}
      </header>
      <main id="app">{contenido}</main>
      <div id="toast" role="status" className={admin.toast ? 'show' : ''}>
        {admin.toast}
      </div>
    </>
  );
}
