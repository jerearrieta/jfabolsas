'use client';

import { useEffect, useRef } from 'react';

// Ventana emergente con el formulario adentro. Se cierra con Escape o con onClose.
export default function Modal({ children, onClose, onSubmit }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <form
        id="dlg-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.(new FormData(e.currentTarget));
        }}
      >
        {children}
      </form>
    </dialog>
  );
}

// Botones del pie: Cancelar y el de confirmar, o solo Cerrar si no hay nada que confirmar.
export function Acciones({ onClose, textoOk = 'Guardar', children }) {
  return (
    <div className="dlg-actions">
      {children}
      <button type="button" className="btn sec" onClick={onClose}>
        {textoOk ? 'Cancelar' : 'Cerrar'}
      </button>
      {textoOk && (
        <button type="submit" className="btn">
          {textoOk}
        </button>
      )}
    </div>
  );
}
