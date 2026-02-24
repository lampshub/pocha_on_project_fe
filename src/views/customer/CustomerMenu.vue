<template>
  <div class="app-root">
    <!-- ── 왼쪽 사이드바 ─────────────────────────────── -->
    <aside class="sidebar">
      <div class="table-info" @click="handleHiddenAdminTrigger" style="cursor: default;">
        <div class="table-number">{{ tableNum }}</div>
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
      <div class="sidebar-bottom">
        <div class="category-item payment-btn" @click="handlePayment">
          💳 결제하기
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
        <h2 class="section-title" style="text-align: left !important">
          {{ cat.name }}
        </h2>
        <div class="menu-grid">
          <!-- [수정] openPresentMenuDetail → openMenuDetail, class → menu-card -->
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
      <button class="floating-btn" @click="openChatModal" title="채팅/선물">
        {{ presentUnread ? '🎁' : '💬' }}
        <span v-if="presentUnread" class="badge" style="background:#7c3aed;">!</span>
        <span v-else-if="unreadChatCount > 0" class="badge">{{ unreadChatCount }}</span>
      </button>

      <button class="floating-btn" @click="openOrderHistory" title="주문내역">
        📋
        <span v-if="newOrderCount > 0" class="badge">{{ newOrderCount }}</span>
      </button>

      <button class="floating-btn" @click="openCart" title="장바구니">
        🛒
        <span v-if="cartItems.length > 0" class="badge">{{ cartItems.length }}</span>
      </button>
    </div>

    <div
        v-if="showSettingsModal"
        class="modal-overlay"
        @click.self="closeSettingsModal"
    >
      <div class="modal-content admin-auth-modal">
        <h2 class="modal-title">관리자 인증</h2>
        <p class="modal-subtitle">
          매장 설정을 위해 점주 비밀번호를 입력해주세요.
        </p>
        <input
            type="password"
            v-model="adminPassword"
            class="admin-password-input"
            placeholder="비밀번호 입력"
            @keyup.enter="verifyAdminPassword"
        />
        <div class="modal-action-buttons">
          <button
              class="action-btn action-btn-primary"
              @click="verifyAdminPassword"
          >
            확인
          </button>
          <button
              class="action-btn action-btn-secondary"
              @click="closeSettingsModal"
          >
            취소
          </button>
        </div>
      </div>
    </div>

    <!-- 선물 도착 토스트 알림 -->
    <div v-if="showPresentToast" class="present-toast" @click="onPresentToastClick">
      <div class="present-toast-icon">🎁</div>
      <div class="present-toast-content">
        <div class="present-toast-title">선물이 도착했습니다!</div>
        <div class="present-toast-desc">
          {{ presentNotification?.fromTable }}번 테이블에서 {{ presentNotification?.menuName }}을(를) 선물했어요
        </div>
      </div>
      <div class="present-toast-timer">탭하여 확인</div>
    </div>

    <!-- ── 주문내역 패널 ───────────────────────────────── -->
    <div class="slide-panel" :class="{ open: showOrderHistory }">
      <div class="panel-header">
        <h2 class="panel-title">주문 내역</h2>
        <button class="close-btn" @click="closePanel">✕</button>
      </div>

      <div class="panel-content">
        <div v-if="orderHistory.length > 0">
          <div
              v-for="group in orderHistory"
              :key="group.groupId"
              class="order-group"
          >
            <div class="group-header">그룹 ID: {{ group.groupId }}</div>

            <div v-for="item in group.items" :key="item.id" class="order-item">
              <div class="order-item-name">{{ item.name }}</div>
              <div class="order-item-option">{{ item.option || "옵션 X" }}</div>
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
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="cart-item-name">{{ item.name }}</div>
              <button @click="deleteCartLine(idx)"
                      style="background:none; border:none; color:var(--text-secondary); font-size:16px; cursor:pointer; padding:0;">
                ✕
              </button>
            </div>
            <div class="cart-item-option">{{ item.option || '옵션 X' }}</div>
            <div class="cart-item-controls">
              <div class="quantity-controls">
                <button class="quantity-btn" @click="decreaseQuantity(idx)" :disabled="item.quantity <= 1">-</button>
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
        <div style="display: flex; gap: 12px; width: 100%;">
          <button class="order-btn" @click="placeOrder">주문하기</button>
        </div>
      </div>
    </div>

    <!-- ── 선물하기 패널 ───────────────────────────────── -->
    <div class="slide-panel" :class="{ open: showPresentPanel }">
      <div class="panel-header">
        <h2 class="panel-title">{{ selectedPresentTable }}번 테이블에 선물하기</h2>
        <button class="close-btn" @click="closePresentPanel">✕</button>
      </div>
      <div class="panel-content">
        <div v-for="cat in categories" :key="cat.id" class="menu-section-small">
          <h3 class="section-title-small">{{ cat.name }}</h3>
          <div class="menu-list-small">
            <!-- [수정] v-for div 닫힘 문제 수정 + 주석 제거 -->
            <div
                v-for="menu in getMenusByCategory(cat.id)"
                :key="menu.id"
                class="menu-item-small"
                @click="openPresentMenuDetail(menu)"
            >
              <div class="menu-icon-small">{{ menu.icon }}</div>
              <div class="menu-info-small">
                <div class="menu-name-small">{{ menu.name }}</div>
                <div class="menu-price-small">
                  {{ formatPrice(menu.price) }}원
                </div>
              </div>
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
        <div class="chat-messages" ref="chatMessagesRef">
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
  <div class="modal-content table-select-modal">
    <div class="modal-header">
      <h3>채팅할 테이블 선택</h3>
      <button class="close-btn" @click="closeChatModal">×</button>
    </div>

    <div class="modal-body">
      <div v-if="activeTables.length === 0" class="no-tables">
        현재 대화 가능한 테이블이 없습니다.
      </div>

      <div v-else class="table-grid">
        <div
          v-for="t in activeTables"
          :key="t"
          :class="['table-item', { selected: selectedTable === t }]"
          @click="selectTable(t)"
        >
          <span class="table-name">{{ t }}번</span>
          <span v-if="getUnreadCountForTable(t) > 0" class="unread-badge">
            {{ getUnreadCountForTable(t) }}
          </span>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button
        class="confirm-btn"
        :disabled="!selectedTable"
        @click="openChat"
      >
        채팅 시작하기
      </button>
      <button
            class="action-btn action-btn-primary"
            :disabled="!selectedTable"
            @click="openPresent"
        >
          선물하기
        </button>
        <button
            class="action-btn action-btn-secondary"
            @click="closeChatModal"
          >
            취소
          </button>
    </div>
  </div>
