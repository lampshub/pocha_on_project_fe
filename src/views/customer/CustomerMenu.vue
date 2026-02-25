<template>
  <div class="app-root">
    <!-- ── 왼쪽 사이드바 ─────────────────────────────── -->
    <aside class="sidebar">
      <div
        class="table-info"
        @click="handleHiddenAdminTrigger"
        style="cursor: default"
      >
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
          <div
            v-for="menu in getMenusByCategory(cat.id)"
            :key="menu.id"
            class="menu-card"
            @click="openMenuDetail(menu)"
          >
            <div class="menu-image_C">
              <img
                v-if="menu.icon && menu.icon.startsWith('http')"
                :src="decodeURIComponent(menu.icon)"
              />
              <span v-else style="font-size: 48px">🍽️</span>
            </div>
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
        {{ presentUnread ? "🎁" : "💬" }}
        <span v-if="presentUnread" class="badge" style="background: #7c3aed"
          >!</span
        >
        <span v-else-if="unreadChatCount > 0" class="badge">{{
          unreadChatCount
        }}</span>
      </button>

      <button class="floating-btn" @click="openOrderHistory" title="주문내역">
        📋
        <span v-if="newOrderCount > 0" class="badge">{{ newOrderCount }}</span>
      </button>

      <button class="floating-btn" @click="openCart" title="장바구니">
        🛒
        <span v-if="cartItems.length > 0" class="badge">{{
          cartItems.length
        }}</span>
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
    <div
      v-if="showPresentToast"
      class="present-toast"
      @click="onPresentToastClick"
    >
      <div class="present-toast-icon">🎁</div>
      <div class="present-toast-content">
        <div class="present-toast-title">선물이 도착했습니다!</div>
        <div class="present-toast-desc">
          {{ presentNotification?.fromTable }}번 테이블에서
          {{ presentNotification?.menuName }}을(를) 선물했어요
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
            <div class="group-header">주문# {{ group.orderNumber }}</div>

            <div v-for="item in group.items" :key="item.id" class="order-item">
              <div class="order-item-name">{{ item.name }}</div>
              <div class="order-item-option">{{ item.option || "옵션 X" }}</div>
              <div class="order-item-bottom">
                <span class="order-item-quantity"
                  >수량: {{ item.quantity }}개</span
                >
                <span class="order-item-price"
                  >{{ formatPrice(item.price * item.quantity) }}원</span
                >
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
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
              "
            >
              <div class="cart-item-name">{{ item.name }}</div>
              <button
                @click="deleteCartLine(idx)"
                style="
                  background: none;
                  border: none;
                  color: var(--text-secondary);
                  font-size: 16px;
                  cursor: pointer;
                  padding: 0;
                "
              >
                ✕
              </button>
            </div>
            <div class="cart-item-option">{{ item.option || "옵션 X" }}</div>
            <div class="cart-item-controls">
              <div class="quantity-controls">
                <button
                  class="quantity-btn"
                  @click="decreaseQuantity(idx)"
                  :disabled="item.quantity <= 1"
                >
                  -
                </button>
                <span class="quantity-value">{{ item.quantity }}</span>
                <button class="quantity-btn" @click="increaseQuantity(idx)">
                  +
                </button>
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
          <span class="total-label">총 금액 </span>
          <span class="total-amount">{{ formatPrice(totalPrice) }}원</span>
        </div>
        <div style="display: flex; gap: 12px; width: 100%">
          <button class="order-btn" @click="placeOrder">주문하기</button>
        </div>
      </div>
    </div>

    <!-- ── 선물하기 패널 ───────────────────────────────── -->
    <div class="slide-panel" :class="{ open: showPresentPanel }">
      <div class="panel-header">
        <h2 class="panel-title">
          {{ selectedPresentTable }}번 테이블에 선물하기
        </h2>
        <button class="close-btn" @click="closePresentPanel">✕</button>
      </div>
      <div class="panel-content">
        <div v-for="cat in categories" :key="cat.id" class="menu-section-small">
          <h3 class="section-title-small">{{ cat.name }}</h3>
          <div class="menu-list-small">
            <div
              v-for="menu in getMenusByCategory(cat.id)"
              :key="menu.id"
              class="menu-item-small"
              @click="openPresentMenuDetail(menu)"
            >
              <div class="menu-icon-small">
                <img
                  v-if="menu.icon && menu.icon.startsWith('http')"
                  :src="menu.icon"
                  style="
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 8px;
                  "
                />
                <span v-else style="font-size: 36px">🍽️</span>
              </div>
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
      <h3>테이블 선택</h3>
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
          :class="['table-item', { selected: selectedTable?.tableNum === t }]"
          @click="selectTable(t)"
        >
          <span v-if="getUnreadCountForTable(t) > 0" class="table-unread-badge">
            {{ getUnreadCountForTable(t) }}
          </span>
          <span class="table-name">{{ t }}번</span>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button
        class="action-btn action-btn-primary"
        :disabled="!selectedTable"
        @click="openChat()"
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
      <div class="menu-detail-image">
        <img
          v-if="selectedMenu?.icon && selectedMenu.icon.startsWith('http')"
          :src="decodeURIComponent(selectedMenu.icon)"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 16px;
          "
        />
        <span v-else style="font-size: 120px">🍽️</span>
      </div>
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

      <div v-if="selectedMenu?.options?.length && !isPresentMode" class="menu-options">
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
        <button
          v-if="!isPresentMode"
          class="add-cart-btn"
          @click="addToCartFromDetail"
        >
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
import {ref, computed, nextTick, onMounted, onBeforeUnmount, onUnmounted} from 'vue'
import {customerMenuApi as customerOrderApi} from '@/api/customerMenuApi'
import {useToast} from "vue-toastification";
import {onBeforeRouteLeave, useRouter} from "vue-router";
import {Client} from '@stomp/stompjs'
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

