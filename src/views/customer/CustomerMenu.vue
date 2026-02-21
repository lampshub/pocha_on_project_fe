<template>
  <div class="app-root">

    <!-- ── 왼쪽 사이드바 ─────────────────────────────── -->
    <aside class="sidebar">
      <div class="table-info">
        <div class="table-number">{{ tableNumber }}</div>
        <div class="table-label">TABLE</div>
      </div>

      <div class="category-list">
        <div
            v-for="cat in categories"
            :key="cat.id"
            :class="['category-item', { active: currentCategory === cat.id }]"
            @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </div>
        <div class="category-item call-staff" @click="callStaff">
          👋 직원호출
        </div>
      </div>
    </aside>

    <!-- ── 메인 컨텐츠 ────────────────────────────────── -->
    <main class="main-content" ref="mainContent" @scroll="handleScroll">
      <div
          v-for="cat in categories"
          :key="cat.id"
          :data-category="cat.id"
          class="menu-section"
      >
        <h2 class="section-title">{{ cat.name }}</h2>
        <div class="menu-grid">
          <div
              v-for="menu in getMenusByCategory(cat.id)"
              :key="menu.id"
              class="menu-card"
              @click="openMenuDetail(menu)"
          >
            <div class="menu-image">{{ menu.icon }}</div>
            <div class="menu-info">
              <div class="menu-name">{{ menu.name }}</div>
              <div class="menu-description">{{ menu.description }}</div>
              <div class="menu-price">{{ formatPrice(menu.price) }}원</div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- ── 플로팅 버튼 ─────────────────────────────────── -->
    <div class="floating-buttons" :class="{ hidden: isPanelOpen }">
      <button class="floating-btn" @click="openChatModal" title="채팅">
        💬
        <span v-if="unreadChatCount > 0" class="badge">{{ unreadChatCount }}</span>
      </button>
      <button class="floating-btn" @click="openOrderHistory" title="주문내역">
        📋
        <span v-if="orderHistory.length > 0" class="badge">{{ orderHistory.length }}</span>
      </button>
      <button class="floating-btn" @click="openCart" title="장바구니">
        🛒
        <span v-if="cartItems.length > 0" class="badge">{{ cartItems.length }}</span>
      </button>
    </div>

    <!-- ── 주문내역 패널 ───────────────────────────────── -->
    <div class="slide-panel" :class="{ open: showOrderHistory }">
      <div class="panel-header">
        <h2 class="panel-title">주문 내역</h2>
        <button class="close-btn" @click="closePanel">✕</button>
      </div>
      <div class="panel-content">
        <div v-if="orderHistory.length > 0">
          <div v-for="group in orderHistory" :key="group.groupId" class="order-group">
            <div class="group-header">그룹 ID: {{ group.groupId }}</div>
            <div v-for="item in group.items" :key="item.id" class="order-item">
              <div class="order-item-name">{{ item.name }}</div>
              <div class="order-item-option">{{ item.option || '옵션 X' }}</div>
              <div class="order-item-bottom">
                <span class="order-item-quantity">수량: {{ item.quantity }}개</span>
                <span class="order-item-price">{{ formatPrice(item.price * item.quantity) }}원</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">주문 내역이 없습니다</div>
        </div>
      </div>
    </div>

    <!-- ── 장바구니 패널 ───────────────────────────────── -->
    <div class="slide-panel" :class="{ open: showCart }">
      <div class="panel-header">
        <h2 class="panel-title">장바구니</h2>
        <button class="close-btn" @click="closePanel">✕</button>
      </div>
      <div class="panel-content">
        <div v-if="cartItems.length > 0">
          <div v-for="(item, idx) in cartItems" :key="idx" class="cart-item">
            <div class="cart-item-name">{{ item.name }}</div>
            <div class="cart-item-option">{{ item.option || '옵션 X' }}</div>
            <div class="cart-item-controls">
              <div class="quantity-controls">
                <button class="quantity-btn" @click="decreaseQuantity(idx)">-</button>
                <span class="quantity-value">{{ item.quantity }}</span>
                <button class="quantity-btn" @click="increaseQuantity(idx)">+</button>
              </div>
              <div class="cart-item-price">{{ formatPrice(item.price * item.quantity) }}원</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">🛒</div>
          <div class="empty-text">장바구니가 비어있습니다</div>
        </div>
      </div>
      <div v-if="cartItems.length > 0" class="panel-footer">
        <div class="total-price">
          <span class="total-label">총 금액</span>
          <span class="total-amount">{{ formatPrice(totalPrice) }}원</span>
        </div>
        <button class="order-btn" @click="placeOrder">주문하기</button>
      </div>
    </div>

    <!-- ── 선물하기 패널 ───────────────────────────────── -->
    <div class="slide-panel" :class="{ open: showGiftPanel }">
      <div class="panel-header">
        <h2 class="panel-title">{{ selectedGiftTable }}번 테이블에 선물하기</h2>
        <button class="close-btn" @click="closeGiftPanel">✕</button>
      </div>
      <div class="panel-content">
        <div v-for="cat in categories" :key="cat.id" class="menu-section-small">
          <h3 class="section-title-small">{{ cat.name }}</h3>
          <div class="menu-list-small">
            <div
                v-for="menu in getMenusByCategory(cat.id)"
                :key="menu.id"
                class="menu-item-small"
                @click="openGiftMenuDetail(menu)"
            >
              <div class="menu-icon-small">{{ menu.icon }}</div>
              <div class="menu-info-small">
                <div class="menu-name-small">{{ menu.name }}</div>
                <div class="menu-price-small">{{ formatPrice(menu.price) }}원</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 채팅 패널 ───────────────────────────────────── -->
    <div class="slide-panel" :class="{ open: showChatPanel }">
      <div class="panel-header">
        <h2 class="panel-title">{{ selectedChatTable }}번 테이블 채팅</h2>
        <button class="close-btn" @click="closeChatPanel">✕</button>
      </div>
      <div class="panel-content chat-content">
        <div class="chat-messages" ref="chatMessages">
          <div
              v-for="(msg, idx) in chatMessages"
              :key="idx"
              :class="['chat-message', msg.isMine ? 'mine' : 'theirs']"
          >
            <div class="message-bubble">
              <div class="message-text">{{ msg.text }}</div>
              <div class="message-time">{{ msg.time }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="panel-footer chat-footer">
        <input
            type="text"
            class="chat-input"
            v-model="chatInput"
            @keyup.enter="sendMessage"
            placeholder="메시지를 입력하세요..."
        />
        <button class="send-btn" @click="sendMessage">전송</button>
      </div>
    </div>

    <!-- ── 채팅/선물 테이블 선택 모달 ─────────────────── -->
    <div v-if="showChatModal" class="modal-overlay" @click.self="closeChatModal">
      <div class="modal-content">
        <h2 class="modal-title">테이블 선택</h2>
        <div class="table-select-grid">
          <button
              v-for="table in availableTables"
              :key="table"
              :class="['table-select-btn', { selected: selectedTable === table }]"
              @click="selectTable(table)"
          >
            {{ table }}번
            <span v-if="getUnreadCountForTable(table) > 0" class="table-badge">
              {{ getUnreadCountForTable(table) }}
            </span>
          </button>
        </div>
        <div class="modal-action-buttons">
          <button class="action-btn action-btn-primary" :disabled="!selectedTable" @click="openChat">채팅하기</button>
          <button class="action-btn action-btn-primary" :disabled="!selectedTable" @click="openGift">선물하기</button>
          <button class="action-btn action-btn-secondary" @click="closeChatModal">취소</button>
        </div>
      </div>
    </div>

    <!-- ── 메뉴 상세 모달 ─────────────────────────────── -->
    <div v-if="showMenuDetail" class="modal-overlay" @click.self="closeMenuDetail">
      <div class="modal-content menu-detail-modal">
        <div class="menu-detail-image">{{ selectedMenu?.icon }}</div>
        <h2 class="menu-detail-name">{{ selectedMenu?.name }}</h2>
        <div class="menu-detail-price">{{ formatPrice(selectedMenu?.price ?? 0) }}원</div>
        <div class="menu-detail-description">{{ selectedMenu?.description }}</div>

        <div v-if="selectedMenu?.options?.length" class="menu-options">
          <h3 class="options-title">옵션 선택</h3>
          <div class="options-list">
            <label
                v-for="(opt, idx) in selectedMenu.options"
                :key="idx"
                class="option-item"
            >
              <input type="radio" :value="opt" v-model="selectedOption" name="menuOption" />
              <span class="option-label">{{ opt }}</span>
            </label>
          </div>
        </div>

        <div class="menu-detail-footer">
          <button class="cancel-detail-btn" @click="closeMenuDetail">취소</button>
          <button v-if="!isGiftMode" class="add-cart-btn" @click="addToCartFromDetail">
            🛒 장바구니 담기
          </button>
          <button v-else class="add-cart-btn" @click="sendGift">
            🎁 메뉴 선물하기
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'

// ── 상태 ─────────────────────────────────────────────
const tableNumber       = ref(5)
const currentCategory   = ref('main')
const showOrderHistory  = ref(false)
const showCart          = ref(false)
const showChatModal     = ref(false)
const showMenuDetail    = ref(false)
const showGiftPanel     = ref(false)
const showChatPanel     = ref(false)
const selectedTable     = ref(null)
const selectedGiftTable = ref(null)
const selectedChatTable = ref(null)
const selectedMenu      = ref(null)
const selectedOption    = ref(null)
const isGiftMode        = ref(false)
const chatInput         = ref('')
const chatMessages      = ref([])
const unreadChatCount   = ref(0)
const unreadMessagesByTable = ref({})

// ── refs ─────────────────────────────────────────────
const mainContent = ref(null)
const chatMessagesRef = ref(null)

// ── 데이터 ───────────────────────────────────────────
const categories = [
  { id: 'main',    name: '메인 요리' },
  { id: 'side',    name: '사이드' },
  { id: 'drink',   name: '음료' },
  { id: 'dessert', name: '디저트' },
]

const menus = [
  { id: 1, category: 'main',    name: '불고기',    description: '부드러운 한우 불고기',  price: 18000, icon: '🥩', options: ['보통맛', '매운맛', '순한맛'] },
  { id: 2, category: 'main',    name: '김치찌개',  description: '얼큰한 김치찌개',        price: 9000,  icon: '🍲', options: ['보통맛', '매운맛'] },
  { id: 3, category: 'main',    name: '된장찌개',  description: '구수한 된장찌개',        price: 8000,  icon: '🍲', options: null },
  { id: 4, category: 'side',    name: '김치전',    description: '바삭한 김치전',          price: 12000, icon: '🥞', options: null },
  { id: 5, category: 'side',    name: '계란말이',  description: '부드러운 계란말이',      price: 8000,  icon: '🍳', options: null },
  { id: 6, category: 'drink',   name: '콜라',      description: '시원한 콜라',            price: 2000,  icon: '🥤', options: ['일반', '제로'] },
  { id: 7, category: 'drink',   name: '사이다',    description: '청량한 사이다',          price: 2000,  icon: '🥤', options: ['일반', '제로'] },
  { id: 8, category: 'drink',   name: '소주',      description: '참이슬',                 price: 4000,  icon: '🍶', options: null },
  { id: 9, category: 'dessert', name: '아이스크림',description: '달콤한 아이스크림',      price: 5000,  icon: '🍨', options: ['바닐라', '초콜릿', '딸기'] },
]

const cartItems = ref([])
const orderHistory = ref([
  {
    groupId: 'G001',
    items: [
      { id: 1, name: '불고기',   option: '매운맛', quantity: 2, price: 18000 },
      { id: 2, name: '김치찌개', option: null,      quantity: 1, price: 9000 },
    ],
  },
  {
    groupId: 'G002',
    items: [
      { id: 3, name: '콜라', option: null, quantity: 3, price: 2000 },
    ],
  },
])

const availableTables = [1,2,3,4,5,6,7,8,9,10,11,12]

// ── computed ─────────────────────────────────────────
const totalPrice = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const isPanelOpen = computed(() =>
    showOrderHistory.value || showCart.value || showGiftPanel.value || showChatPanel.value
)

// ── 유틸 ─────────────────────────────────────────────
const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')
const getMenusByCategory = (catId) => menus.filter((m) => m.category === catId)
const getUnreadCountForTable = (t) => unreadMessagesByTable.value[t] || 0

const updateTotalUnreadCount = () => {
  unreadChatCount.value = Object.values(unreadMessagesByTable.value).reduce((s, c) => s + c, 0)
}

// ── 스크롤 감지 → 사이드바 동기화 ───────────────────
const handleScroll = (e) => {
  const container = e.target
  const sections  = mainContent.value?.querySelectorAll('.menu-section') ?? []
  const scrollPos = container.scrollTop + 100
  const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50

  if (isAtBottom) {
    currentCategory.value = sections[sections.length - 1]?.dataset.category ?? currentCategory.value
    return
  }
  for (const sec of sections) {
    if (scrollPos >= sec.offsetTop && scrollPos < sec.offsetTop + sec.offsetHeight) {
      currentCategory.value = sec.dataset.category
      break
    }
  }
}

const selectCategory = (catId) => {
  currentCategory.value = catId
  const sec = mainContent.value?.querySelector(`[data-category="${catId}"]`)
  sec?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── 직원 호출 ─────────────────────────────────────────
const callStaff = () => alert('직원을 호출했습니다. 잠시만 기다려주세요.')

// ── 메뉴 상세 ─────────────────────────────────────────
const openMenuDetail = (menu) => {
  selectedMenu.value   = menu
  selectedOption.value = menu.options?.[0] ?? null
  isGiftMode.value     = false
  showMenuDetail.value = true
}

const openGiftMenuDetail = (menu) => {
  selectedMenu.value   = menu
  selectedOption.value = menu.options?.[0] ?? null
  isGiftMode.value     = true
  showMenuDetail.value = true
}

const closeMenuDetail = () => {
  showMenuDetail.value = false
  selectedMenu.value   = null
  selectedOption.value = null
  isGiftMode.value     = false
}

// ── 장바구니 ─────────────────────────────────────────
const addToCartFromDetail = () => {
  if (!selectedMenu.value) return
  const existing = cartItems.value.find(
      (i) => i.id === selectedMenu.value.id && i.option === selectedOption.value
  )
  if (existing) {
    existing.quantity++
  } else {
    cartItems.value.push({
      id:       selectedMenu.value.id,
      name:     selectedMenu.value.name,
      price:    selectedMenu.value.price,
      quantity: 1,
      option:   selectedOption.value,
    })
  }
  alert(`${selectedMenu.value.name}이(가) 장바구니에 담겼습니다.`)
  closeMenuDetail()
}

const increaseQuantity = (idx) => cartItems.value[idx].quantity++

const decreaseQuantity = (idx) => {
  if (cartItems.value[idx].quantity > 1) {
    cartItems.value[idx].quantity--
  } else {
    if (confirm('장바구니에서 삭제하시겠습니까?')) cartItems.value.splice(idx, 1)
  }
}

// ── 패널 열기/닫기 ────────────────────────────────────
const closePanel = () => {
  showOrderHistory.value = false
  showCart.value         = false
  showGiftPanel.value    = false
  showChatPanel.value    = false
}

const openOrderHistory = () => { closePanel(); showOrderHistory.value = true }
const openCart         = () => { closePanel(); showCart.value         = true }

// ── 주문 ─────────────────────────────────────────────
const placeOrder = () => {
  if (confirm(`총 ${formatPrice(totalPrice.value)}원을 주문하시겠습니까?`)) {
    alert('주문이 완료되었습니다!')
    cartItems.value = []
    closePanel()
  }
}

// ── 채팅 모달 ─────────────────────────────────────────
const openChatModal  = () => { showChatModal.value = true; selectedTable.value = null }
const closeChatModal = () => { showChatModal.value = false; selectedTable.value = null }
const selectTable    = (t)  => { selectedTable.value = t }

const openChat = () => {
  selectedChatTable.value = selectedTable.value
  if (unreadMessagesByTable.value[selectedTable.value]) {
    unreadMessagesByTable.value[selectedTable.value] = 0
  }
  updateTotalUnreadCount()
  closeChatModal()
  closePanel()
  showChatPanel.value = true
  chatMessages.value = [
    { text: '안녕하세요! 무엇을 도와드릴까요?', isMine: false, time: '14:30' },
    { text: '물 좀 주세요',                     isMine: true,  time: '14:31' },
  ]
}

const openGift = () => {
  selectedGiftTable.value = selectedTable.value
  closeChatModal()
  closePanel()
  showGiftPanel.value = true
}

const closeGiftPanel = () => {
  showGiftPanel.value    = false
  selectedGiftTable.value = null
}

const closeChatPanel = () => {
  showChatPanel.value    = false
  selectedChatTable.value = null
  chatMessages.value     = []
  chatInput.value        = ''
}

const sendGift = () => {
  if (!selectedMenu.value) return
  const optStr = selectedOption.value ? ` (${selectedOption.value})` : ''
  alert(`${selectedGiftTable.value}번 테이블에 ${selectedMenu.value.name}${optStr}을(를) 선물했습니다!`)
  closeMenuDetail()
  closeGiftPanel()
}

// ── 채팅 ─────────────────────────────────────────────
const sendMessage = () => {
  if (!chatInput.value.trim()) return
  const now  = new Date()
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  chatMessages.value.push({ text: chatInput.value, isMine: true, time })
  chatInput.value = ''
  nextTick(() => {
    if (chatMessagesRef.value) chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  })
}

// ── 시뮬레이션 ───────────────────────────────────────
onMounted(() => {
  setTimeout(() => { unreadMessagesByTable.value[3] = 1; updateTotalUnreadCount() }, 5000)
  setTimeout(() => { unreadMessagesByTable.value[7] = 2; updateTotalUnreadCount() }, 10000)
  setTimeout(() => { unreadMessagesByTable.value[3] = 2; updateTotalUnreadCount() }, 15000)
})
</script>

<style scoped>
/* ── CSS 변수 ─────────────────────────────────────── */
.app-root {
  --primary:        #ea580c;
  --primary-dark:   #c2410c;
  --primary-light:  #fb923c;
  --bg-dark:        #0a0a0a;
  --bg-secondary:   #18181b;
  --card:           #27272a;
  --card-hover:     #3f3f46;
  --text:           #fafafa;
  --text-secondary: #a1a1aa;
  --border:         #3f3f46;

  display:     flex;
  height:      100vh;
  background:  var(--bg-dark);
  color:        var(--text);
  overflow:    hidden;
  font-family: 'Noto Sans KR', sans-serif;
}

/* ── 사이드바 ─────────────────────────────────────── */
.sidebar {
  width: 200px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.table-info {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}

.table-number {
  font-size: 28px;
  font-weight: 900;
  color: var(--primary);
  margin-bottom: 4px;
}

.table-label {
  font-size: 12px;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.category-list {
  flex: 1;
  padding: 16px 12px;
}

.category-item {
  padding: 14px 16px;
  margin-bottom: 8px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary);
  border: 1px solid transparent;
}

.category-item:hover {
  background: rgba(234, 88, 12, 0.1);
  color: var(--primary-light);
  border-color: rgba(234, 88, 12, 0.3);
}

.category-item.active {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  font-weight: 700;
  box-shadow: 0 4px 15px rgba(234, 88, 12, 0.4);
}

.category-item.call-staff {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.category-item.call-staff:hover {
  background: rgba(59, 130, 246, 0.2);
}

/* ── 메인 컨텐츠 ──────────────────────────────────── */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.menu-section    { margin-bottom: 48px; }

.section-title {
  font-size: 24px;
  font-weight: 900;
  color: var(--text);
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--primary);
}

/* ── 메뉴 그리드 ──────────────────────────────────── */
.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.menu-card {
  background: var(--card);
  border-radius: 16px;
  border: 1px solid var(--border);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(234, 88, 12, 0.2);
  border-color: var(--primary);
}

.menu-image {
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, #3f3f46 0%, #27272a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.menu-info        { padding: 16px; }
.menu-name        { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.menu-description { font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4; }
.menu-price       { font-size: 18px; font-weight: 900; color: var(--primary); }

/* ── 플로팅 버튼 ──────────────────────────────────── */
.floating-buttons {
  position: fixed;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 100;
  transition: all 0.3s ease;
}

.floating-buttons.hidden {
  opacity: 0;
  pointer-events: none;
}

.floating-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.4);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.floating-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 24px rgba(234, 88, 12, 0.6);
}

.badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

/* ── 슬라이드 패널 공통 ───────────────────────────── */
.slide-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: var(--card);
  border-left: 1px solid var(--border);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 200;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
}

.slide-panel.open { transform: translateX(0); }

.panel-header {
  padding: 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title { font-size: 20px; font-weight: 900; color: var(--text); }

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.panel-footer {
  padding: 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-secondary);
}

/* ── 주문내역 ─────────────────────────────────────── */
.order-group {
  margin-bottom: 24px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
}

.group-header {
  font-size: 14px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.order-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
.order-item:last-child { border-bottom: none; }

.order-item-name   { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.order-item-option { font-size: 12px; color: var(--text-secondary); margin-bottom: 4px; }

.order-item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.order-item-quantity { color: var(--text-secondary); }
.order-item-price    { font-weight: 700; color: var(--primary); }

/* ── 장바구니 ─────────────────────────────────────── */
.cart-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border);
  margin-bottom: 12px;
}

.cart-item-name   { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.cart-item-option { font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }

.cart-item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--card-hover);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.quantity-btn:hover { background: var(--primary); border-color: var(--primary); }

.quantity-value { font-size: 14px; font-weight: 700; min-width: 24px; text-align: center; }
.cart-item-price { font-size: 16px; font-weight: 900; color: var(--primary); }

.total-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--card);
  border-radius: 12px;
}

