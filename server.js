const express = require('express');
const path = require('path');
const { getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---- API ---- */

// 提交采购需求
app.post('/api/orders', (req, res) => {
  const { chef, item, quantity, unit, note } = req.body;
  if (!chef || !item || quantity == null) {
    return res.status(400).json({ error: 'chef, item, quantity 为必填' });
  }
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO orders (chef, item, quantity, unit, note) VALUES (?, ?, ?, ?, ?)`
  );
  const result = stmt.run(chef, item, quantity, unit || '份', note || '');
  res.status(201).json({ id: result.lastInsertRowid });
});

// 获取采购清单（可按状态筛选）
app.get('/api/orders', (req, res) => {
  const db = getDb();
  const { status, chef } = req.query;
  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (chef) {
    sql += ' AND chef = ?';
    params.push(chef);
  }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// 标记为已采购
app.patch('/api/orders/:id/purchase', (req, res) => {
  const db = getDb();
  const result = db.prepare(
    `UPDATE orders SET status = 'purchased', purchased_at = datetime('now','localtime') WHERE id = ? AND status = 'pending'`
  ).run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: '未找到待采购订单或已采购' });
  }
  res.json({ ok: true });
});

// 删除订单
app.delete('/api/orders/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ---- 前端路由 ---- */

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chef', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chef.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`采购系统已启动 → http://${HOST}:${PORT}`);
  console.log(`  - 采购端: http://localhost:${PORT}/`);
  console.log(`  - 厨师端: http://localhost:${PORT}/chef`);
});
