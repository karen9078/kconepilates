/* ===== 高德物流管理系统 — 应用逻辑 ===== */

// ==================== 模拟数据 ====================

const carriers = [
  { id: 'C001', name: '鑫达快运', type: '专线公司', contact: '张经理', phone: '13800001111', routes: '上海-广州' },
  { id: 'C002', name: '万里物流', type: '专线公司', contact: '李经理', phone: '13800002222', routes: '上海-北京' },
  { id: 'C003', name: '顺风专线', type: '专线公司', contact: '王经理', phone: '13800003333', routes: '广州-深圳' },
  { id: 'C004', name: '通达货运', type: '专线公司', contact: '刘经理', phone: '13800004444', routes: '北京-上海' },
];

const drivers = [
  { id: 'D001', name: '赵大勇', phone: '13911112222', plate: '沪A·88888', carrier: '鑫达快运' },
  { id: 'D002', name: '钱师傅', phone: '13911113333', plate: '沪B·66666', carrier: '万里物流' },
  { id: 'D003', name: '孙师傅', phone: '13911114444', plate: '粤C·77777', carrier: '顺风专线' },
  { id: 'D004', name: '周师傅', phone: '13911115555', plate: '京D·55555', carrier: '通达货运' },
  { id: 'D005', name: '吴师傅', phone: '13911116666', plate: '沪E·33333', carrier: null },
];

const customers = [
  '华为技术有限公司', '阿里巴巴集团', '腾讯科技', '京东物流',
  '美的集团', '格力电器', '比亚迪汽车', '小米科技'
];

const cities = ['上海', '广州', '深圳', '北京', '杭州', '成都', '武汉', '南京', '苏州', '东莞'];

let waybills = [
  { id: 'YD202406001', customer: '华为技术有限公司', goods: '通信设备', weight: '2.5吨', volume: '15m³',
    pickupAddr: '上海市松江区科技路88号', deliveryAddr: '广州市天河区软件路1号',
    carrierType: '专线公司', carrierName: '鑫达快运', driver: '赵大勇',
    status: '待调度', createTime: '2024-06-01 09:30', amount: 6800, remark: '' },

  { id: 'YD202406002', customer: '阿里巴巴集团', goods: '服务器', weight: '1.8吨', volume: '8m³',
    pickupAddr: '杭州市余杭区文一西路969号', deliveryAddr: '北京市朝阳区望京东路1号',
    carrierType: '专线公司', carrierName: '万里物流', driver: '钱师傅',
    status: '待提货', createTime: '2024-06-01 10:00', amount: 8500, remark: '需提前预约' },

  { id: 'YD202406003', customer: '美的集团', goods: '家电', weight: '5吨', volume: '30m³',
    pickupAddr: '佛山市顺德区北滘镇工业大道', deliveryAddr: '上海市浦东新区外高桥',
    carrierType: '专线公司', carrierName: '顺风专线', driver: '孙师傅',
    status: '待送达', createTime: '2024-05-31 14:00', amount: 12000, remark: '' },

  { id: 'YD202406004', customer: '比亚迪汽车', goods: '汽车配件', weight: '3.2吨', volume: '20m³',
    pickupAddr: '深圳市坪山区比亚迪路6号', deliveryAddr: '长沙市雨花区环保路',
    carrierType: '司机', carrierName: '吴师傅', driver: '吴师傅',
    status: '待送达', createTime: '2024-05-30 08:00', amount: 5200, remark: '整车运输' },

  { id: 'YD202406005', customer: '京东物流', goods: '电商货物', weight: '8吨', volume: '45m³',
    pickupAddr: '上海市嘉定区马陆镇', deliveryAddr: '广州市白云区太和镇',
    carrierType: '专线公司', carrierName: '鑫达快运', driver: '赵大勇',
    status: '已完成', createTime: '2024-05-28 11:00', amount: 15000, remark: '' },

  { id: 'YD202406006', customer: '腾讯科技', goods: '电子设备', weight: '1吨', volume: '5m³',
    pickupAddr: '深圳市南山区科技中一路', deliveryAddr: '北京市海淀区中关村',
    carrierType: '司机', carrierName: '吴师傅', driver: '吴师傅',
    status: '有异常', createTime: '2024-05-29 16:00', amount: 4500, remark: '货损异常，客户已联系' },

  { id: 'YD202406007', customer: '格力电器', goods: '空调设备', weight: '6吨', volume: '35m³',
    pickupAddr: '珠海市香洲区前山工业区', deliveryAddr: '成都市青白江区物流园',
    carrierType: '专线公司', carrierName: '通达货运', driver: '周师傅',
    status: '待回单', createTime: '2024-05-27 09:00', amount: 11000, remark: '回单未寄回' },

  { id: 'YD202406008', customer: '小米科技', goods: '手机配件', weight: '0.8吨', volume: '4m³',
    pickupAddr: '南京市江宁区秣周东路', deliveryAddr: '武汉市江夏区光谷大道',
    carrierType: '司机', carrierName: '吴师傅', driver: '吴师傅',
    status: '待调度', createTime: '2024-06-02 08:30', amount: 3200, remark: '' },
];

