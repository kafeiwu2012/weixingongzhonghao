const C = 299792458;
function number(value) {
  const s = String(value).trim();
  if (!s || !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(s)) throw new Error('请输入有效数字（支持科学计数法）');
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error('输入数值超出范围');
  return n;
}
function positive(n, label) { if (n <= 0) throw new Error(label + '必须大于 0'); return n; }
function finite(n) { if (!Number.isFinite(n) || (n === 0)) throw new Error('结果超出数值范围，请调整输入'); return n; }
function format(n) {
  if (n === Infinity) return '∞';
  if (n === -Infinity) return '−∞';
  if (n === 0) return '0';
  return String(Number(n.toPrecision(10)));
}
function row(label, value, unit) { return { label, value: format(value), unit: unit || '' }; }
const tools = [
  { id: 'power', title: '功率换算', subtitle: 'dBm / W / mW', units: ['dBm', 'W', 'mW'], defaults: ['30', '1', '1000'], formula: 'P(mW) = 10^(dBm/10)\ndBm = 10 × log₁₀(P(mW))', note: 'dBm 是相对于 1 mW 的绝对功率。W 与 mW 输入须大于 0。' },
  { id: 'gain', title: '增益与比值', subtitle: 'dB / 功率比 / 电压比', units: ['dB', '功率比', '电压比'], defaults: ['3', '2', '2'], formula: '功率比 = 10^(dB/10)\n电压比 = 10^(dB/20)', note: '电压比换算假设输入与输出阻抗相同；比值须大于 0。' },
  { id: 'wave', title: '频率与波长', subtitle: '频率 / 自由空间波长', units: ['MHz', 'GHz', 'Hz', 'm', 'cm', 'mm'], defaults: ['2400', '2.4', '2400000000', '1', '10', '100'], formula: 'λ = c / f\nc = 299,792,458 m/s', note: '采用真空光速。介质、馈线与实际天线中的波长可能不同，输入须大于 0。' },
  { id: 'match', title: '驻波与回波损耗', subtitle: 'VSWR / RL / |Γ|', units: ['VSWR', '回波损耗 dB', '反射系数幅度'], defaults: ['1.5', '20', '0.1'], formula: '|Γ| = (VSWR − 1) / (VSWR + 1)\nRL = −20 × log₁₀|Γ|', note: '适用于无源负载：VSWR ≥ 1，回波损耗 > 0，0 ≤ |Γ| < 1。完全匹配时 RL 为 ∞。' }
];
function calculate(id, value, unit) {
  const n = number(value);
  if (id === 'power') {
    let mw = unit === 0 ? finite(Math.pow(10, n / 10)) : finite(positive(n, '功率') * (unit === 1 ? 1000 : 1));
    return [row('绝对功率', 10 * Math.log10(mw), 'dBm'), row('功率', finite(mw / 1000), 'W'), row('功率', mw, 'mW')];
  }
  if (id === 'gain') {
    const db = unit === 0 ? n : (unit === 1 ? 10 : 20) * Math.log10(positive(n, '比值'));
    return [row('增益 / 衰减', db, 'dB'), row('功率比', finite(Math.pow(10, db / 10)), '倍'), row('电压比', finite(Math.pow(10, db / 20)), '倍')];
  }
  if (id === 'wave') {
    positive(n, '频率或波长');
    const f = finite(unit < 3 ? n * [1e6, 1e9, 1][unit] : C / finite(n * [1, 0.01, 0.001][unit - 3]));
    const wavelength = finite(C / f);
    return [row('频率', f, 'Hz'), row('频率', finite(f / 1e6), 'MHz'), row('频率', finite(f / 1e9), 'GHz'), row('波长', wavelength, 'm'), row('波长', finite(wavelength * 100), 'cm'), row('波长', finite(wavelength * 1000), 'mm')];
  }
  if (id === 'match') {
    let gamma;
    if (unit === 0) { if (n < 1) throw new Error('VSWR 必须大于或等于 1'); gamma = (n - 1) / (n + 1); }
    else if (unit === 1) { positive(n, '回波损耗'); gamma = finite(Math.pow(10, -n / 20)); }
    else { if (n < 0 || n >= 1) throw new Error('反射系数幅度须满足 0 ≤ |Γ| < 1'); gamma = n; }
    if (gamma >= 1) throw new Error('结果超出数值精度范围，请调整输入');
    return [row('驻波比', (1 + gamma) / (1 - gamma), ''), row('回波损耗', gamma === 0 ? Infinity : -20 * Math.log10(gamma), 'dB'), row('反射系数幅度', gamma, ''), row('反射功率占比', gamma * gamma * 100, '%')];
  }
  throw new Error('未知工具');
}
module.exports = { tools, calculate, number, format };