</div>


  <!-- ── 메뉴 상세 모달 ─────────────────────────────── -->
  <div
      v-if="showMenuDetail"
      class="modal-overlay"
      @click.self="closeMenuDetail"
  >
    <div class="modal-content menu-detail-modal">
      <div class="menu-detail-image">{{ selectedMenu?.icon }}</div>
      <h2 class="menu-detail-name">{{ selectedMenu?.name }}</h2>
      <div class="menu-detail-price">
        {{ formatPrice(selectedMenu?.price ?? 0) }}원
      </div>
      <div class="quantity-controls">
        <button
            class="quantity-btn"
            @click="menuQuantity = Math.max(1, menuQuantity - 1)"
        >
          -
        </button>
        <span class="quantity-value">{{ menuQuantity }}</span>
        <button
            class="quantity-btn"
            @click="menuQuantity = Math.min(99, menuQuantity + 1)"
        >
          +
        </button>
      </div>
      <div class="menu-detail-description">
        {{ selectedMenu?.description }}
      </div>

      <div v-if="selectedMenu?.options?.length" class="menu-options">
        <div
            v-for="(opt, idx) in selectedMenu.options"
            :key="idx"
            class="option-group"
        >
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
                  <span v-if="detail.optionDetailPrice > 0">
                    (+{{ formatPrice(detail.optionDetailPrice) }}원)</span
                  >
                </span>
            </label>
          </div>
        </div>
      </div>

      <div class="menu-detail-footer">
        <button class="cancel-detail-btn" @click="closeMenuDetail">취소</button>
        <button v-if="!isPresentMode" class="add-cart-btn" @click="addToCartFromDetail">
          🛒 장바구니 담기
        </button>
        <button v-else class="add-cart-btn" @click="sendPresent">
          🎁 메뉴 선물하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { customerMenuApi as customerOrderApi } from '@/api/customerMenuApi'
