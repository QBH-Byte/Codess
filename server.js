const express = require('express');
const path = require('path');
const { load, save, getNextId, nowStr } = require('./database');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.post('/api/orders', (req, res) => {
  const { chef, item, quantity, unit, note } = req.body;
  if (!chef || !item || quantity == null) {
    return res.status(400).json({ error: 'chef, item, quantity 为必填' });
  }
  const orders = load();
  const id = getNextId();
  orders.push({ id, chef, item, quantity: parseFloat(quantity), unit: unit || '份', note: note || '', status: 'pending', created_at: nowStr(), purchased_at: null });
  save();
  res.status(201).json({ id });
});

app.get('/api/orders', (req, res) => {
  let orders = load();
  const { status, chef } = req.query;
  if (status) orders = orders.filter(o => o.status === status);
  if (chef) orders = orders.filter(o => o.chef === chef);
  orders.sort((a, b) => b.id - a.id);
  res.json(orders);
});

app.patch('/api/orders/:id/purchase', (req, res) => {
  const orders = load();
  const idx = orders.findIndex(o => o.id === parseInt(req.params.id));
  if (idx === -1 || orders[idx].status !== 'pending') {
    return res.status(404).json({ error: '未找到待采购订单或已采购' });
  }
  orders[idx].status = 'purchased';
  orders[idx].purchased_at = nowStr();
  save();
  res.json({ ok: true });
});

app.delete('/api/orders/:id', (req, res) => {
  const orders = load();
  save(orders.filter(o => o.id !== parseInt(req.params.id)));
  res.json({ ok: true });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chef', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chef.html'));
});

app.listen(PORT, HOST, () => {
  console.log('采购系统已启动 → http://' + HOST + ':' + PORT);
  console.log('  - 采购端: http://localhost:' + PORT + '/');
  console.log('  - 厨师端: http://localhost:' + PORT + '/chef');
});