// JWT 토큰에서 payload 파싱
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(decodeURIComponent(atob(base64).split('').map(
        c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join('')))
  } catch (e) {
    return {}
  }
}

const getSavedTable = () => {
  const saved = localStorage.getItem("selectedTable");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    return typeof parsed === 'object' ? parsed : { tableNum: parsed };
  } catch (e) { return { tableNum: Number(saved) }; }
};

// ── 새로고침 여부 판별 헬퍼 ──────────────────────────


// ── 상태 ─────────────────────────────────────────────
const tokenPayload = parseJwt(localStorage.getItem('accessToken') || '')
const tableNum = ref(selectedTableData.tableNum || 0)
const currentCategory = ref('main')
const showOrderHistory = ref(false)
const showCart = ref(false)
const showChatModal = ref(false)
const showMenuDetail = ref(false)
const showPresentPanel = ref(false)
const showChatPanel = ref(false)
const selectedTable = ref(getSavedTable());
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
const clickCount = ref(0);
const lastClickTime = ref(0);
const tableStompClient = ref(null);
const sseAlarmSource = ref(null); // SSE 채팅 알림 접속 reader

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
  // ── 새로고침 판별 ──────────────────────────────────────────────────────
  // sessionStorage는 탭이 살아있는 동안 유지됨.
  // "is_session_active"가 있다 = 이미 세션이 시작된 탭 = 새로고침
  // beforeunload/pagehide 시점에도 sessionStorage 값은 아직 살아있으므로
  // PerformanceNavigationTiming보다 훨씬 신뢰할 수 있음.
  const isReload = !!sessionStorage.getItem("is_session_active");
  if (isReload) {
    console.log("새로고침 감지 - 테이블 해제 건너뜀");
    return;
  }

  const tableData = JSON.parse(localStorage.getItem("selectedTable") || "{}");
  if (!tableData.tableNum) return;

  const url = `${process.env.VUE_APP_API_BASE_URL}/customertable/tablerollback`;

  if (isExitingApp === true || typeof isExitingApp === 'object') {
    const payload = JSON.stringify({tableNum: tableData.tableNum});
    const blob = new Blob([payload], {type: "application/json"});
    const success = navigator.sendBeacon(url, blob);
    console.log("브라우저 종료/이동 시 Beacon 전송 결과:", success);

    // const xhr = new XMLHttpRequest();
    // xhr.open("POST", url, false);
    // xhr.setRequestHeader("Content-Type", "application/json");
    // xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("accessToken")}`);
    // xhr.send(JSON.stringify({ tableNum: tableData.tableNum }));


  } else {
    axios.post(url, {tableNum: tableData.tableNum}, {
      headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
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
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/customertable/available`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        storeId: storeId.value
      }
    });

    if (response.data && Array.isArray(response.data)) {
      // 자기 자신 테이블은 목록에서 제외
      activeTables.value = response.data
        .map(t => t.tableNum)
        .filter(t => t !== tableNum.value);
    } else {
      activeTables.value = [];
    }
    console.log("조회된 사용 중인 테이블:", activeTables.value);

  } catch (e) {
    console.error("사용 가능 테이블 로드 실패:", e);
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
  const customerTableId = tokenPayload.customerTableId;
  if (!adminPassword.value) {
    toast.warning("비밀번호를 입력해주세요.");
    return;
  }

  try {
    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/owner/verify-password`, {
      password: adminPassword.value,
      customerTableId: customerTableId
    }, {
      headers: {Authorization: `Bearer ${localStorage.getItem('accessToken')}`}
    });

    const refreshToken = localStorage.getItem("refreshToken")?.trim();
    const response = await axios
      .create()
      .post(
        `${process.env.VUE_APP_API_BASE_URL}/owner/refresh`,
        {},
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      response.data;
    localStorage.setItem("accessToken", newAccessToken);
    localStorage.setItem("refreshToken", newRefreshToken);

    await releaseTable(false);
    toast.success("관리자 인증 성공. 매장 선택 화면으로 이동합니다.");
    router.push("/another/dashboard");
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
  window.addEventListener("pagehide", releaseTable);
  window.addEventListener("beforeunload", releaseTable);

  try {
    await Promise.all([loadMenus(), loadCart()]);
    connectTableWebSocket();
    connectChatAlarmSSE(); // SSE 쇼팅 알림 연결
  } catch (e) {
    console.error("초기 로딩 실패", e);
  }
  await loadUnreadTotalCount();
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", preventBack);
  window.removeEventListener("pagehide", releaseTable);
  window.removeEventListener("beforeunload", releaseTable);
});

onUnmounted(() => {
  if (presentToastTimer.value) clearTimeout(presentToastTimer.value);
  if (tableStompClient.value) {
    tableStompClient.value.deactivate();
  }
  disconnectChatAlarmSSE(); // SSE 연결 정리
});

onBeforeRouteLeave((to, from, next) => {
  // 결제 페이지로 이동할 때는 테이블 해제 안 함
  if (to.name === "CustomerPayment" || to.path.includes("/payment")) {
    next();
    return;
  }
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
  return (listDto ?? []).map((ordering,index) => ({
    groupId: ordering.groupId,
    orderNumber: index + 1,
    totalPrice: ordering.totalPrice,
    items: (ordering.listDetailDto ?? []).map((detail) => ({
      id: detail.menuId,
      name: detail.menuName,
      option:
        detail.orderDetailOpDto
          ?.map(
            (opt) =>
              `${opt.optionName}: ${opt.orderDetailOptionDetailDto
                ?.map((d) => d.optionDetailName)
                .join(", ")}`,
          )
          .join(" / ") || null,
      quantity: detail.menuQuantity,
      price: detail.linePrice,
    })),
  }));
};

const loadMenus = async () => {
  const { data } = await customerOrderApi.getCategories();
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
      icon: m.imageUrl || null,
      options: null,
    })),
  );
};