import { useToast } from "vue-toastification";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import axios from "axios";
import { chatApi } from '@/api/customerChatApi';
import api from '@/api/axios'

const toast = useToast();
const router = useRouter();

// 로컬 스토리지 데이터 안전하게 가져오기
const selectedTableData = JSON.parse(localStorage.getItem("selectedTable") || "{}");
const adminPassword = ref("");
const showSettingsModal = ref(false);
const currentChatRoom = ref(null); // 현재 활성화된 채팅방 정보
const storeId = ref(selectedTableData.storeId || 1); // 스토어 ID (localStorage에서 가져옴)
const currentSubscription = ref(null); // 구독 객체 저장용

// ── 상태 ─────────────────────────────────────────────

const GROUP_ID_KEY = "currentGroupId";

// ── 상태 ─────────────────────────────────────────────
const tableNum = ref(selectedTableData.tableNum || 0)
const currentCategory = ref('main')
const showOrderHistory = ref(false)
const showCart = ref(false)
const showChatModal = ref(false)
const showMenuDetail = ref(false)
const showPresentPanel = ref(false)
const showChatPanel = ref(false)
const selectedTable = ref(null)
const selectedPresentTable = ref(null)
const selectedChatTable = ref(null)
const selectedMenu = ref(null)
const selectedOptions = ref({})
const isPresentMode = ref(false)
const chatInput = ref('')
const chatMessages = ref([])
const unreadChatCount = ref(0)
const unreadMessagesByTable = ref({})
const newOrderCount = ref(0)
const presentNotification = ref(null)
const presentUnread = ref(false)
const presentToastTimer = ref(null)
const showPresentToast = ref(false)
const accessToken = ref(localStorage.getItem('accessToken'))
const groupId = localStorage.getItem(GROUP_ID_KEY);
const clickCount = ref(0);
const lastClickTime = ref(0);
const tableStompClient = ref(null);

// ── refs ─────────────────────────────────────────────
const mainContent = ref(null);
const chatMessagesRef = ref(null);
const activeTables = ref([]);

const categories = ref([]);
const menus = ref([]);

const cartItems = ref([]);
const orderHistory = ref([]);
const menuQuantity = ref(1);


// ── computed ─────────────────────────────────────────
const totalPrice = computed(() =>
    cartItems.value.reduce((sum, item) => sum + item.price, 0),
);

const isPanelOpen = computed(
    () =>
        showOrderHistory.value ||
        showCart.value ||
        showPresentPanel.value ||
        showChatPanel.value,
);

// ── 유틸 ─────────────────────────────────────────────
const formatPrice = (price) => (price ?? 0).toLocaleString("ko-KR");
const getMenusByCategory = (catId) =>
    menus.value.filter((m) => m.category === catId);
const getUnreadCountForTable = (t) => unreadMessagesByTable.value[t] || 0;


