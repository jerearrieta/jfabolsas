'use client';

import { useState } from 'react';
import { tiposProducto } from '@/data/catalogo';
import { linkNegocio } from '@/lib/whatsapp';

const caracteristicas = [
  'Diseños personalizados para tu marca o evento.',
  'Corte y confección a la medida.',
  'Tela de lienzo resistente y duradera.',
];

export default function PedidoEspecial() {
  const [form, setForm] = useState({ nombre: '', ancho: '', alto: '', tipo: '', detalles: '' });
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function enviar() {
    const f = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim()]));
    let msg = 'Hola! Quisiera hacer una consulta por un pedido a medida.';
    if (f.nombre) msg += `\n\nNombre: ${f.nombre}`;
    if (f.tipo) msg += `\nProducto: ${f.tipo}`;
    if (f.ancho && f.alto) msg += `\nMedidas: ${f.ancho} x ${f.alto} cm`;
    if (f.detalles) msg += `\nDetalles: ${f.detalles}`;
    window.open(linkNegocio(msg), '_blank');
  }

  return (
    <section id="pedido-especial">
      <div className="section-inner">
        <div className="pedido-layout">
          <div>
            <span className="section-label">Personalizado</span>
            <h2 className="section-title">¿Necesitás una medida especial?</h2>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              No hay problema. Trabajamos pedidos a medida para que tu bolsa sea exactamente como la necesitás.
            </p>
            <ul className="pedido-features">
              {caracteristicas.map((c) => (
                <li key={c}>
                  <span className="feat-dot" /> {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="pedido-form-card">
            <h4>Contanos tu idea</h4>
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" type="text" placeholder="Tu nombre" value={form.nombre} onChange={cambiar('nombre')} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ancho">Ancho (cm)</label>
                <input id="ancho" type="text" placeholder="Ej. 30" value={form.ancho} onChange={cambiar('ancho')} />
              </div>
              <div className="form-group">
                <label htmlFor="alto">Alto (cm)</label>
                <input id="alto" type="text" placeholder="Ej. 40" value={form.alto} onChange={cambiar('alto')} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="tipo">Tipo de producto</label>
              <select id="tipo" value={form.tipo} onChange={cambiar('tipo')}>
                <option value="">Seleccioná un producto</option>
                {tiposProducto.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="detalles">Detalles del pedido</label>
              <textarea
                id="detalles"
                placeholder="Material, colores, logo, cantidad, etc."
                value={form.detalles}
                onChange={cambiar('detalles')}
              />
            </div>
            <button type="button" className="btn-send-wa" onClick={enviar}>
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
