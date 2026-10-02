'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ErrorSesion } from '@/lib/api';

const KEY_SESION = 'jfa-sesion';

function leerSesion() {
  try {
    return JSON.parse(localStorage.getItem(KEY_SESION));
  } catch {
    return null;
  }
}

function guardarSesion(s) {
  if (!s) return localStorage.removeItem(KEY_SESION);
  const sesion = { ...s, expira: Date.now() + ((s.expiresIn || 3600) - 60) * 1000 };
  localStorage.setItem(KEY_SESION, JSON.stringify(sesion));
  return sesion;
}

// Estado del panel: sesión, datos y guardado en la API.
export function useAdmin() {
  const [fase, setFase] = useState('cargando'); // cargando | login | listo | error
  const [aviso, setAviso] = useState('');
  const [state, setState] = useState(null);
  const [toast, setToast] = useState('');
  const sesion = useRef(null);
  const timerGuardar = useRef(null);
  const timerToast = useRef(null);

  const mostrar = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timerToast.current);
    timerToast.current = setTimeout(() => setToast(''), 2200);
  }, []);

  const pedirLogin = useCallback((msg = '') => {
    sesion.current = null;
    guardarSesion(null);
    setAviso(msg);
    setFase('login');
  }, []);

  const token = useCallback(async () => {
    const s = sesion.current;
    if (s && Date.now() > s.expira) sesion.current = guardarSesion(await api.renovar(s.refreshToken));
    return sesion.current?.accessToken;
  }, []);

  const cargar = useCallback(async () => {
    try {
      setState(await api.leerEstado(await token()));
      setFase('listo');
    } catch (e) {
      if (e instanceof ErrorSesion) pedirLogin('Tu sesión venció. Volvé a entrar.');
      else setFase('error');
    }
  }, [token, pedirLogin]);

  useEffect(() => {
    sesion.current = leerSesion();
    if (!sesion.current) setFase('login');
    else cargar();
  }, [cargar]);

  const login = useCallback(
    async (email, password) => {
      try {
        sesion.current = guardarSesion(await api.login(email, password));
      } catch {
        setAviso('Email o contraseña incorrectos.');
        return;
      }
      setAviso('');
      setFase('cargando');
      cargar();
    },
    [cargar]
  );

  const logout = useCallback(() => pedirLogin(), [pedirLogin]);

  // Sube los cambios agrupando los que se hacen seguidos en un solo envío.
  const programarGuardado = useCallback(
    (nuevo) => {
      clearTimeout(timerGuardar.current);
      timerGuardar.current = setTimeout(async () => {
        try {
          await api.guardarEstado(await token(), nuevo);
        } catch (e) {
          if (e instanceof ErrorSesion) pedirLogin('Tu sesión venció. Volvé a entrar y repetí el último cambio.');
          else mostrar('No se pudo guardar. Revisá la conexión.');
        }
      }, 600);
    },
    [token, pedirLogin, mostrar]
  );

  // Cada cambio hecho desde el panel (no la carga inicial) se sube a la API.
  const sinGuardar = useRef(false);
  useEffect(() => {
    if (!sinGuardar.current) return;
    sinGuardar.current = false;
    programarGuardado(state);
  }, [state, programarGuardado]);

  // Aplica un cambio sobre una copia de los datos y opcionalmente avisa.
  const actualizar = useCallback(
    (cambio, msg) => {
      sinGuardar.current = true;
      setState((previo) => {
        const nuevo = structuredClone(previo);
        cambio(nuevo);
        return nuevo;
      });
      if (msg) mostrar(msg);
    },
    [mostrar]
  );

  const reemplazar = useCallback(
    (data, msg) => {
      sinGuardar.current = true;
      setState(data);
      if (msg) mostrar(msg);
    },
    [mostrar]
  );

  return { fase, aviso, state, toast, mostrar, login, logout, actualizar, reemplazar };
}
