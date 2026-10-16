const { test } = require('node:test');
const assert = require('node:assert/strict');
const rf = require('../utils/rf');
function close(actual, expected) { assert.ok(Math.abs(Number(actual) - expected) <= Math.max(1e-10, Math.abs(expected) * 1e-9), `${actual} != ${expected}`); }
test('功率已知值和双向换算', () => {
  close(rf.calculate('power', '30', 0)[1].value, 1);
  close(rf.calculate('power', '0', 0)[2].value, 1);
  close(rf.calculate('power', '-30', 0)[1].value, 0.000001);
  close(rf.calculate('power', '1', 1)[0].value, 30);
  close(rf.calculate('power', '1000', 2)[0].value, 30);
  close(rf.calculate('power', '1e-3', 1)[0].value, 0);
});
test('增益、功率比与电压比', () => {
  close(rf.calculate('gain', '20', 0)[1].value, 100);
  close(rf.calculate('gain', '20', 0)[2].value, 10);
  close(rf.calculate('gain', '2', 1)[0].value, 3.01029995664);
  close(rf.calculate('gain', '2', 2)[0].value, 6.02059991328);
  close(rf.calculate('gain', '-20', 0)[1].value, 0.01);
});
test('所有频率及波长输入单位', () => {
  for (const [unit, input] of [[0, '299.792458'], [1, '0.299792458'], [2, '299792458'], [3, '1'], [4, '100'], [5, '1000']]) {
    const rows = rf.calculate('wave', input, unit);
    close(rows[0].value, 299792458); close(rows[3].value, 1);
  }
});
test('驻波匹配及理想匹配边界', () => {
  for (const [unit, input] of [[0, '3'], [1, '6.020599913279624'], [2, '0.5']]) {
    const rows = rf.calculate('match', input, unit);
    close(rows[0].value, 3); close(rows[2].value, 0.5); close(rows[3].value, 25);
  }
  assert.equal(rf.calculate('match', '1', 0)[1].value, '∞');
  assert.equal(rf.calculate('match', '0', 2)[1].value, '∞');
});
test('拒绝非法输入及数值溢出', () => {
  for (const value of ['', ' ', 'abc', '0x10', 'NaN', 'Infinity', '1e', '1 2']) assert.throws(() => rf.number(value));
  for (const [id, n, unit] of [['power', 0, 1], ['power', -1, 2], ['power', 4000, 0], ['power', -4000, 0], ['gain', 0, 1], ['gain', -2, 2], ['wave', 0, 0], ['wave', -1, 3], ['match', 0.9, 0], ['match', 0, 1], ['match', 1, 2], ['match', -0.1, 2]]) assert.throws(() => rf.calculate(id, n, unit));
});
test('页面初始化、所有工具与单位、错误恢复、复制和分享', () => {
  let definition; let copied;
  global.Page = p => { definition = p; };
  global.wx = { setClipboardData: p => { copied = p.data; } };
  require('../pages/index/index');
  const page = Object.assign({}, definition, { data: JSON.parse(JSON.stringify(definition.data)), setData(data, done) { Object.assign(this.data, data); if (done) done(); } });
  page.onLoad(); assert.equal(page.data.results[1].value, '1');
  rf.tools.forEach((tool, index) => {
    page.selectTool({ currentTarget: { dataset: { index } } });
    tool.units.forEach((_, unit) => { page.changeUnit({ detail: { value: String(unit) } }); assert.equal(page.data.error, ''); assert.ok(page.data.results.length); });
  });
  page.changeInput({ detail: { value: 'bad' } }); assert.ok(page.data.error); assert.equal(page.data.results.length, 0);
  page.reset(); assert.equal(page.data.error, ''); page.copy(); assert.ok(copied.includes('反射系数'));
  assert.equal(page.onShareAppMessage().path, '/pages/index/index');
  delete global.Page; delete global.wx;
});
test('项目 JSON 配置及入口文件完整', () => {
  const fs = require('node:fs'); const path = require('node:path');
  const root = path.join(__dirname, '..');
  for (const file of ['app.json', 'project.config.json', 'sitemap.json', 'pages/index/index.json']) JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  for (const page of app.pages) for (const ext of ['js', 'json', 'wxml', 'wxss']) assert.ok(fs.existsSync(path.join(root, page + '.' + ext)));
});