// ==================== 工具函数 ====================

function formatMoney(n) {
  return '¥' + n.toLocaleString('zh-CN');
}

function getStatusLabel(status) {
  const map = {
    '待调度': '待调度', '待提货': '待提货', '待送达': '待送达',
    '已完成': '已完成', '有异常': '有异常', '待回单': '待回单'
  };
  return map[status] || status;
}

function getStatusClass(status) {
  const map = {
    '待调度': 'status-pending-dispatch',
    '待提货': 'status-pending-pickup',
    '待送达': 'status-pending-delivery',
    '已完成': 'status-completed',
    '有异常': 'status-exception',
    '待回单': 'status-pending-receipt'
  };
  return map[status] || '';
}

function getStatusIcon(status) {
  const map = {
    '待调度': '🔄', '待提货': '📥', '待送达': '🚚',
    '已完成': '✅', '有异常': '⚠️', '待回单': '📎'
  };
  return map[status] || '📋';
}

function generateId() {
  const date = new Date();
  const ds = date.getFullYear().toString() +
    String(date.getMonth()+1).padStart(2,'0') +
    String(date.getDate()).padStart(2,'0');
  const n = String(waybills.length + 1).padStart(3,'0');
  return `YD${ds}${n}`;
}

// ==================== 路由 ====================

let currentPage = 'dashboard';

