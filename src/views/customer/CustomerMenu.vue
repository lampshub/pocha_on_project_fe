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
        <h2 class="section-title" style="text-align: left !important">{{ cat.name }}</h2>
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
              <div class="cart-item-price">{{ formatPrice(item.price) }}원</div>
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
        <div class="quantity-controls">
          <button class="quantity-btn" @click="menuQuantity = Math.max(1, menuQuantity - 1)">-</button>
          <span class="quantity-value">{{ menuQuantity }}</span>
          <button class="quantity-btn" @click="menuQuantity = Math.min(99, menuQuantity + 1)">+</button>
        </div>
        <div class="menu-detail-description">{{ selectedMenu?.description }}</div>

        <div v-if="selectedMenu?.options?.length" class="menu-options">
          <div v-for="(opt, idx) in selectedMenu.options" :key="idx" class="option-group">
            <h3 class="options-title">{{ opt.optionName }}</h3>
            <div class="options-list">
              <label
                  v-for="detail in opt.mappingOptionDetailList"
                  :key="detail.optionDetailId"
                  class="option-item"
              >
                <input
                    type="radio"
                    :name="'option-' + opt.optionId"
                    :value="detail"
                    v-model="selectedOptions[opt.optionId]"
                />
                <span class="option-label">
              {{ detail.optionDetailName }}
              <span v-if="detail.optionDetailPrice > 0"> (+{{ formatPrice(detail.optionDetailPrice) }}원)</span>
            </span>
              </label>
            </div>
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
import {ref, computed, nextTick, onMounted} from 'vue'
import {customerMenuApi as customerOrderApi} from '@/api/customerMenuApi'
import {useToast} from "vue-toastification";

const toast = useToast();
const selectedTableData = JSON.parse(localStorage.getItem('selectedTable') || '{}');
// ── 상태 ─────────────────────────────────────────────
const tableNumber = ref(selectedTableData.tableNum || 0)
const currentCategory = ref('main')
const showOrderHistory = ref(false)
const showCart = ref(false)
const showChatModal = ref(false)
const showMenuDetail = ref(false)
const showGiftPanel = ref(false)
const showChatPanel = ref(false)
const selectedTable = ref(null)
const selectedGiftTable = ref(null)
const selectedChatTable = ref(null)
const selectedMenu = ref(null)
const selectedOptions = ref({})
const isGiftMode = ref(false)
const chatInput = ref('')
const chatMessages = ref([])
const unreadChatCount = ref(0)
const unreadMessagesByTable = ref({})

// ── refs ─────────────────────────────────────────────
const mainContent = ref(null)
const chatMessagesRef = ref(null)

// [수정-2] 카테고리/메뉴는 API 기반으로 바뀜
const categories = ref([])
const menus = ref([])

// [수정-3] cart/order도 서버 기준으로 관리
const cartItems = ref([])
const orderHistory = ref([])
const menuQuantity = ref(1)

const availableTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// [추가-3] 현재 주문 그룹ID 저장 키
const GROUP_ID_KEY = 'currentGroupId'

// ── computed ─────────────────────────────────────────
const totalPrice = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.price, 0)
)

const isPanelOpen = computed(() =>
    showOrderHistory.value || showCart.value || showGiftPanel.value || showChatPanel.value
)

// ── 유틸 ─────────────────────────────────────────────
const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')
const getMenusByCategory = (catId) => menus.value.filter((m) => m.category === catId)
const getUnreadCountForTable = (t) => unreadMessagesByTable.value[t] || 0

const updateTotalUnreadCount = () => {
  unreadChatCount.value = Object.values(unreadMessagesByTable.value).reduce((s, c) => s + c, 0)
}


const mapCartToViewModel = (cartDto) => {
  const lineList = cartDto?.cartDetailDto ?? cartDto?.items ?? []
  return lineList.map((line) => ({
    id: line.menuId,
    name: line.menuName,
    price: line.lineTotalPrice ?? 0,
    quantity: line.menuQuantity ?? line.quantity ?? 1,
    option: line.cartOptionDtoList?.length
        ? line.cartOptionDtoList
            .map(opt => `${opt.optionName}: ${opt.optionDetailNameList?.join(', ')}`)
            .join(' / ')
        : null,
    fieldKey: line.fieldKey,
    optionIds: line.optionIds ?? [],
  }))
}
const mapOrderListToViewModel = (listDto) => {
  // 백엔드 DTO 형태에 맞춰서 그룹 1개로 렌더링
  return [
    {
      groupId: localStorage.getItem(GROUP_ID_KEY),
      items: (listDto ?? []).map((o, idx) => ({
        id: o.orderingId ?? idx,
        name: o.menuName ?? '메뉴',
        option: o.optionName ?? null,
        quantity: o.quantity ?? 1,
        price: o.menuPrice ?? o.price ?? 0,
      })),
    },
  ]
}