const loadCart = async () => {
  const { data } = await customerOrderApi.getCart();
  cartItems.value = mapCartToViewModel(data);
};

const loadOrderHistory = async () => {
  const gid = localStorage.getItem(GROUP_ID_KEY);
  if (!gid) {
    orderHistory.value = [];
    return;
  }
  const { data } = await customerOrderApi.getOrderList(gid);
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
  sec?.scrollIntoView({ behavior: "smooth", block: "start" });
};

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
const openMenuDetail = async (menu) => {
  try {
    const { data } = await customerOrderApi.getMenuDetail(menu.id);
    selectedMenu.value = {
      id: data.menuId,
      name: data.menuName,
      price: data.menuPrice,
      icon: menu.icon,
      description: "",
      options: data.mappingOptionList ?? [],
    };
    selectedOptions.value = {};
    isPresentMode.value = false;
    showMenuDetail.value = true;
  } catch (e) {
    console.error(e);
    toast.error("메뉴 정보를 불러오지 못했습니다.");
  }
};

const openPresentMenuDetail = async (menu) => {
  try {
    const { data } = await customerOrderApi.getMenuDetail(menu.id);
    selectedMenu.value = {
      id: data.menuId,
      name: data.menuName,
      price: data.menuPrice,
      icon: menu.icon,
      description: "",
      options: data.mappingOptionList ?? [],
    };
    selectedOptions.value = {};
    isPresentMode.value = true;
    showMenuDetail.value = true;
  } catch (e) {
    console.error(e);
    toast.error("메뉴 정보를 불러오지 못했습니다.");
  }
};

