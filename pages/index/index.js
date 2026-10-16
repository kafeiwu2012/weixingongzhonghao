const rf = require('../../utils/rf');
Page({
  data: { tools: rf.tools, active: 0, tool: rf.tools[0], unit: 0, input: '30', results: [], error: '' },
  onLoad() { this.recalculate(); },
  selectTool(e) {
    const active = Number(e.currentTarget.dataset.index);
    const tool = rf.tools[active];
    this.setData({ active, tool, unit: 0, input: tool.defaults[0] }, () => this.recalculate());
  },
  changeUnit(e) {
    const unit = Number(e.detail.value);
    this.setData({ unit, input: this.data.tool.defaults[unit] }, () => this.recalculate());
  },
  changeInput(e) { this.setData({ input: e.detail.value }, () => this.recalculate()); },
  recalculate() {
    try { this.setData({ results: rf.calculate(this.data.tool.id, this.data.input, this.data.unit), error: '' }); }
    catch (e) { this.setData({ results: [], error: e.message }); }
  },
  reset() { this.setData({ input: this.data.tool.defaults[this.data.unit] }, () => this.recalculate()); },
  copy() {
    if (!this.data.results.length) return;
    wx.setClipboardData({ data: this.data.tool.title + '\n输入：' + this.data.input + ' ' + this.data.tool.units[this.data.unit] + '\n' + this.data.results.map(r => r.label + '：' + r.value + ' ' + r.unit).join('\n') });
  },
  onShareAppMessage() { return { title: '射频工具箱 · 功率、增益、波长、驻波计算', path: '/pages/index/index' }; }
});
