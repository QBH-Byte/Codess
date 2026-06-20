const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'orders.json');
let data = null;

function load() {
  if (data) return data;
  try { data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { data = []; }
  return data;
}

function save(d) {
  if (d !== undefined) data = d;
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getNextId() {
  load();
  return data.length > 0 ? Math.max(...data.map(o => o.id)) + 1 : 1;
}

function nowStr() {
  var d = new Date();
  var p = function(n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

module.exports = { load, save, getNextId, nowStr };