const closeMenuDetail = () => {
  showMenuDetail.value = false;
  selectedMenu.value = null;
  selectedOptions.value = {};
  isPresentMode.value = false;
};

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
  const line = cartItems.value[idx];
  if (!line) return;
  if (line.quantity > 1) {
    await customerOrderApi.updateCartQty({
      menuId: line.id,
      delta: -1,
      optionIds: line.optionIds ?? [],
      fieldKey: line.fieldKey,
    });
  } else {
    if (!confirm("장바구니에서 삭제하시겠습니까?")) return;
    await customerOrderApi.deleteCartLine({ fieldKey: line.fieldKey });
  }
  await loadCart();
};

const deleteCartLine = async (idx) => {
  const line = cartItems.value[idx];
  if (!line) return;
  if (!confirm("장바구니에서 삭제하시겠습니까?")) return;
  await customerOrderApi.deleteCartLine({ fieldKey: line.fieldKey });
  await loadCart();
};

// ── 패널 열기/닫기 ────────────────────────────────────
const closePanel = () => {
  showOrderHistory.value = false;
  showCart.value = false;
  showPresentPanel.value = false;
  showChatPanel.value = false;
};

const openOrderHistory = async () => {
  closePanel();
  await loadOrderHistory();
  newOrderCount.value = 0;
  showOrderHistory.value = true;
};

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
    tableNum: tableNum.value,
    idempotencyKey: crypto.randomUUID(),
    webMenuList: [],
  };

  let currentGroupId = localStorage.getItem(GROUP_ID_KEY);
  let returnedGroupId;
  if (currentGroupId) {
    try {
      const { data } = await customerOrderApi.addOrder(currentGroupId, payload);
      returnedGroupId = data;
    } catch (e) {
      console.warn("추가 주문 실패, 새주문 생성 : ", e);
      localStorage.removeItem(GROUP_ID_KEY);
      const { data } = await customerOrderApi.createOrder(payload);
      returnedGroupId = data;
    }
  } else {
    const { data } = await customerOrderApi.createOrder(payload);
    returnedGroupId = data;
  }
  localStorage.setItem(GROUP_ID_KEY, returnedGroupId);

  toast.success("주문이 완료되었습니다!");
  newOrderCount.value += 1;
  await loadCart();
  await loadOrderHistory();
  closePanel();
};

const handlePayment = () => {
  console.log('tableNum:', tableNum.value)
  router.push({
    name: 'CustomerPayment',
    params: {tableNum: tableNum.value},
    query: {
      amount: totalPrice.value,
      groupId: localStorage.getItem('currentGroupId')
    }
  });
};

// ── 채팅 모달 ─────────────────────────────────────────

const openChatModal = async () => {
  try {
    showChatModal.value = true;
    selectedTable.value = null;
    // 테이블 목록과 unread 카운트를 동시에 최신화
    await Promise.all([loadAvailableTables(), loadUnreadTotalCount()]);
  } catch (e) {
    console.error("채팅 모달 열기 중 오류:", e);
  }
};
const closeChatModal = () => {
  showChatModal.value = false;
  selectedTable.value = null;
};
const selectTable = (tNum) => {
  selectedTable.value = { tableNum: tNum };
};

// 이전 채팅 메시지 로드 함수
const loadChatMessages = async (roomId) => {
  try {
    const { data } = await chatApi.getMessages(roomId);
    chatMessages.value = data.map(m => ({
      text: m.message,
      isMine: Number(m.senderTableNum) === Number(tableNum.value),
      time: formatTime(m.createdAt)
    }));
  } catch (e) {
    console.error("메시지 로드 실패:", e);
  }
};


const openPresent = () => {
  selectedPresentTable.value = selectedTable.value?.tableNum
  closeChatModal()
  closePanel()
  showPresentPanel.value = true
}

const closePresentPanel = () => {
  showPresentPanel.value = false;
  selectedPresentTable.value = null;
};

const closeChatPanel = async () => {
  // 패널 닫을 때 읽음 처리 및 badge 재동기화
  if (currentChatRoom.value) {
    try {
      await chatApi.markAsRead(currentChatRoom.value.id, tableNum.value);
      await loadUnreadTotalCount();
    } catch (e) {
      console.error("패널 닫기 시 읽음 처리 실패:", e);
    }
  }
  showChatPanel.value = false;
  selectedChatTable.value = null;
  currentChatRoom.value = null;
  chatMessages.value = [];
  chatInput.value = "";
};

