'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { demoraDias } from '@/lib/demora';
import { pesos, fechaLarga } from '@/lib/formato';
import { linkNegocio } from '@/lib/whatsapp';

// Presupuesto al instante con los precios y la demora que publica el panel.
export default function Cotizador() {
  const [datos, setDatos] = useState(null);
  const [prodIdx, setProdIdx] = useState(0);
  const [medidaIdx, setMedidaIdx] = useState(0);
  const [cantidad, setCantidad] = useState('10');
  const [estampado, setEstampado] = useState(false);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    api.publico().then(setDatos).catch(() => setDatos(null));
  }, []);

  // Solo se ofrecen productos y medidas que tienen precio cargado.
  const productos = useMemo(
    () =>
      (datos?.products || [])
        .map((p) => ({ ...p, sizes: p.sizes.filter((s) => s.price > 0) }))
        .filter((p) => p.sizes.length),
    [datos]
  );

  if (!productos.length) return null;

  const p = productos[prodIdx] || productos[0];
  const s = p.sizes[medidaIdx] || p.sizes[0];
  const n = Math.max(1, parseInt(cantidad, 10) || 1);
  const unitario = s.price + (estampado ? p.printExtra : 0);
  const total = unitario * n;
  const dias = demoraDias(datos.settings, datos.pendientes || 0, n);
  const estampadoACotizar = estampado && !p.printExtra;

  let mensaje = `Hola! Quiero hacer este pedido: ${n} × ${p.name} ${s.label}${estampado ? ' con estampado' : ''}.`;
  mensaje += `\nPrecio según la web: ${pesos(unitario)} c/u, total ${pesos(total)}${estampadoACotizar ? ' (+ estampado a cotizar)' : ''}.`;
  mensaje += `\nEntrega estimada: ${dias} días.`;
  if (nombre.trim()) mensaje += `\nMi nombre es ${nombre.trim()}.`;

  return (
    <section id="cotizador">
      <div className="section-inner">
        <div className="pedido-layout">
          <div>
            <span className="section-label">Presupuesto al instante</span>
            <h2 className="section-title">Cotizá tu pedido</h2>
            <p className="section-sub" style={{ marginBottom: 0 }}>
              Elegí el producto, la medida y la cantidad. Te mostramos el precio y cuándo podemos entregarlo, y nos
              mandás el pedido armado por WhatsApp.
            </p>
            <p className="cot-letra">
              Precios actualizados al {datos.actualizado ? new Date(datos.actualizado).toLocaleDateString('es-AR') : 'día de hoy'}.
              La demora depende de los pedidos que tenemos en curso, y te la confirmamos por WhatsApp.
            </p>
          </div>
          <div className="pedido-form-card">
            <div className="form-group">
              <label htmlFor="cot-producto">Producto</label>
              <select
                id="cot-producto"
                value={prodIdx}
                onChange={(e) => {
                  setProdIdx(Number(e.target.value));
                  setMedidaIdx(0);
                }}
              >
                {productos.map((x, i) => (
                  <option key={x.name} value={i}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cot-medida">Medida</label>
                <select id="cot-medida" value={medidaIdx} onChange={(e) => setMedidaIdx(Number(e.target.value))}>
                  {p.sizes.map((x, i) => (
                    <option key={x.label} value={i}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="cot-cantidad">Cantidad</label>
                <input
                  id="cot-cantidad"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                />
              </div>
            </div>
            <label className="cot-check">
              <input id="cot-estampado" type="checkbox" checked={estampado} onChange={(e) => setEstampado(e.target.checked)} />{' '}
              Con estampado (logo o diseño)
            </label>
            <div className="cot-resultado">
              <div>
                <span>Precio por unidad</span>
                <b id="cot-unitario">{pesos(unitario)}</b>
              </div>
              <div>
                <span>Total</span>
                <b id="cot-total">{pesos(total)}</b>
              </div>
              <div className="cot-full">
                <span>Entrega estimada</span>
                <b id="cot-demora">
                  {dias} días (aprox. {fechaLarga(dias)})
                </b>
              </div>
              {estampadoACotizar && <p className="cot-letra">El estampado de este producto se cotiza aparte.</p>}
            </div>
            <div className="form-group">
              <label htmlFor="cot-nombre">Tu nombre (opcional)</label>
              <input id="cot-nombre" type="text" placeholder="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <a id="cot-enviar" className="btn-send-wa" href={linkNegocio(mensaje)} target="_blank" rel="noopener">
              Pedir por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