// 초기 데이터 로드
const loadMenus = async () => {
  const {data} = await customerOrderApi.getCategories()

  categories.value = data.map((cat) => ({
    id: String(cat.categoryId),
    name: cat.categoryName,
  }))

  menus.value = data.flatMap((cat) =>
      (cat.mappingMenuList ?? []).map((m) => ({
        id: m.menuId,
        category: String(cat.categoryId),
        name: m.menuName ?? '메뉴',
        description: '',
        price: m.menuPrice ?? 0,
        icon: m.imageUrl ?? '🍽️',
        options: null,
      }))
  )
}

const loadCart = async () => {
  const {data} = await customerOrderApi.getCart()
  console.log('카트 원본 응답:', data)        // ← 여기
  console.log('매핑 후:', mapCartToViewModel(data))
  console.log('카트 원본 응답:', JSON.stringify(data))
  cartItems.value = mapCartToViewModel(data)
}

const loadOrderHistory = async () => {
  const groupId = localStorage.getItem(GROUP_ID_KEY)
  if (!groupId) {
    orderHistory.value = []
    return
  }
  const {data} = await customerOrderApi.getOrderList(groupId)
  orderHistory.value = mapOrderListToViewModel(data)
}

// ── 스크롤 감지 → 사이드바 동기화 ───────────────────
const handleScroll = (e) => {
  const container = e.target
  const sections = mainContent.value?.querySelectorAll('.menu-section') ?? []
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
  sec?.scrollIntoView({behavior: 'smooth', block: 'start'})
}

// ── 직원 호출 ─────────────────────────────────────────
const callStaff = () => alert('직원을 호출했습니다. 잠시만 기다려주세요.')

// ── 메뉴 상세 ─────────────────────────────────────────
const openMenuDetail = async (menu) => {
  try {
    const {data} = await customerOrderApi.getMenuDetail(menu.id)
    selectedMenu.value = {
      id: data.menuId,
      name: data.menuName,
      price: data.menuPrice,
      icon: menu.icon,
      description: '',
      options: data.mappingOptionList ?? [],
    }
    selectedOptions.value = selectedMenu.value.options?.[0] ?? null
    selectedOptions.value = {}
    isGiftMode.value = false
    showMenuDetail.value = true
  } catch (e) {
    console.error(e)
    alert('메뉴 정보를 불러오지 못했습니다.')
  }
}

const openGiftMenuDetail = async (menu) => {
  try {
    const {data} = await customerOrderApi.getMenuDetail(menu.id)
    selectedMenu.value = {
      id: data.menuId,
      name: data.menuName,
      price: data.menuPrice,
      icon: menu.icon,
      description: '',
      options: data.mappingOptionList ?? [],
    }
    selectedOptions.value = selectedMenu.value.options?.[0] ?? null
    selectedOptions.value = {}
    isGiftMode.value = true
    showMenuDetail.value = true
  } catch (e) {
    console.error(e)
    alert('메뉴 정보를 불러오지 못했습니다.')
  }
}

const closeMenuDetail = () => {
  showMenuDetail.value = false
  selectedMenu.value = null
  selectedOptions.value = null
  selectedOptions.value = {}
  isGiftMode.value = false
}
// ── 장바구니 ────────────────────────────────────────
// 로컬 push 대신 API
const addToCartFromDetail = async () => {
  if (!selectedMenu.value) return


  //[{ optionId, optionDetailId: [id] }] 형태
  const optionIdList = Object.entries(selectedOptions.value)
      .filter(([, detail]) => detail != null)
      .map(([optionId, detail]) => ({
        optionId: Number(optionId),
        optionDetailId: [detail.optionDetailId],
      }))

  const payload = {
    createDetailDto: [
      {
        menuId: selectedMenu.value.id,
        menuQuantity: menuQuantity.value,
        optionId: optionIdList
      },
    ],
  }

  await customerOrderApi.createCartLine(payload)
  await loadCart()

  alert(`${selectedMenu.value.name}이(가) 장바구니에 담겼습니다.`)
  closeMenuDetail()
}

// +버튼 API 연결
const increaseQuantity = async (idx) => {
  const line = cartItems.value[idx]
  if (!line) return

  await customerOrderApi.updateCartQty({
    menuId: line.id,
    delta: 1,
    optionIds: line.optionIds ?? [],
    fieldKey: line.fieldKey,
  })
  await loadCart()
}