function navigate(page) {
  currentPage = page;
  // 更新导航高亮
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.querySelector(`[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');

  // 更新页面标题
  const titleMap = {
    'dashboard': '首页仪表盘',
    'waybills': '运单管理',
    'revenue': '订单收入管理',
    'tracking': '运单跟踪',
    'tracking-dispatch': '运单跟踪 - 待调度',
    'tracking-pickup': '运单跟踪 - 待提货',
    'tracking-delivery': '运单跟踪 - 待送达',
    'tracking-completed': '运单跟踪 - 已完成',
    'tracking-exception': '运单跟踪 - 有异常',
    'tracking-receipt': '运单跟踪 - 待回单',
  };
  document.getElementById('page-title').textContent = titleMap[page] || '高德物流系统';

  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  // 渲染对应页面
  switch(page) {
    case 'dashboard': renderDashboard(); break;
    case 'waybills': renderWaybills(); break;
    case 'revenue': renderRevenue(); break;
    case 'tracking': renderTracking('all'); break;
    case 'tracking-dispatch': renderTracking('待调度'); break;
    case 'tracking-pickup': renderTracking('待提货'); break;
    case 'tracking-delivery': renderTracking('待送达'); break;
    case 'tracking-completed': renderTracking('已完成'); break;
    case 'tracking-exception': renderTracking('有异常'); break;
    case 'tracking-receipt': renderTracking('待回单'); break;
  }
}

// ==================== 仪表盘 ====================

function renderDashboard() {
  const total = waybills.length;
  const pendingDispatch = waybills.filter(w => w.status === '待调度').length;
  const inTransit = waybills.filter(w => ['待提货','待送达'].includes(w.status)).length;
  const exceptions = waybills.filter(w => w.status === '有异常').length;
  const totalRevenue = waybills.reduce((s, w) => s + w.amount, 0);

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-pending').textContent = pendingDispatch;
  document.getElementById('stat-transit').textContent = inTransit;
  document.getElementById('stat-exceptions').textContent = exceptions;
  document.getElementById('stat-revenue').textContent = formatMoney(totalRevenue);

  // 最近运单
  const recent = [...waybills].sort((a,b) => b.createTime.localeCompare(a.createTime)).slice(0, 5);
  const tbody = document.querySelector('#recent-waybills tbody');
  tbody.innerHTML = recent.map(w => `
    <tr>
      <td><strong>${w.id}</strong></td>
      <td>${w.customer}</td>
      <td>${w.goods}</td>
      <td>${w.carrierName || '-'}</td>
      <td><span class="status-tag ${getStatusClass(w.status)}"><span class="status-dot"></span>${getStatusLabel(w.status)}</span></td>
      <td>${formatMoney(w.amount)}</td>
      <td><button class="btn btn-sm btn-outline" onclick="showWaybillDetail('${w.id}')">详情</button></td>
    </tr>
  `).join('');
}

// ==================== 运单管理 ====================

let waybillFilter = { keyword: '', status: '', carrier: '' };

function renderWaybills(data) {
  let list = data || waybills;
  const f = waybillFilter;

  if (f.keyword) {
    const kw = f.keyword.toLowerCase();
    list = list.filter(w => w.id.toLowerCase().includes(kw) || w.customer.includes(kw) || w.goods.includes(kw));
  }
  if (f.status) list = list.filter(w => w.status === f.status);
  if (f.carrier) list = list.filter(w => w.carrierName === f.carrier);

  // Update filter inputs
  document.getElementById('filter-keyword').value = f.keyword;
  document.getElementById('filter-status').value = f.status;
  document.getElementById('filter-carrier').value = f.carrier;

  const tbody = document.querySelector('#waybill-table tbody');
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-secondary)">暂无数据</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(w => `
    <tr>
      <td><strong>${w.id}</strong></td>
      <td>${w.customer}</td>
      <td>${w.goods}</td>
      <td>${w.pickupAddr.slice(0,15)}…</td>
      <td>${w.deliveryAddr.slice(0,15)}…</td>
      <td><span class="status-tag ${getStatusClass(w.status)}"><span class="status-dot"></span>${getStatusLabel(w.status)}</span></td>
      <td>${formatMoney(w.amount)}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-sm btn-outline" onclick="showWaybillDetail('${w.id}')">详情</button>
          ${w.status === '待调度' ? `<button class="btn btn-sm btn-primary" onclick="dispatchWaybill('${w.id}')">调度</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function applyWaybillFilter() {
  waybillFilter.keyword = document.getElementById('filter-keyword').value;
  waybillFilter.status = document.getElementById('filter-status').value;
  waybillFilter.carrier = document.getElementById('filter-carrier').value;
  renderWaybills();
}

function resetWaybillFilter() {
  waybillFilter = { keyword: '', status: '', carrier: '' };
  renderWaybills();
}

// ==================== 运单详情 & 新建 ====================

function showWaybillDetail(id) {
  const w = waybills.find(x => x.id === id);
  if (!w) return;
  document.getElementById('detail-id').textContent = w.id;
  document.getElementById('detail-customer').textContent = w.customer;
  document.getElementById('detail-goods').textContent = `${w.goods}（${w.weight} / ${w.volume}）`;
  document.getElementById('detail-pickup').textContent = w.pickupAddr;
  document.getElementById('detail-delivery').textContent = w.deliveryAddr;
  document.getElementById('detail-carrier').textContent = `${w.carrierName || '-'}（${w.carrierType || '-'}）`;
  document.getElementById('detail-driver').textContent = w.driver || '-';
  document.getElementById('detail-amount').textContent = formatMoney(w.amount);
  document.getElementById('detail-status').innerHTML = `<span class="status-tag ${getStatusClass(w.status)}"><span class="status-dot"></span>${getStatusLabel(w.status)}</span>`;
  document.getElementById('detail-remark').textContent = w.remark || '无';
  document.getElementById('detail-time').textContent = w.createTime;

  // Show actions based on status
  const actions = document.getElementById('detail-actions');
  let html = '';
  if (w.status === '待调度') {
    html = `<button class="btn btn-primary" onclick="closeDetail();dispatchWaybill('${w.id}')">🚀 调度派车</button>`;
  } else if (w.status === '待提货') {
    html = `<button class="btn btn-success" onclick="confirmPickup('${w.id}')">📥 确认提货</button>`;
  } else if (w.status === '待送达') {
    html = `<button class="btn btn-success" onclick="confirmDelivery('${w.id}')">✅ 确认送达</button>`;
  } else if (w.status === '待回单') {
    html = `<button class="btn btn-success" onclick="confirmReceipt('${w.id}')">📎 确认回单</button>`;
  }
  actions.innerHTML = html;

  document.getElementById('modal-detail').classList.add('active');
}

function closeDetail() {
  document.getElementById('modal-detail').classList.remove('active');
}

function openNewWaybill() {
  document.getElementById('new-waybill-form').reset();
  document.getElementById('new-waybill-id').textContent = generateId();
  document.getElementById('modal-new-waybill').classList.add('active');
}

function closeNewWaybill() {
  document.getElementById('modal-new-waybill').classList.remove('active');
}

function saveNewWaybill() {
  const form = document.getElementById('new-waybill-form');
  const data = new FormData(form);
  const w = {
    id: generateId(),
    customer: data.get('customer'),
    goods: data.get('goods'),
    weight: data.get('weight') || '—',
    volume: data.get('volume') || '—',
    pickupAddr: data.get('pickupAddr'),
    deliveryAddr: data.get('deliveryAddr'),
    carrierType: '',
    carrierName: '',
    driver: '',
    status: '待调度',
    createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g,'-'),
    amount: parseFloat(data.get('amount')) || 0,
    remark: data.get('remark') || '',
  };
  waybills.push(w);
  closeNewWaybill();
  renderWaybills();
  updateNavCounts();
  alert(`运单 ${w.id} 创建成功！`);
}

// ==================== 调度派车 ====================

function dispatchWaybill(id) {
  const w = waybills.find(x => x.id === id);
  if (!w) return;
  // 填入表单
  document.getElementById('dispatch-id').textContent = w.id;
  document.getElementById('dispatch-customer').textContent = w.customer;

  // 填充承运商选项
  const carrierSelect = document.getElementById('dispatch-carrier');
  carrierSelect.innerHTML = '<option value="">请选择</option>' +
    carriers.map(c => `<option value="${c.name}">${c.name}（${c.routes}）</option>`).join('') +
    '<option value="__driver__">→ 指派司机（非专线）</option>';

  // 司机选项（默认隐藏）
  const driverGroup = document.getElementById('dispatch-driver-group');
  driverGroup.style.display = 'none';
  document.getElementById('dispatch-driver').innerHTML = '';

  document.getElementById('dispatch-amount').value = w.amount || '';
  document.getElementById('dispatch-remark').value = w.remark || '';

  carrierSelect.onchange = function() {
    const val = this.value;
    if (val === '__driver__') {
      driverGroup.style.display = 'block';
      const ds = document.getElementById('dispatch-driver');
      ds.innerHTML = '<option value="">请选择司机</option>' +
        drivers.filter(d => !d.carrier).map(d =>
          `<option value="${d.name}" data-phone="${d.phone}" data-plate="${d.plate}">${d.name} - ${d.plate}</option>`
        ).join('');
    } else if (val) {
      driverGroup.style.display = 'none';
      // auto-select driver for this carrier
      const carrierDrivers = drivers.filter(d => d.carrier === val);
      // We'll just set the carrier and let user confirm
    } else {
      driverGroup.style.display = 'none';
    }
  };

  document.getElementById('modal-dispatch').classList.add('active');
  document.getElementById('modal-detail').classList.remove('active');
}

function closeDispatch() {
  document.getElementById('modal-dispatch').classList.remove('active');
}

function confirmDispatch() {
  const id = document.getElementById('dispatch-id').textContent;
  const w = waybills.find(x => x.id === id);
  if (!w) return;

  const carrierVal = document.getElementById('dispatch-carrier').value;
  const driverVal = document.getElementById('dispatch-driver').value;
  const amount = parseFloat(document.getElementById('dispatch-amount').value) || w.amount;
  const remark = document.getElementById('dispatch-remark').value;

  if (!carrierVal && !driverVal) { alert('请选择承运商或司机'); return; }

  if (carrierVal === '__driver__') {
    if (!driverVal) { alert('请选择司机'); return; }
    w.carrierType = '司机';
    w.carrierName = driverVal;
    w.driver = driverVal;
  } else {
    w.carrierType = '专线公司';
    w.carrierName = carrierVal;
    // Find a driver from this carrier
    const cd = drivers.find(d => d.carrier === carrierVal);
    w.driver = cd ? cd.name : '';
  }

  w.amount = amount;
  w.remark = remark;
  w.status = '待提货';

  closeDispatch();
  renderWaybills();
  renderDashboard();
  updateNavCounts();
  alert(`运单 ${id} 已调度成功！状态更新为「待提货」`);
}

// ==================== 状态流转 ====================

function confirmPickup(id) {
  if (!confirm('确认已提货？')) return;
  const w = waybills.find(x => x.id === id);
  if (!w) return;
  w.status = '待送达';
  renderWaybills();
  renderDashboard();
  updateNavCounts();
  closeDetail();
  alert(`运单 ${id} 已提货，状态更新为「待送达」`);
}

function confirmDelivery(id) {
  if (!confirm('确认已送达？')) return;
  const w = waybills.find(x => x.id === id);
  if (!w) return;
  w.status = '待回单';
  renderWaybills();
  renderDashboard();
  updateNavCounts();
  closeDetail();
  alert(`运单 ${id} 已送达，状态更新为「待回单」`);
}

function confirmReceipt(id) {
  if (!confirm('确认回单已收回？')) return;
  const w = waybills.find(x => x.id === id);
  if (!w) return;
  w.status = '已完成';
  renderWaybills();
  renderDashboard();
  updateNavCounts();
  closeDetail();
  alert(`运单 ${id} 已完成！`);
}

// ==================== 运单跟踪看板 ====================

function renderTracking(filterStatus) {
  const cols = ['待调度', '待提货', '待送达', '已完成', '有异常', '待回单'];
  const container = document.getElementById('tracking-kanban');

  container.innerHTML = cols.map(status => {
    let items = waybills.filter(w => w.status === status);
    if (filterStatus !== 'all' && filterStatus !== status) {
      // Show only the filtered column if we're on a specific tracking page
      if (filterStatus === status) {
        // include
      } else {
        items = [];
      }
    }
    const icon = getStatusIcon(status);
    return `
      <div class="kanban-column">
        <div class="kanban-column-header">
          <div class="kanban-column-title">${icon} ${status}</div>
          <span class="kanban-count">${items.length}</span>
        </div>
        ${items.length === 0 ? '<div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:13px;">暂无</div>' :
          items.map(w => `
            <div class="kanban-card" onclick="showWaybillDetail('${w.id}')">
              <div class="card-title">${w.id}</div>
              <div class="card-meta">
                <span>📦 ${w.goods}</span>
                <span>🏢 ${w.customer}</span>
                <span>🚛 ${w.carrierName || '未调度'}</span>
                <span>💰 ${formatMoney(w.amount)}</span>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;
  }).join('');
}

// ==================== 订单收入管理 ====================

function renderRevenue() {
  const totalIncome = waybills.reduce((s, w) => s + w.amount, 0);
  // 假设成本约为收入的65%（付给专线公司/司机）
  const totalCost = Math.round(totalIncome * 0.65);
  const totalProfit = totalIncome - totalCost;

  document.getElementById('total-income').textContent = formatMoney(totalIncome);
  document.getElementById('total-cost').textContent = formatMoney(totalCost);
  document.getElementById('total-profit').textContent = formatMoney(totalProfit);

  // 按承运商统计
  const carrierStats = {};
  waybills.forEach(w => {
    const key = w.carrierName || '未调度';
    if (!carrierStats[key]) carrierStats[key] = { count: 0, amount: 0, cost: 0 };
    carrierStats[key].count++;
    carrierStats[key].amount += w.amount;
    carrierStats[key].cost += Math.round(w.amount * 0.65);
  });

  const tbody = document.querySelector('#revenue-table tbody');
  if (Object.keys(carrierStats).length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-secondary)">暂无数据</td></tr>';
    return;
  }

  tbody.innerHTML = Object.entries(carrierStats).map(([carrier, stats]) => {
    const profit = stats.amount - stats.cost;
    const margin = stats.amount > 0 ? ((profit / stats.amount) * 100).toFixed(1) : '0.0';
    return `
      <tr>
        <td><strong>${carrier}</strong></td>
        <td>${stats.count} 单</td>
        <td>${formatMoney(stats.amount)}</td>
        <td>${formatMoney(stats.cost)}</td>
        <td style="color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:600;">${formatMoney(profit)}（${margin}%）</td>
      </tr>
    `;
  }).join('');

  // 最近收入明细
  const recentRevenue = [...waybills].sort((a,b) => b.createTime.localeCompare(a.createTime));
  const detailBody = document.querySelector('#revenue-detail-table tbody');
  detailBody.innerHTML = recentRevenue.map(w => {
    const cost = Math.round(w.amount * 0.65);
    const profit = w.amount - cost;
    return `
      <tr>
        <td>${w.id}</td>
        <td>${w.customer}</td>
        <td>${formatMoney(w.amount)}</td>
        <td>${formatMoney(cost)}</td>
        <td style="color:${profit >= 0 ? 'var(--success)' : 'var(--danger)'};">${formatMoney(profit)}</td>
        <td><span class="status-tag ${getStatusClass(w.status)}"><span class="status-dot"></span>${getStatusLabel(w.status)}</span></td>
      </tr>
    `;
  }).join('');
}

// ==================== 导航计数更新 ====================

function updateNavCounts() {
  const counts = {
    '待调度': waybills.filter(w => w.status === '待调度').length,
    '待提货': waybills.filter(w => w.status === '待提货').length,
    '待送达': waybills.filter(w => w.status === '待送达').length,
    '已完成': waybills.filter(w => w.status === '已完成').length,
    '有异常': waybills.filter(w => w.status === '有异常').length,
    '待回单': waybills.filter(w => w.status === '待回单').length,
  };

  Object.entries(counts).forEach(([status, count]) => {
    const el = document.querySelector(`[data-count="${status}"]`);
    if (el) el.textContent = count;
  });
}

// ==================== 侧边栏切换（移动端） ====================

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', function() {
  // 初始化导航
  navigate('dashboard');
  updateNavCounts();

  // 填充筛选下拉
  const statusSelect = document.getElementById('filter-status');
  if (statusSelect) {
    ['待调度','待提货','待送达','已完成','有异常','待回单'].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      statusSelect.appendChild(opt);
    });
  }

  const carrierSelect = document.getElementById('filter-carrier');
  if (carrierSelect) {
    carriers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.name; opt.textContent = c.name;
      carrierSelect.appendChild(opt);
    });
  }
});
