import { Router } from 'express';
import { iniciarSesion, renovarSesion } from '../services/supabase.js';

const router = Router();

function sesion(s) {
  return { accessToken: s.access_token, refreshToken: s.refresh_token, expiresIn: s.expires_in };
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Faltan email o contraseña' });
  try {
    res.json(sesion(await iniciarSesion(email, password)));
  } catch {
    res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'Falta el refreshToken' });
  try {
    res.json(sesion(await renovarSesion(refreshToken)));
  } catch {
    res.status(401).json({ error: 'La sesión venció' });
  }
});

export default router;
