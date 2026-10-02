import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { ErrorSupabase } from './services/supabase.js';
import auth from './routes/auth.js';
import estado from './routes/estado.js';
import publico from './routes/publico.js';

const app = express();

app.use(cors({ origin: config.clientOrigins }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/salud', (req, res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.use('/api/estado', estado);
app.use('/api/publico', publico);

app.use((req, res) => res.status(404).json({ error: 'No existe' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ErrorSupabase && err.status === 401) {
    return res.status(401).json({ error: 'La sesión venció' });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
  console.error(err);
  res.status(502).json({ error: 'No se pudo conectar con la base de datos' });
});

export default app;
