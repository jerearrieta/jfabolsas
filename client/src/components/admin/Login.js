'use client';

import { useState } from 'react';

export default function Login({ aviso, onLogin }) {
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      id="form-login"
      className="panel login"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setEnviando(true);
        await onLogin(f.get('email'), f.get('password'));
        setEnviando(false);
      }}
    >
      <h2>Entrar al panel</h2>
      {aviso && <p className="aviso">{aviso}</p>}
      <label>
        Email <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Contraseña <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="btn" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