const releaseTable = (isExitingApp = false) => {
  const tableData = JSON.parse(localStorage.getItem("selectedTable") || "{}");
  if (!tableData.tableNum) return;

  const url = `${process.env.VUE_APP_API_BASE_URL}/customertable/tablerollback`;

  if (isExitingApp === true || typeof isExitingApp === 'object') {
    const payload = JSON.stringify({ tableNum: tableData.tableNum });
    const blob = new Blob([payload], { type: "application/json" });
    const success = navigator.sendBeacon(url, blob);
    console.log("브라우저 종료/이동 시 Beacon 전송 결과:", success);
  } else {
    axios.post(url, { tableNum: tableData.tableNum }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
    }).catch(e => console.error("일반 이탈 시 해제 실패:", e));
  }

  localStorage.removeItem("selectedTable");
  localStorage.removeItem(GROUP_ID_KEY);
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatMessagesRef.value) {
    chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
  }
};

const loadAvailableTables = async () => {
  try {
    // chatApi.getAvailableTables() 대신 axios로 직접 호출
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/customertable/available`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        storeId: storeId.value // 필터에서 요구할 경우 추가
      }
    });

    // 데이터 매핑: DTO의 tableNum 리스트를 추출
    activeTables.value = response.data.map(t => t.tableNum);
    console.log("조회된 사용 중인 테이블:", activeTables.value);

  } catch (e) {
    console.error("사용 가능 테이블 로드 실패:", e);
    // 403 에러 등이 날 경우 브라우저 콘솔에서 상세 내용 확인 가능
  }
};

// ── 뒤로가기 방지 로직 ────────────────────────────────
const preventBack = () => {
  history.pushState(history.state, "", location.href);
};

// ── 관리자 설정 관련 함수 ─────────────────────────────
const openSettingsModal = () => {
  showSettingsModal.value = true;
};

const closeSettingsModal = () => {
  showSettingsModal.value = false;
  adminPassword.value = "";
};

const verifyAdminPassword = async () => {
  const selectedTableLocal = JSON.parse(localStorage.getItem("selectedTable"));
  if (!adminPassword.value) {
    toast.warning("비밀번호를 입력해주세요.");
    return;
  }

  try {
    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/owner/verify-password`, {
      password: adminPassword.value,
      customerTableId: selectedTableLocal.customerTableId
    }, {
      headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
    });

    const refreshToken = localStorage.getItem("refreshToken")?.trim();
    const response = await axios.create().post(
        `${process.env.VUE_APP_API_BASE_URL}/owner/refresh`,
        {},
        {headers: {'Authorization': `Bearer ${refreshToken}`}}
    );

    const {accessToken: newAccessToken, refreshToken: newRefreshToken} = response.data;
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    await releaseTable(false);
    toast.success("관리자 인증 성공. 매장 선택 화면으로 이동합니다.");
    router.push('/another/dashboard');

  } catch (e) {
    console.error(e);
    toast.error("인증에 실패했습니다. 비밀번호를 확인해주세요.");
  }
};

const handleHiddenAdminTrigger = () => {
  const now = Date.now();
  if (now - lastClickTime.value > 1000) {
    clickCount.value = 0;
  }
  lastClickTime.value = now;
  clickCount.value++;
  if (clickCount.value === 5) {
    clickCount.value = 0;
    openSettingsModal();
  }
};