.total-label  { font-size: 16px; font-weight: 700; }
.total-amount { font-size: 24px; font-weight: 900; color: var(--primary); }

.order-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.4);
}

.order-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(234, 88, 12, 0.6);
}

/* ── 선물하기 패널 ────────────────────────────────── */
.menu-section-small { margin-bottom: 32px; }

.section-title-small {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.menu-list-small { display: flex; flex-direction: column; gap: 12px; }

.menu-item-small {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-item-small:hover {
  background: var(--card-hover);
  border-color: var(--primary);
  transform: translateX(4px);
}

.menu-icon-small {
  font-size: 36px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card);
  border-radius: 12px;
  flex-shrink: 0;
}

.menu-name-small  { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.menu-price-small { font-size: 14px; font-weight: 700; color: var(--primary); }

/* ── 채팅 패널 ────────────────────────────────────── */
.chat-content { padding: 0; }

.chat-messages {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.chat-message        { display: flex; }
.chat-message.mine   { justify-content: flex-end; }
.chat-message.theirs { justify-content: flex-start; }

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
}

.chat-message.mine .message-bubble {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-message.theirs .message-bubble {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  color: var(--text);
  border-bottom-left-radius: 4px;
}

.message-text { font-size: 14px; line-height: 1.5; word-wrap: break-word; }
.message-time { font-size: 11px; margin-top: 6px; opacity: 0.7; }

.chat-footer {
  display: flex;
  gap: 12px;
  background: var(--bg-secondary);
}

.chat-input {
  flex: 1;
  padding: 12px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font-size: 14px;
  font-family: 'Noto Sans KR', sans-serif;
  outline: none;
  transition: all 0.3s ease;
}

.chat-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
}

.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.4);
}