// -버튼 API 연결
const decreaseQuantity = async (idx) => {
  const line = cartItems.value[idx]
  if (!line) return

  if (line.quantity > 1) {
    await customerOrderApi.updateCartQty({
      menuId: line.id,
      delta: -1,
      optionIds: line.optionIds ?? [],
      fieldKey: line.fieldKey,
    })
  } else {
    if (!confirm('장바구니에서 삭제하시겠습니까?')) return
    await customerOrderApi.deleteCartLine({fieldKey: line.fieldKey})
  }

  await loadCart()
}

// ── 패널 열기/닫기 ────────────────────────────────────
const closePanel = () => {
  showOrderHistory.value = false
  showCart.value = false
  showGiftPanel.value = false
  showChatPanel.value = false
}

// 주문내역 패널 열 때 서버 조회
const openOrderHistory = async () => {
  closePanel()
  await loadOrderHistory()
  showOrderHistory.value = true
}

const openCart = async () => {
  closePanel()
  await loadCart()
  showCart.value = true
}

// ── 주문 ─────────────────────────────────────────────
// 주문하기 API 연결 (create/add 분기)
const placeOrder = async () => {
  if (!cartItems.value.length) {
    alert('장바구니가 비어있습니다.')
    return
  }

  if (!confirm(`총 ${formatPrice(totalPrice.value)}원을 주문하시겠습니까?`)) return

  const payload = {
    tableNumber: tableNumber.value,
    idempotencyKey: crypto.randomUUID(),
    webMenuList: [],
  }

  let currentGroupId = localStorage.getItem(GROUP_ID_KEY)
  let returnedGroupId;
  if (currentGroupId) {
    try {
      const {data} = await customerOrderApi.addOrder(currentGroupId, payload);
      returnedGroupId = data;
    } catch (e) {
      console.warn("추가 주문 실패, 새주문 생성 : ", e);
      localStorage.removeItem(GROUP_ID_KEY);
      const {data} = await customerOrderApi.createOrder(payload);
      returnedGroupId = data
    }
  } else {
    const {data} = await customerOrderApi.createOrder(payload);
    returnedGroupId = data;
  }
  localStorage.setItem(GROUP_ID_KEY, returnedGroupId)

  toast.success('주문이 완료되었습니다!');
  await loadCart()         // 주문 후 카트 비워졌는지 서버 동기화
  await loadOrderHistory() // 주문내역 동기화
  closePanel()
}

// ── 채팅 모달 ─────────────────────────────────────────

const openChatModal = () => {
  showChatModal.value = true;
  selectedTable.value = null
}
const closeChatModal = () => {
  showChatModal.value = false;
  selectedTable.value = null
}
const selectTable = (t) => {
  selectedTable.value = t
}

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
    {text: '안녕하세요! 무엇을 도와드릴까요?', isMine: false, time: '14:30'},
    {text: '물 좀 주세요', isMine: true, time: '14:31'},
  ]
}

const openGift = () => {
  selectedGiftTable.value = selectedTable.value
  closeChatModal()
  closePanel()
  showGiftPanel.value = true
}

const closeGiftPanel = () => {
  showGiftPanel.value = false
  selectedGiftTable.value = null
}

const closeChatPanel = () => {
  showChatPanel.value = false
  selectedChatTable.value = null
  chatMessages.value = []
  chatInput.value = ''
}

const sendGift = () => {
  if (!selectedMenu.value) return
  const optStr = selectedOptions.value ? ` (${selectedOptions.value})` : ''
  alert(`${selectedGiftTable.value}번 테이블에 ${selectedMenu.value.name}${optStr}을(를) 선물했습니다!`)
  closeMenuDetail()
  closeGiftPanel()
}

// ── 채팅 ─────────────────────────────────────────────
const sendMessage = () => {
  if (!chatInput.value.trim()) return
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  chatMessages.value.push({text: chatInput.value, isMine: true, time})
  chatInput.value = ''
  nextTick(() => {
    if (chatMessagesRef.value) chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
  })
}

// ── 초기 로딩 ───────────────────────────────────────
// 시뮬레이션 제거, 실제 API 로딩
onMounted(async () => {
  try {
    await Promise.all([loadMenus(), loadCart()])
  } catch (e) {
    console.error(e)
    alert('초기 데이터 로딩에 실패했습니다. 토큰/서버 상태를 확인해주세요.')
  }
})
</script>


<style scoped>
@import "@/assets/css/customerMenu.css";
</style>