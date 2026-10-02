import { Router } from 'express';
import { leerFila } from '../services/supabase.js';

const router = Router();

// Precios y carga de trabajo para el cotizador. No requiere sesión.
router.get('/', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'public, max-age=30');
    res.json(await leerFila('publico'));
  } catch (e) {
    next(e);
  }
});

export default router;
