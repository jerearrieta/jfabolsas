// Prueba la API completa contra un Supabase falso que corre en memoria.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

const db = {};
const supabase = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const url = new URL(req.url, 'http://x');
    const json = (status, data) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(data === undefined ? '' : JSON.stringify(data));
    };
    if (url.pathname === '/auth/v1/token') {
      const b = JSON.parse(body);
      if (b.password === 'secreto' || b.refresh_token === 'r1') {
        return json(200, { access_token: 'tok', refresh_token: 'r2', expires_in: 3600 });
      }
      return json(400, { error: 'invalid_grant' });
    }
    const tabla = url.pathname.split('/')[3];
    const auth = req.headers.authorization;
    if (tabla === 'estado' && auth !== 'Bearer tok') return json(401, {});
    if (req.method === 'GET') return json(200, db[tabla] ? [{ data: db[tabla] }] : []);
    if (req.method === 'POST') {
      if (auth !== 'Bearer tok') return json(401, {});
      db[tabla] = JSON.parse(body).data;
      return json(201);
    }
    json(404, {});
  });
});

let api;
let base;

before(async () => {
  await new Promise((r) => supabase.listen(0, r));
  process.env.SUPABASE_URL = `http://localhost:${supabase.address().port}`;
  process.env.SUPABASE_ANON_KEY = 'anon';
  process.env.CLIENT_ORIGIN = 'https://jfabolsas.vercel.app, https://jfabolsas-*-equipo.vercel.app';
  process.env.VERCEL = '1'; // que src/index.js no levante su propio servidor
  const { default: app } = await import('../src/index.js');
  api = app.listen(0);
  await new Promise((r) => api.once('listening', r));
  base = `http://localhost:${api.address().port}/api`;
});

after(() => {
  api.close();
  supabase.close();
});

const pedir = (ruta, { token, body, method } = {}) =>
  fetch(base + ruta, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body && JSON.stringify(body),
  });

test('login correcto devuelve la sesión y uno incorrecto da 401', async () => {
  const ok = await pedir('/auth/login', { body: { email: 'papa@x.com', password: 'secreto' } });
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { accessToken: 'tok', refreshToken: 'r2', expiresIn: 3600 });
  const mal = await pedir('/auth/login', { body: { email: 'papa@x.com', password: 'otra' } });
  assert.equal(mal.status, 401);
});

test('renovar la sesión', async () => {
  const r = await pedir('/auth/refresh', { body: { refreshToken: 'r1' } });
  assert.equal((await r.json()).accessToken, 'tok');
});

test('el panel exige sesión', async () => {
  assert.equal((await pedir('/estado')).status, 401);
  assert.equal((await pedir('/estado', { token: 'vencido' })).status, 401);
});

test('guardar el panel actualiza también los datos públicos', async () => {
  const inicial = await (await pedir('/estado', { token: 'tok' })).json();
  assert.equal(inicial.products.length, 6);

  inicial.products[2].sizes[2].price = 9000;
  inicial.products[2].printExtra = 800;
  inicial.settings = { baseDays: 2, unitsPerDay: 10 };
  inicial.clients.push({ id: 'c1', name: 'Ana', phone: '351' });
  inicial.orders.push({ id: 'o1', clientId: 'c1', status: 'pendiente', items: [{ qty: 25, unitPrice: 9800 }], payments: [] });

  const r = await pedir('/estado', { token: 'tok', method: 'PUT', body: inicial });
  assert.equal(r.status, 200);

  const guardado = await (await pedir('/estado', { token: 'tok' })).json();
  assert.equal(guardado.orders.length, 1);

  const publico = await (await pedir('/publico')).json();
  assert.equal(publico.pendientes, 25);
  assert.equal(publico.products[2].sizes[2].price, 9000);
  assert.equal(publico.products[2].printExtra, 800);
  assert.ok(!JSON.stringify(publico).includes('Ana'));
});

test('rechaza datos con formato inválido', async () => {
  const r = await pedir('/estado', { token: 'tok', method: 'PUT', body: { hola: 1 } });
  assert.equal(r.status, 400);
});

test('deja entrar a la página y a sus vistas previas, a nadie más', async () => {
  const origen = async (o) =>
    (await fetch(base + '/salud', { headers: { origin: o } })).headers.get('access-control-allow-origin');
  assert.equal(await origen('https://jfabolsas.vercel.app'), 'https://jfabolsas.vercel.app');
  assert.equal(await origen('https://jfabolsas-git-rama-equipo.vercel.app'), 'https://jfabolsas-git-rama-equipo.vercel.app');
  assert.equal(await origen('https://otra.vercel.app'), null);
  assert.equal(await origen('https://jfabolsas-x.vercel.app.malo.com'), null);
});