/* ── 모달 공통 ────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.modal-content {
  background: var(--card);
  border-radius: 20px;
  border: 1px solid var(--border);
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 22px;
  font-weight: 900;
  margin-bottom: 20px;
}

/* ── 채팅 테이블 선택 모달 ────────────────────────── */
.table-select-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.table-select-btn {
  padding: 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.table-select-btn:hover {
  background: var(--card-hover);
  border-color: var(--primary);
  color: var(--primary);
}

.table-select-btn.selected {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.table-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 7px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.modal-action-buttons { display: flex; gap: 12px; }

.action-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.action-btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  color: white;
}

.action-btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
}

/* ── 메뉴 상세 모달 ───────────────────────────────── */
.menu-detail-modal {
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.menu-detail-image {
  width: 100%;
  height: 300px;
  background: linear-gradient(135deg, #3f3f46 0%, #27272a 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 120px;
  margin-bottom: 24px;
}

.menu-detail-name  { font-size: 28px; font-weight: 900; margin-bottom: 12px; }
.menu-detail-price { font-size: 24px; font-weight: 900; color: var(--primary); margin-bottom: 16px; }

.menu-detail-description {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 32px;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.menu-options   { margin-bottom: 32px; }
.options-title  { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
.options-list   { display: flex; flex-direction: column; gap: 12px; }

.option-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 2px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-item:hover { border-color: var(--primary); background: var(--card-hover); }

.option-item input[type='radio'] {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  cursor: pointer;
  accent-color: var(--primary);
}

.option-label { font-size: 15px; font-weight: 600; }

.menu-detail-footer { display: flex; gap: 12px; }

.cancel-detail-btn {
  flex: 1;
  padding: 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-detail-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.add-cart-btn {
  flex: 2;
  padding: 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(234, 88, 12, 0.4);
}

.add-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(234, 88, 12, 0.6);
}

/* ── 빈 상태 ──────────────────────────────────────── */
.empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
.empty-icon  { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
.empty-text  { font-size: 14px; }

/* ── 스크롤바 ─────────────────────────────────────── */
::-webkit-scrollbar       { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

/* ── 반응형 ───────────────────────────────────────── */
@media (max-width: 768px) {
  .sidebar { width: 160px; }
  .slide-panel { width: 100%; }
  .floating-buttons { right: 16px; }
  .floating-btn { width: 56px; height: 56px; font-size: 20px; }
}
</style>