// Exige el token de sesión del panel en el encabezado Authorization.
export function requiereSesion(req, res, next) {
  const [tipo, token] = (req.get('authorization') || '').split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ error: 'Falta iniciar sesión' });
  req.token = token;
  next();
}