onMounted(async () => {
  history.pushState(null, "", location.href);
  window.addEventListener("popstate", preventBack);
  window.addEventListener('pagehide', releaseTable);
  window.addEventListener('beforeunload', releaseTable);

  try {
    await Promise.all([loadMenus(), loadCart()]);
    connectTableWebSocket();
  } catch (e) {
    console.error("초기 로딩 실패", e);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", preventBack);
  window.removeEventListener('pagehide', releaseTable);
  window.removeEventListener('beforeunload', releaseTable);
});

onUnmounted(() => {
  if (presentToastTimer.value) clearTimeout(presentToastTimer.value);
  if (tableStompClient.value) {
    tableStompClient.value.deactivate();
  }
});

onBeforeRouteLeave((to, from, next) => {
  releaseTable(false);
  next();
});

const mapCartToViewModel = (cartDto) => {
  const lineList = cartDto?.cartDetailDto ?? cartDto?.items ?? [];
  return lineList.map((line) => ({
    id: line.menuId,
    name: line.menuName,
    price: line.lineTotalPrice ?? 0,
    quantity: line.menuQuantity ?? line.quantity ?? 1,
    option: line.cartOptionDtoList?.length
        ? line.cartOptionDtoList
            .map(
                (opt) =>
                    `${opt.optionName}: ${opt.optionDetailNameList?.join(", ")}`,
            )
            .join(" / ")
        : null,
    fieldKey: line.fieldKey,
    optionIds: line.optionIds ?? [],
  }));
};

const mapOrderListToViewModel = (listDto) => {
  return (listDto ?? []).map((ordering) => ({
    groupId: ordering.groupId,
    totalPrice: ordering.totalPrice,
    items: (ordering.listDetailDto ?? []).map((detail) => ({
      id: detail.menuId,
      name: detail.menuName,
      option: detail.orderDetailOpDto?.map(opt =>
          `${opt.optionName}: ${opt.orderDetailOptionDetailDto?.map(d => d.optionDetailName).join(', ')}`
      ).join(' / ') || null,
      quantity: detail.menuQuantity,
      price: detail.linePrice,
    }))
  }))
}

const loadMenus = async () => {
  const {data} = await customerOrderApi.getCategories();
  categories.value = data.map((cat) => ({
    id: String(cat.categoryId),
    name: cat.categoryName,
  }));
  menus.value = data.flatMap((cat) =>
      (cat.mappingMenuList ?? []).map((m) => ({
        id: m.menuId,
        category: String(cat.categoryId),
        name: m.menuName ?? "메뉴",
        description: "",
        price: m.menuPrice ?? 0,
        icon: m.imageUrl ?? "🍽️",
        options: null,
      })),
  );
};

const loadCart = async () => {
  const {data} = await customerOrderApi.getCart();
  cartItems.value = mapCartToViewModel(data);
};

const loadOrderHistory = async () => {
  const gid = localStorage.getItem(GROUP_ID_KEY);
  if (!gid) {
    orderHistory.value = [];
    return;
  }
  const {data} = await customerOrderApi.getOrderList(gid);
  orderHistory.value = mapOrderListToViewModel(data);
};

// ── 스크롤 감지 ──────────────────────────────────────
const handleScroll = (e) => {
  const container = e.target;
  const sections = mainContent.value?.querySelectorAll(".menu-section") ?? [];
  const scrollPos = container.scrollTop + 100;
  const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

  if (isAtBottom) {
    currentCategory.value =
        sections[sections.length - 1]?.dataset.category ?? currentCategory.value;
    return;
  }
  for (const sec of sections) {
    if (
        scrollPos >= sec.offsetTop &&
        scrollPos < sec.offsetTop + sec.offsetHeight
    ) {
      currentCategory.value = sec.dataset.category;
      break;
    }
  }
};

const selectCategory = (catId) => {
  currentCategory.value = catId;
  const sec = mainContent.value?.querySelector(`[data-category="${catId}"]`);
  sec?.scrollIntoView({behavior: "smooth", block: "start"});
};

// 직원호출
// const callStaff = async () => {
//   try {
//     const token = localStorage.getItem('accessToken')
//     const baseUrl = process.env.VUE_APP_API_BASE_URL
//     await axios.post(`${baseUrl}/sse/staffcall`, null, {
//       headers: { Authorization: `Bearer ${token}` }
//     })
//     toast.success('직원을 호출했습니다. 잠시만 기다려주세요.')
//   } catch (e) {
//     console.error('직원호출 실패:', e)
//     toast.error('직원 호출에 실패했습니다. 다시 시도해주세요.')
//   }
// }
const callStaff = async () => {
  try {
    await api.post('/sse/staffcall')
    toast.success('직원을 호출했습니다. 잠시만 기다려주세요.')
  } catch (e) {
    console.error('직원호출 실패:', e)
    toast.error('직원 호출에 실패했습니다.')
  }
}

// ── 메뉴 상세 ────────────────────────────────────────
// [수정] openMenuDetail 주석 해제 - 메인 메뉴에서 사용
const openMenuDetail = async (menu) => {
  try {
    const {data} = await customerOrderApi.getMenuDetail(menu.id);
    selectedMenu.value = {
      id: data.menuId,
      name: data.menuName,
      price: data.menuPrice,
      icon: menu.icon,
      description: "",
      options: data.mappingOptionList ?? [],
    }
    selectedOptions.value = {}
    isPresentMode.value = false
    showMenuDetail.value = true
  } catch (e) {
    console.error(e);
    toast.error("메뉴 정보를 불러오지 못했습니다.");
  }
};

// 선물하기 패널에서 사용
const openPresentMenuDetail = async (menu) => {
  try {
    const {data} = await customerOrderApi.getMenuDetail(menu.id);
    selectedMenu.value = {
      id: data.menuId,
      name: data.menuName,
      price: data.menuPrice,
      icon: menu.icon,
      description: "",
      options: data.mappingOptionList ?? [],
    }
    selectedOptions.value = {}
    isPresentMode.value = true
    showMenuDetail.value = true
  } catch (e) {
    console.error(e);
    toast.error("메뉴 정보를 불러오지 못했습니다.");
  }
};

const closeMenuDetail = () => {
  showMenuDetail.value = false
  selectedMenu.value = null
  selectedOptions.value = {}
  isPresentMode.value = false
}

// ── 장바구니 ────────────────────────────────────────
const addToCartFromDetail = async () => {
  if (!selectedMenu.value) return;

  const optionIdList = Object.entries(selectedOptions.value)
      .filter(([, detail]) => detail != null)
      .map(([optionId, detail]) => ({
        optionId: Number(optionId),
        optionDetailId: [detail.optionDetailId],
      }));

  const payload = {
    createDetailDto: [
      {
        menuId: selectedMenu.value.id,
        menuQuantity: menuQuantity.value,
        optionId: optionIdList,
      },
    ],
  };

  await customerOrderApi.createCartLine(payload);
  await loadCart();

  toast.success(`${selectedMenu.value.name}이(가) 장바구니에 담겼습니다.`);
  closeMenuDetail();
};

const increaseQuantity = async (idx) => {
  const line = cartItems.value[idx];
  if (!line) return;
  await customerOrderApi.updateCartQty({
    menuId: line.id,
    delta: 1,
    optionIds: line.optionIds ?? [],
    fieldKey: line.fieldKey,
  });
  await loadCart();
};

const decreaseQuantity = async (idx) => {
  const line = cartItems.value[idx]
  if (!line) return
  if (line.quantity > 1) {
    await customerOrderApi.updateCartQty({
      menuId: line.id,
      delta: -1,
      optionIds: line.optionIds ?? [],
      fieldKey: line.fieldKey,
    });
  } else {
    if (!confirm("장바구니에서 삭제하시겠습니까?")) return;
    await customerOrderApi.deleteCartLine({fieldKey: line.fieldKey});
  }
  await loadCart()
}

const deleteCartLine = async (idx) => {
  const line = cartItems.value[idx]
  if (!line) return
  if (!confirm('장바구니에서 삭제하시겠습니까?')) return
  await customerOrderApi.deleteCartLine({fieldKey: line.fieldKey})
  await loadCart()
}

// ── 패널 열기/닫기 ────────────────────────────────────
const closePanel = () => {
  showOrderHistory.value = false
  showCart.value = false
  showPresentPanel.value = false
  showChatPanel.value = false
}

const openOrderHistory = async () => {
  closePanel()
  await loadOrderHistory()
  newOrderCount.value = 0
  showOrderHistory.value = true
}

const openCart = async () => {
  closePanel();
  await loadCart();
  showCart.value = true;
};

// ── 주문 ─────────────────────────────────────────────
const placeOrder = async () => {
  if (!cartItems.value.length) {
    toast.warning("장바구니가 비어있습니다.");
    return;
  }

  if (!confirm(`총 ${formatPrice(totalPrice.value)}원을 주문하시겠습니까?`))
    return;

  const payload = {
    tableNumber: tableNum.value,
    idempotencyKey: crypto.randomUUID(),
    webMenuList: [],
  };

  let currentGroupId = localStorage.getItem(GROUP_ID_KEY);
  let returnedGroupId;
  if (currentGroupId) {
    try {
      const {data} = await customerOrderApi.addOrder(currentGroupId, payload);
      returnedGroupId = data;
    } catch (e) {
      console.warn("추가 주문 실패, 새주문 생성 : ", e);
      localStorage.removeItem(GROUP_ID_KEY);
      const {data} = await customerOrderApi.createOrder(payload);
      returnedGroupId = data;
    }
  } else {
    const {data} = await customerOrderApi.createOrder(payload);
    returnedGroupId = data;
  }
  localStorage.setItem(GROUP_ID_KEY, returnedGroupId);

  toast.success("주문이 완료되었습니다!");
  newOrderCount.value += 1
  await loadCart();
  await loadOrderHistory();
  closePanel();
};

const handlePayment = () => {
  router.push({
    name: 'CustomerPayment',
    params: {tableNumber: tableNum.value},
    query: {
      amount: totalPrice.value,
      groupId: groupId || ''
    }
  });
}

// ── 채팅 모달 ─────────────────────────────────────────

const openChatModal = async () => {
  await loadAvailableTables(); // 최신 사용 중인 테이블 목록 가져오기
  showChatModal.value = true;
  selectedTable.value = null;
};
const closeChatModal = () => {
  showChatModal.value = false;
  selectedTable.value = null;
};
const selectTable = (t) => {
  selectedTable.value = t;
};


const openPresent = () => {
  selectedPresentTable.value = selectedTable.value
  closeChatModal()
  closePanel()
  showPresentPanel.value = true
}

const closePresentPanel = () => {
  showPresentPanel.value = false
  selectedPresentTable.value = null
}

const closeChatPanel = () => {
  showChatPanel.value = false;
  selectedChatTable.value = null;
  chatMessages.value = [];
  chatInput.value = "";
};

// ── 채팅 ─────────────────────────────────────────────
const openChat = async () => {
  const otherTableNum = selectedTable.value;
  try {
    const { data: room } = await chatApi.getOrCreateRoom(otherTableNum);
    currentChatRoom.value = room;
    selectedChatTable.value = otherTableNum;

    // 1. 이전 메시지 내역 불러오기
    const { data: history } = await chatApi.getMessages(room.id);

    // 2. 메시지 포맷 변환 및 배열 할당
    chatMessages.value = history.map(msg => ({
      text: msg.message,
      isMine: Number(msg.senderTableNum) === Number(tableNum.value),
      time: formatTime(msg.createdAt)
    }));

    // 3. UI 표시 및 구독 시작
    subscribeToChatRoom(room.id);

    showChatModal.value = false;

    setTimeout(() => {
      showChatPanel.value = true;
      nextTick(() => scrollToBottom());
    }, 150);

    // 4. 스크롤 하단 이동 및 읽음 처리
    scrollToBottom();
    await chatApi.markAsRead(room.id, tableNum.value);

  } catch (e) {
    console.error("이전 메시지 로딩 실패:", e);
  }
};

// 특정 채팅방 구독
const subscribeToChatRoom = (roomId) => {
  // 이미 구독 중이라면 해제 후 재구독 (중복 방지)
  if (currentSubscription.value) {
    currentSubscription.value.unsubscribe();
  }

  currentSubscription.value = tableStompClient.value.subscribe(`/topic/chat/${roomId}`, (message) => {
    const received = JSON.parse(message.body);

    // 여기서만 push를 수행!
    chatMessages.value.push({
      text: received.message,
      isMine: Number(received.senderTableNum) === Number(tableNum.value),
      time: formatTime(received.createdAt)
    });
    scrollToBottom();
  });
};

// 메시지 전송
const sendMessage = () => {
  if (!chatInput.value.trim() || !currentChatRoom.value) return;

  const messageDto = {
    chatRoomId: currentChatRoom.value.id,
    storeId: Number(storeId.value), // 숫자형 보장
    senderTableNum: Number(tableNum.value), // 숫자형 보장
    receiverTableNum: Number(selectedChatTable.value), // 숫자형 보장
    message: chatInput.value,
  };

  tableStompClient.value.publish({
    destination: '/app/chat/send',
    body: JSON.stringify(messageDto)
  });

  chatInput.value = "";
};

//선물하기 ───────────────────────
// ── 손님 WebSocket 연결

const connectTableWebSocket = () => {
  if (!accessToken.value || !tableNum.value) return;

  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8083/connect'),
    connectHeaders: { Authorization: `Bearer ${accessToken.value}` },
    onConnect: () => {
      console.log('STOMP 연결 성공');

      // 1. 선물 수신 구독
      client.subscribe(`/topic/table/${tableNum.value}`, (message) => {
        const receiverDto = JSON.parse(message.body);
        handlePresentReceived({
          fromTable: receiverDto.senderTableNum,
          menuName: receiverDto.menuList?.[0]?.menuName,
          menuList: receiverDto.menuList,
        });
      });

      // 2. 채팅 알림 구독
      client.subscribe(`/topic/chat/notification/${tableNum.value}`, (msg) => {
        const data = JSON.parse(msg.body);
        // 현재 보고 있는 채팅방의 메시지가 아닐 때만 알림
        if (!showChatPanel.value || selectedChatTable.value !== data.senderTableNum) {
          unreadChatCount.value++;
          toast.info(`${data.senderTableNum}번 테이블에서 메시지가 왔습니다!`);
        }
      });
    },
    onStompError: (frame) => {
      console.error('STOMP 에러:', frame);
    },
  });

  client.activate();
  tableStompClient.value = client;
};

