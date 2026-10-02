import { Router } from 'express';
import { requiereSesion } from '../middleware/auth.js';
import { leerFila, guardarFila } from '../services/supabase.js';
import { normalizar, esEstadoValido, datosPublicos } from '../negocio/estado.js';

const router = Router();
router.use(requiereSesion);

// Todo lo del panel: pedidos, clientes, pagos, gastos y precios.
router.get('/', async (req, res, next) => {
  try {
    res.json(normalizar(await leerFila('estado', req.token)));
  } catch (e) {
    next(e);
  }
});

// Guarda el panel y, de paso, actualiza lo que muestra el cotizador de la página.
router.put('/', async (req, res, next) => {
  if (!esEstadoValido(req.body)) return res.status(400).json({ error: 'Datos con formato inválido' });
  try {
    const state = normalizar(req.body);
    await guardarFila('estado', state, req.token);
    await guardarFila('publico', datosPublicos(state), req.token);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