// ── 채팅 ─────────────────────────────────────────────
const openChat = async (targetNum) => {
  const tNum = targetNum || selectedTable.value?.tableNum;
  if (!tNum) return;

  try {
    // 1. 채팅방 생성/조회
    const { data: room } = await chatApi.getOrCreateRoom(Number(tNum));
    // [수정] selectedChatRoom → currentChatRoom 으로 통일
    currentChatRoom.value = room;
    selectedChatTable.value = tNum;

    // 2. 메시지 로드
    await loadChatMessages(room.id);

    // 3. 읽음 처리
    // 로컬 카운트 초기화 (WebSocket으로 쌓인 것)
    const senderKey = String(tNum);
    const localCount = unreadMessagesByTable.value[senderKey] || unreadMessagesByTable.value[Number(tNum)] || 0;
    unreadChatCount.value = Math.max(0, unreadChatCount.value - localCount);
    unreadMessagesByTable.value[senderKey] = 0;
    unreadMessagesByTable.value[Number(tNum)] = 0;

    // 서버에 읽음 처리 후 전체 카운트를 서버에서 재조회 (가장 정확한 동기화)
    await chatApi.markAsRead(room.id, tableNum.value);
    await loadUnreadTotalCount();

    // 4. UI 전환
    showChatModal.value = false;
    setTimeout(() => {
      showChatPanel.value = true;
      nextTick(() => scrollToBottom());
    }, 150);

    // 5. 특정 채팅방 실시간 구독
    subscribeToChatRoom(room.id);
    nextTick(() => scrollToBottom());
  } catch (e) {
    console.error("채팅방 열기 실패:", e);
    toast.error("채팅방을 열 수 없습니다. 다시 시도해주세요.");
  }
};

