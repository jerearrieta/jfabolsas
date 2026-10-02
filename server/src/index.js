import app from './app.js';
import { config } from './config.js';

// En Vercel la app se usa como función; en local levanta un servidor.
if (!process.env.VERCEL) {
  app.listen(config.port, () => console.log(`API en http://localhost:${config.port}`));
}

export default app;