// ── 선물 수신 처리 ───────────────────────────────────
const handlePresentReceived = (presentData) => {
  presentNotification.value = presentData
  showPresentToast.value = true
  presentUnread.value = true

  if (presentToastTimer.value) clearTimeout(presentToastTimer.value)
  presentToastTimer.value = setTimeout(() => {
    showPresentToast.value = false
  }, 5000)
}

const onPresentToastClick = () => {
  showPresentToast.value = false
  presentUnread.value = false
  if (presentToastTimer.value) clearTimeout(presentToastTimer.value)
};

// ── 선물 전송 ────────────────────────────────────────
const sendPresent = async () => {
  if (!selectedMenu.value) return

  try {
    await customerOrderApi.sendPresent({
      idempotencyKey: crypto.randomUUID(),
      senderTableNum: tableNum.value,
      receiverTableNum: selectedPresentTable.value,
      menuId: selectedMenu.value.id,
      menuQuantity: menuQuantity.value,
    })
    toast.success(`${selectedPresentTable.value}번 테이블에 ${selectedMenu.value.name}을(를) 선물했습니다!`)
  } catch (e) {
    console.error(e)
    toast.error('선물 전송에 실패했습니다.')
  }

  closeMenuDetail()
  closePresentPanel()
}
</script>

<style scoped>
@import "@/assets/css/customerMenu.css";
</style>