// 특정 채팅방 구독
const subscribeToChatRoom = (roomId) => {
  if (!tableStompClient.value || !tableStompClient.value.connected) {
    console.warn("STOMP 연결이 아직 준비되지 않았습니다.");
    return;
  }

  // 이미 구독 중이라면 해제 후 재구독 (중복 방지)
  if (currentSubscription.value) {
    currentSubscription.value.unsubscribe();
  }

  // badge/toast는 notification 토픽이 담당
  // 여기서는 채팅창 메시지 표시만 담당
  currentSubscription.value = tableStompClient.value.subscribe(`/topic/chat/${roomId}`, (message) => {
    const received = JSON.parse(message.body);
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
  // [수정] currentChatRoom 참조로 통일
  if (!chatInput.value.trim() || !currentChatRoom.value) return;

  const messageDto = {
    chatRoomId: currentChatRoom.value.id,
    storeId: Number(storeId.value),
    senderTableNum: Number(tableNum.value),
    receiverTableNum: Number(selectedChatTable.value),
    message: chatInput.value,
  };

  tableStompClient.value.publish({
    destination: '/app/chat/send',
    body: JSON.stringify(messageDto)
  });

  chatInput.value = "";
};

//선물하기 ───────────────────────
// ── 손님 STOMP 연결 (선물 수신 전용)

const connectTableWebSocket = () => {
  if (!accessToken.value || !tableNum.value) return;

  const client = new Client({
    webSocketFactory: () => new SockJS('http://localhost:8083/connect'),
    connectHeaders: { Authorization: `Bearer ${accessToken.value}` },
    onConnect: () => {
      console.log('STOMP 연결 성공 (선물 수신 전용)');

      // 선물 수신 구독 (STOMP 유지)
      client.subscribe(`/topic/table/${tableNum.value}`, (message) => {
        const receiverDto = JSON.parse(message.body);
        handlePresentReceived({
          fromTable: receiverDto.senderTableNum,
          menuName: receiverDto.menuList?.[0]?.menuName,
          menuList: receiverDto.menuList,
        });
      });
    },


    onStompError: (frame) => console.error("손님 STOMP 에러:", frame),
  });
  client.activate();
  tableStompClient.value = client;
};

// ── SSE 채팅 알림 연결 (fetch + ReadableStream 방식 — Authorization 헤더 지원)

const connectChatAlarmSSE = () => {
  disconnectChatAlarmSSE();
  fetchChatAlarmSSE();
};

const fetchChatAlarmSSE = async () => {
  if (!accessToken.value) return;
  try {
    const response = await fetch('http://localhost:8083/sseChat/connect', {
      headers: { Authorization: `Bearer ${accessToken.value}` },
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    sseAlarmSource.value = reader; // 정리용으로 reader 참조 보관

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // 마지막 미완성 라인 보관

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const dataStr = line.slice(5).trim();
        if (!dataStr) continue;

        try {
          const payload = JSON.parse(dataStr);
          handleChatAlarm(payload);
        } catch (_e) { /* 비-JSON 연결 확인 메시지 등 무시 */ }
      }
    }
  } catch (e) {
    console.error('SSE 채팅 알림 연결 실패:', e);
  }
};

// SSE 이벤트 처리: { storeId, receiverTable, message }
const handleChatAlarm = (payload) => {
  // ★ 디버그: 백엔드에서 실제로 어떤 데이터가 오는지 확인
  console.log("[SSE] handleChatAlarm payload:", JSON.stringify(payload));

  // 채팅 패널이 열려있으면 읽음 처리 후 서버 동기화
  if (showChatPanel.value && currentChatRoom.value) {
    chatApi.markAsRead(currentChatRoom.value.id, tableNum.value)
      .then(() => loadUnreadTotalCount())
      .catch(() => {});
    return;
  }

  // 즉시 전체 카운트 증가
  unreadChatCount.value++;

  // senderTableNum 으로 테이블별 badge 즉시 업데이트
  const sender = payload?.senderTableNum ?? payload?.senderTable;
  console.log("[SSE] sender:", sender, "| unreadMessagesByTable before:", JSON.stringify(unreadMessagesByTable.value));
  if (sender != null) {
    const key = String(sender);
    const prev = unreadMessagesByTable.value[key] || 0;
    unreadMessagesByTable.value[key] = prev + 1;
    unreadMessagesByTable.value[Number(sender)] = prev + 1;
    console.log("[SSE] unreadMessagesByTable after:", JSON.stringify(unreadMessagesByTable.value));
  } else {
    // sender 없으면 서버 재조회로 fallback
    console.warn("[SSE] senderTableNum 없음 → loadUnreadTotalCount() fallback");
    loadUnreadTotalCount();
  }
};

const disconnectChatAlarmSSE = async () => {
  if (sseAlarmSource.value) {
    try { await sseAlarmSource.value.cancel(); } catch (_e) { /* ignore */ }
    sseAlarmSource.value = null;
  }
  try {
    await fetch('http://localhost:8083/sseChat/disconnect', {
      headers: { Authorization: `Bearer ${accessToken.value}` },
    });
  } catch (_e) { /* ignore */ }
};

const loadUnreadTotalCount = async () => {
  try {
    const { data: rooms } = await chatApi.getMyActiveRooms(storeId.value, tableNum.value);
    // 전체 unread 합산
    unreadChatCount.value = rooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);
    // 테이블별 unread도 String 키로 동기화 (badge 차감 시 정확히 빼기 위해)
    rooms.forEach(room => {
      if (room.unreadCount > 0 && room.otherTableNum) {
        unreadMessagesByTable.value[String(room.otherTableNum)] = room.unreadCount;
      }
    });
  } catch (e) {
    console.error("알람 개수 로드 실패:", e);
  }
};

// ── 선물 수신 처리 ───────────────────────────────────
const handlePresentReceived = (presentData) => {
  presentNotification.value = presentData;
  showPresentToast.value = true;
  presentUnread.value = true;

  if (presentToastTimer.value) clearTimeout(presentToastTimer.value);
  presentToastTimer.value = setTimeout(() => {
    showPresentToast.value = false;
  }, 5000);
};

const onPresentToastClick = () => {
  showPresentToast.value = false;
  presentUnread.value = false;
  if (presentToastTimer.value) clearTimeout(presentToastTimer.value);
};

// ── 선물 전송 ────────────────────────────────────────
const sendPresent = async () => {
  if (!selectedMenu.value) return;

  try {
    await customerOrderApi.sendPresent({
      idempotencyKey: crypto.randomUUID(),
      senderTableNum: tableNum.value,
      receiverTableNum: selectedPresentTable.value,
      menuId: selectedMenu.value.id,
      menuQuantity: menuQuantity.value,
    });
    toast.success(
      `${selectedPresentTable.value}번 테이블에 ${selectedMenu.value.name}을(를) 선물했습니다!`,
    );
  } catch (e) {
    console.error(e);
    toast.error("선물 전송에 실패했습니다.");
  }

  closeMenuDetail()
  closePresentPanel()
}
</script>

<style scoped>
@import "@/assets/css/customerMenu.css";
</style>