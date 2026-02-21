<template>
  <div class="owner-dashboard">
    <div class="header">
      <div class="store-name">{{ storeName }}</div>
      <div class="header-btns">
        <router-link to="/owner/settlement" class="nav-btn-header">📊 매출 정산</router-link>
        <router-link to="/owner/settings" class="nav-btn-header">⚙️ 설정 관리</router-link>
      </div>
    </div>

    <div class="main-layout">
      <div class="center-content">
        <div class="table-status-area">
          <div class="table-grid">
            <div
                v-for="table in tables"
                :key="table.number"
                class="table-card"
                :class="{ 'has-call': table.hasCall }"
                @click="openTableDetail(table)"
            >
              <div v-if="table.hasCall" class="call-badge">호출</div>
              <div class="table-number">{{ table.number }}번 테이블</div>
              <div class="table-orders">{{ getOrderSummary(table) || '주문 없음' }}</div>
              <div v-if="table.total > 0" class="table-total">{{ formatPrice(table.total) }}원</div>
            </div>
          </div>
        </div>

        <div class="realtime-orders-bottom">
          <div class="orders-bottom-header">
            <div class="orders-title">실시간 주문</div>
            <div class="orders-count">{{ realtimeOrders.length }}건</div>
          </div>
          <div class="orders-horizontal-scroll">
            <div v-for="order in realtimeOrders" :key="order.id" class="order-item-compact">
              <div class="order-item-header">
                <div class="order-table-num">{{ order.tableNumber }}번 테이블</div>
                <div class="order-time">{{ order.time }}</div>
              </div>
              <div class="order-menu-name">{{ order.menu }}</div>
              <div class="order-detail">{{ order.option || '옵션 없음' }} · {{ order.quantity }}개</div>
              <button class="complete-order-btn" @click="completeOrder(order.id)">완료</button>
            </div>
            <div v-if="realtimeOrders.length === 0" class="empty-state">
              <div class="empty-icon">🍽️</div>
              <div>새로운 주문이 없습니다</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 테이블 상세 모달 -->
    <div v-if="showTableDetail" class="modal-overlay" @click.self="showTableDetail = false">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ selectedTable?.number }}번 테이블</div>
          <button class="close-btn" @click="showTableDetail = false">×</button>
        </div>
        <div class="modal-body">
          <template v-if="selectedTable?.detailOrders?.length">
            <div v-for="order in selectedTable.detailOrders" :key="order.id" class="history-item-card">
              <div class="history-info">
                <div class="history-menu">{{ order.menu }}</div>
                <div class="history-detail">{{ order.option || '옵션 없음' }} · 수량: {{ order.quantity }}개</div>
              </div>
              <div class="history-price">{{ formatPrice(order.price * order.quantity) }}원</div>
            </div>
          </template>
          <div v-else class="empty-state">
            <div class="empty-icon">📋</div>
            <div>주문 내역이 없습니다</div>
          </div>
        </div>
        <div class="modal-footer">
          <div class="total-amount">총 {{ formatPrice(selectedTable?.total || 0) }}원</div>
          <button class="btn btn-primary" @click="processPayment">결제</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const storeName = ref('강남 본점')
const showTableDetail = ref(false)
const selectedTable = ref(null)

const tables = ref([
  { number: 1, total: 36000, hasCall: false, orders: ['불고기 1'], detailOrders: [{ id: 1, menu: '불고기', option: '매운맛', quantity: 2, price: 18000 }] },
  { number: 2, total: 9000, hasCall: true, orders: ['김치찌개 1'], detailOrders: [{ id: 2, menu: '김치찌개', option: null, quantity: 1, price: 9000 }] },
  { number: 3, total: 0, hasCall: false, orders: [], detailOrders: [] },
  { number: 4, total: 20000, hasCall: false, orders: ['된장찌개 1', '콜라 1'], detailOrders: [{ id: 3, menu: '된장찌개', option: null, quantity: 2, price: 8000 }, { id: 4, menu: '콜라', option: '제로', quantity: 2, price: 2000 }] },
  { number: 5, total: 0, hasCall: false, orders: [], detailOrders: [] },
  { number: 6, total: 12000, hasCall: false, orders: ['김치전 1'], detailOrders: [{ id: 5, menu: '김치전', option: null, quantity: 1, price: 12000 }] },
])

const realtimeOrders = ref([
  { id: 1, tableNumber: 3, menu: '불고기', option: '보통맛', quantity: 1, time: '14:23', price: 18000 },
  { id: 2, tableNumber: 5, menu: '소주', option: null, quantity: 2, time: '14:25', price: 5000 },
])

const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

const getOrderSummary = (table) => {
  if (!table.orders?.length) return ''
  return table.orders.join(', ')
}

const openTableDetail = (table) => {
  selectedTable.value = table
  showTableDetail.value = true
  if (table.hasCall) table.hasCall = false
}

const processPayment = () => {
  if (!selectedTable.value) return
  if (confirm(`${selectedTable.value.number}번 테이블 ${formatPrice(selectedTable.value.total)}원을 결제하시겠습니까?`)) {
    selectedTable.value.orders = []
    selectedTable.value.detailOrders = []
    selectedTable.value.total = 0
    showTableDetail.value = false
  }
}

const completeOrder = (id) => {
  const order = realtimeOrders.value.find(o => o.id === id)
  if (!order) return
  realtimeOrders.value = realtimeOrders.value.filter(o => o.id !== id)
  const table = tables.value.find(t => t.number === order.tableNumber)
  if (table) {
    table.detailOrders.push({ id: Date.now(), menu: order.menu, option: order.option, quantity: order.quantity, price: order.price })
    table.orders.push(`${order.menu} ${order.quantity}`)
    table.total += order.price * order.quantity
  }
}
</script>

<style scoped>
.owner-dashboard { display: flex; flex-direction: column; height: 100vh; background: var(--bg-dark); color: var(--text); font-family: 'Noto Sans KR', sans-serif; }

.header { padding: 16px 24px; background: var(--bg-secondary); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; height: 70px; }
.store-name { font-size: 26px; font-weight: 900; color: var(--primary); }
.header-btns { display: flex; gap: 12px; }
.nav-btn-header { padding: 8px 16px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; color: white; cursor: pointer; font-weight: 700; font-size: 14px; transition: all 0.2s; text-decoration: none; }
.nav-btn-header:hover { border-color: var(--primary); background: var(--card-hover); }

.main-layout { flex: 1; display: flex; overflow: hidden; }
.center-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.table-status-area { flex: 1; padding: 20px; overflow-y: auto; }
.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }

.table-card { background: var(--card); border: 2px solid var(--border); border-radius: 14px; padding: 16px; cursor: pointer; transition: all 0.3s; position: relative; min-height: 140px; }
.table-card:hover { border-color: var(--primary); transform: translateY(-3px); box-shadow: 0 6px 20px rgba(234,88,12,0.2); }
.table-card.has-call { border-color: var(--danger); animation: pulse 2s infinite; }
@keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.7)} 50%{box-shadow:0 0 0 10px rgba(239,68,68,0)} }

.call-badge { position: absolute; top: 10px; right: 10px; background: var(--danger); color: white; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; animation: blink 1s infinite; }
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

.table-number { font-size: 22px; font-weight: 900; color: var(--primary); margin-bottom: 10px; }
.table-orders { font-size: 11px; color: var(--text-secondary); }
.table-total { font-size: 16px; font-weight: 900; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }

.realtime-orders-bottom { height: 220px; background: var(--bg-secondary); border-top: 1px solid var(--border); display: flex; flex-direction: column; }
.orders-bottom-header { padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.orders-title { font-size: 16px; font-weight: 900; }
.orders-count { font-size: 12px; color: var(--text-secondary); }
.orders-horizontal-scroll { flex: 1; display: flex; gap: 12px; padding: 16px 20px; overflow-x: auto; }

.order-item-compact { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 12px; min-width: 200px; flex-shrink: 0; }
.order-item-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
.order-table-num { color: var(--primary); font-weight: 900; font-size: 14px; }
.order-time { font-size: 11px; color: var(--text-secondary); }
.order-menu-name { font-weight: 700; font-size: 13px; margin-bottom: 4px; }
.order-detail { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }

.complete-order-btn { width: 100%; background: var(--primary); color: white; border: none; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; }
.complete-order-btn:hover { background: var(--primary-dark); }

.empty-state { text-align: center; padding: 40px 20px; color: var(--text-secondary); width: 100%; }
.empty-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.5; }

/* 모달 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: var(--bg-secondary); border-radius: 20px; border: 1px solid var(--border); width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; animation: slideUp 0.3s; }
@keyframes slideUp { from{transform:translateY(50px);opacity:0} to{transform:translateY(0);opacity:1} }
.modal-header { padding: 24px 24px 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.modal-title { font-size: 22px; font-weight: 900; }
.close-btn { background: none; border: none; color: var(--text-secondary); font-size: 28px; cursor: pointer; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
.close-btn:hover { background: var(--card); color: var(--text); }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px 24px; display: flex; gap: 12px; justify-content: flex-end; align-items: center; }
.total-amount { font-size: 18px; font-weight: 900; margin-right: auto; }

.btn { padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer; border: none; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); }

.history-item-card { background: var(--bg-dark); padding: 14px; border-radius: 10px; border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.history-info { flex: 1; }
.history-menu { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
.history-detail { font-size: 11px; color: var(--text-secondary); }
.history-price { font-size: 14px; font-weight: 700; }
</style>