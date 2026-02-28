<template>
  <div class="owner-dashboard">
    <!-- ── 헤더 ─────────────────────────────────────── -->
    <div class="header">
      <div class="store-name">{{ storeInfo.storeName }}</div>
      <div class="header-btns">
        <button class="nav-btn-header" :class="{ active: showTableView }" @click="showTableView = !showTableView">
          {{ showTableView ? '🍽️ 서빙 대기' : '🪑 테이블 현황' }}
        </button>
        <router-link to="/owner/kitchen" class="nav-btn-header">🍳 주방</router-link>
        <router-link to="/owner/settlement" class="nav-btn-header">📊 매출 정산</router-link>
        <router-link to="/owner/settings" class="nav-btn-header">⚙️ 설정 관리</router-link>
        <button class="back-btn" @click="goBackToDashboard">🏠 대시보드</button>
      </div>
    </div>

    <!-- ── 직원 호출 알림 바 (항상 표시, 탭 무관) ── -->
    <div class="call-alert-bar">
      <div class="call-alert-title">
        <span class="call-alert-icon">🔔</span>
        직원 호출 <span class="call-alert-count">{{ staffCalls.length }}건</span>
      </div>
      <div class="call-alert-list">
        <div v-for="call in staffCalls" :key="'call-' + call.tableNum" class="call-alert-item">
          <span class="call-alert-table">{{ call.tableNum }}번 테이블</span>
          <button class="call-dismiss-btn" @click="dismissCall(call)">확인</button>
        </div>
      </div>
    </div>

    <div class="main-layout">

      <!-- ── 테이블 현황 뷰 (메인 100% 전환) ────────── -->
      <TableStatusView
        v-if="showTableView"
        :tables="tables"
        :format-price="formatPrice"
        @open-table-detail="openTableDetail"
      />

      <!-- ── 서빙 대기 뷰 ────────────── -->
      <div v-else class="center-content">

        <!-- 서빙 대기 헤더 -->
        <div class="orders-header">
          <div class="orders-title-area">
            <h2 class="orders-main-title">🍽️ 서빙 대기</h2>
            <div class="orders-count-badge">{{ servingCards.length }}건</div>
          </div>
        </div>

        <!-- 서빙 대기 그리드 -->
        <div v-if="servingCards.length > 0" class="orders-grid">
          <div v-for="card in servingCards" :key="card.id" class="order-card">
            <div class="order-card-header">
              <div class="order-card-table">{{ card.tableNumber }}번 테이블</div>
              <div class="order-card-time">{{ card.time }}</div>
            </div>
            <div class="order-card-body">
              <div class="order-card-menu">{{ card.menuName }}</div>
              <div class="order-card-detail">
                <span class="order-card-option">{{ card.menuOption || '옵션 없음' }}</span>
                <span class="order-card-qty">{{ card.menuQuantity }}개</span>
              </div>
            </div>
            <button class="order-complete-btn" @click="completeServing(card)">
              🍽️ 서빙 완료
            </button>
          </div>
        </div>

        <div v-else class="empty-orders">
          <div class="empty-orders-icon">🍽️</div>
          <div class="empty-orders-title">서빙 대기 중인 메뉴가 없습니다</div>
          <div class="empty-orders-desc">주방에서 조리 완료 시 여기에 표시됩니다</div>
        </div>
      </div>
    </div>

    <!-- ── 테이블 상세 모달 ──────────────────────────── -->
    <TableDetailModal
      :show="showTableDetail"
      :selected-table="selectedTable"
      :format-price="formatPrice"
      @close="showTableDetail = false"
    />
  </div>
</template>

<script setup>
defineOptions({ name: 'OwnerPanel' })

import { ref, watch, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { useRouter } from 'vue-router'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { EventSourcePolyfill } from 'event-source-polyfill'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { useStoreInfo } from '@/store/storeInfo'
import { useOrderSocketStore } from '@/store/orderSocket'
import TableStatusView from '@/components/owner/panel/TableStatusView.vue'
import TableDetailModal from '@/components/owner/panel/TableDetailModal.vue'

const toast = useToast();
const router = useRouter();
const servingCards = ref([]);
const orderMenuTotals = ref({});   // { orderingId: 총 메뉴 수 }
const orderMenuServed = ref({});   // { orderingId: 서빙 완료 수 }
const storeInfo = useStoreInfo();
const tables = ref([]);
const showTableDetail = ref(false);
const selectedTable = ref(null);
const showTableView = ref(false);
const orderSocket = useOrderSocketStore();
const CALL_STORAGE_KEY = 'staffCallTables'  //호출 상태저장(화면이동후에도 남아있게)

// 직원 호출 목록 (테이블 매칭 없이 독립 관리)
const staffCalls = ref([]) // [{ tableNum, message }]

// 대시보드로 돌아가기
const goBackToDashboard = () => {
  const baseToken = localStorage.getItem('baseAccessToken');
  if (baseToken) {
    localStorage.setItem('accessToken', baseToken);
    localStorage.removeItem('baseAccessToken');
  }
  localStorage.removeItem('currentStoreId');
  localStorage.removeItem('currentStoreName');
  localStorage.removeItem('currentStoreAddress');
  router.push('/another/dashboard');
};

// 호출 상태저장 - 로컬스토리지 저장
const saveCallState = () => {
  localStorage.setItem(CALL_STORAGE_KEY, JSON.stringify(staffCalls.value))
}
const loadCallState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CALL_STORAGE_KEY) || '[]')
    if (Array.isArray(saved) && saved.length > 0 && typeof saved[0] === 'object') {
      staffCalls.value = saved
    }
  } catch { /* 무시 */ }
}

// 호출알람끄기
const dismissCall = (call) => {
  staffCalls.value = staffCalls.value.filter(c => String(c.tableNum) !== String(call.tableNum))
  saveCallState()
}

// 토큰/storeId
const accessToken = ref(localStorage.getItem("accessToken"));
const storeId = ref(localStorage.getItem("ownerStoreId"));

// 손님->점주 호출 SSE 연결
let stompClient = null;
let eventSource = null;

// JWT에서 storeId 파싱
const parseStoreIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.storeId;
  } catch { return null; }
};

// 웹소켓 연결
const connectWebSocket = () => {
  if (!accessToken.value || !storeId.value) return;
  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8083/connect"),
    connectHeaders: {Authorization: `Bearer ${accessToken.value}`},
    onConnect: () => {
      console.log("웹소켓 연결됨");

      // 주방→점주 큐 구독 — MENU_DONE 수신
      stompClient.subscribe(`/topic/order-queue/${storeId.value}`, (message) => {
        const data = JSON.parse(message.body);
        if (data.type === 'MENU_DONE') {
          handleMenuDone(data);
        }
      });
    },
    onStompError: (frame) => console.error("STOMP 에러:", frame),
  });
  stompClient.activate();
};

// SSE연결(직원호출 수신용)
const connectSSE = () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return
  const baseUrl = process.env.VUE_APP_API_BASE_URL
  eventSource = new EventSourcePolyfill(`${baseUrl}/sse/connect`, {
    headers: {Authorization: `Bearer ${token}`},
    heartbeatTimeout: 180000,   // 3분 (SSE 타임아웃 - 백엔드 heartbeat 주기보다 넉넉하게)
  })
  eventSource.addEventListener('connect', (e) => {
    console.log('SSE 연결 완료:', e.data)
  })
  // 직원호출 처리 공통 함수
  const handleStaffCall = (data) => {
    console.log('직원호출 수신:', data)
    const tableNum = data.tableNum ?? data.tableId
    if (tableNum == null) return
    // 중복 방지
    if (!staffCalls.value.some(c => String(c.tableNum) === String(tableNum))) {
      staffCalls.value.push({ tableNum, message: data.message || `${tableNum}번 테이블 직원 호출` })
      saveCallState()
    }
    toast.warning(`🔔 ${data.message || `${tableNum}번 테이블 직원 호출`}`)
  }

  // named event 'staffcall' 수신
  eventSource.addEventListener('staffcall', (e) => {
    try { handleStaffCall(JSON.parse(e.data)) } catch (err) { console.error('staffcall 파싱 오류:', err) }
  })

  // onmessage 폴백 (named event가 안 잡힐 경우 대비)
  eventSource.onmessage = (e) => {
    try {
      const d = JSON.parse(e.data)
      if (d.tableNum != null || d.tableId != null) handleStaffCall(d)
    } catch { /* 무시 */ }
  }

  eventSource.onerror = (e) => { console.error('SSE 에러:', e) }
}

// 신규 주문 수신 (테이블 카드 업데이트용)
watch(
  () => orderSocket.lastOrderMessage,
  (msg) => {
    if (msg?.data) handleNewOrder(msg.data);
  }
);

// 새 주문 처리 — 테이블 현황 업데이트만 수행
const handleNewOrder = (orderDto) => {
  if (orderDto.type === 'PRESENT') {
    // 선물: 발신 테이블에 주문 내역 추가
    const senderTable = tables.value.find(t => t.number === orderDto.senderTableNum);
    if (senderTable) {
      orderDto.menuDtoList?.forEach((menu) => {
        senderTable.detailOrders.push({
          id: `${orderDto.groupId}-${menu.menuName}`,
          menu: `🎁 ${menu.menuName} → ${orderDto.receiverTableNum}번`,
          option: '선물',
          quantity: menu.menuQuantity,
          price: 0,
        });
      });
    }
    return;
  }

  // 일반 주문: 테이블 카드 업데이트
  let table = tables.value.find((t) => t.number === orderDto.tableNum);
  if (!table) {
    table = {number: orderDto.tableNum, total: 0, hasCall: false, orders: [], detailOrders: []};
    tables.value.push(table);
    tables.value.sort((a, b) => a.number - b.number);
  }
  orderDto.webMenuList?.forEach((menu) => {
    const optionStr = menu.optionList
      ?.map((opt) => `${opt.optionGroupName}: ${opt.optionDetailList?.map((d) => d.optionDetailName).join(", ")}`)
      .join(" / ") || null;
    const optionPrice = menu.optionList
      ?.flatMap((opt) => opt.optionDetailList ?? [])
      .reduce((sum, d) => sum + (d.optionDetailPrice ?? 0), 0) ?? 0;
    const unitPrice = (menu.menuPrice ?? 0) + optionPrice;

    const existing = table.detailOrders.find(
      (d) => d.menu === menu.menuName && d.option === optionStr
    );
    if (existing) {
      existing.quantity += menu.quantity;
    } else {
      table.detailOrders.push({
        id: `${orderDto.orderingId}-${menu.menuName}-${Date.now()}`,
        menu: menu.menuName,
        option: optionStr,
        quantity: menu.quantity,
        price: unitPrice,
      });
    }
    table.total += unitPrice * menu.quantity;
  });
};

// 주방 MENU_DONE 수신 → 서빙 대기 카드 추가
const handleMenuDone = (data) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 총 메뉴 수 추적 (가장 최근 값으로 갱신)
  if (data.menuTotal != null) {
    orderMenuTotals.value[data.orderingId] = data.menuTotal;
  }

  servingCards.value.push({
    id: `${data.orderingId}-${data.menuIndex}-${Date.now()}`,
    orderingId: data.orderingId,
    tableNumber: data.tableNumber,
    menuName: data.menuName,
    menuQuantity: data.menuQuantity,
    menuOption: data.menuOption || null,
    time,
  });
  toast.info(`🍽️ ${data.tableNumber}번 테이블 [${data.menuName}] 서빙 준비 완료`);
};

// 서빙 완료 처리
const completeServing = async (card) => {
  servingCards.value = servingCards.value.filter(c => c.id !== card.id);

  // 이 주문의 서빙 완료 수 누적
  orderMenuServed.value[card.orderingId] = (orderMenuServed.value[card.orderingId] || 0) + 1;

  const served = orderMenuServed.value[card.orderingId];
  const total = orderMenuTotals.value[card.orderingId];

  // 총 메뉴 수를 알고 있고, 아직 다 서빙하지 않았으면 ORDER_DONE 보내지 않음
  if (total != null && served < total) {
    toast.success(`🍽️ ${card.menuName} 서빙 완료 (${served}/${total})`);
    return;
  }

  // 모두 서빙 완료 → API 호출 + 주방에 ORDER_DONE
  try {
    await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/ordering/done/${card.orderingId}`,
      null,
      { headers: { Authorization: `Bearer ${accessToken.value}` } }
    );
    if (stompClient?.connected) {
      stompClient.publish({
        destination: `/topic/order-queue/${storeId.value}`,
        body: JSON.stringify({ type: 'ORDER_DONE', orderingId: card.orderingId }),
      });
    }
    toast.success(`${card.tableNumber}번 테이블 전체 서빙 완료!`);
  } catch (e) {
    console.debug("ordering done 실패:", e);
    toast.error("서빙 완료 처리 실패");
  } finally {
    // 추적 데이터 정리
    delete orderMenuTotals.value[card.orderingId];
    delete orderMenuServed.value[card.orderingId];
  }
};

onMounted(async () => {
  // [FIX] storeInfo 로드 — 중복 호출 제거
  storeInfo.loadFromStorage();

  // storeId 토큰에서 파싱
  const token = localStorage.getItem('accessToken')
  if (token && !storeId.value) {
    const parsed = parseStoreIdFromToken(token);
    if (parsed) {
      storeId.value = String(parsed);
      localStorage.setItem("ownerStoreId", storeId.value);
    }
  }
  // 테이블 데이터가 없을 때만 API에서 로드 (keep-alive 복귀 시 보존)
  if (tables.value.length === 0) {
    try {
      const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/customertable/list`, {
        headers: {Authorization: `Bearer ${token}`}
      })
      tables.value = res.data.map(t => ({
        number: t.tableNum,
        tableId: t.customerTableId,
        status: t.tableStatus,
        total: 0,
        hasCall: false,
        orders: [],
        detailOrders: []
      }))
      loadCallState();
    } catch (e) {
      toast.error(e.response?.data?.errorMessage || "테이블 불러오기 실패")
    }
  }

  // 새로고침 방지
  window.addEventListener("keydown", preventRefresh);

  // 웹소켓 연결
  connectWebSocket();

  // SSE연결(직원호출 수신용)
  connectSSE();

  // Pinia 주문 웹소켓 연결 확인 (테이블 현황 업데이트용)
  if (!orderSocket.isConnected && storeId.value && token) {
    orderSocket.connect(storeId.value, token);
  }
});

// ★ keep-alive에서 복귀할 때 (대시보드 갔다가 돌아올 때)
onActivated(() => {
  console.log('OwnerPanel 활성화 (keep-alive 복귀)');

  // 토큰/storeId 갱신 (대시보드에서 토큰이 교체되었을 수 있음)
  const token = localStorage.getItem('accessToken');
  accessToken.value = token;

  if (token) {
    const parsed = parseStoreIdFromToken(token);
    if (parsed) {
      storeId.value = String(parsed);
      localStorage.setItem("ownerStoreId", storeId.value);
    }
  }

  storeInfo.loadFromStorage();

  // Pinia 웹소켓 재연결 (토큰이 바뀌었으면 재연결 필요)
  if (storeId.value && token) {
    orderSocket.disconnect();
    orderSocket.connect(storeId.value, token);
  }

  // SSE 재연결 (직원호출용)
  eventSource?.close();
  connectSSE();
});

// ★ keep-alive에서 비활성화될 때 (다른 페이지로 이동)
onDeactivated(() => {
  console.log('OwnerPanel 비활성화');
  // SSE만 정리 (WebSocket은 Pinia store가 관리)
  eventSource?.close();
});

onUnmounted(() => {
  stompClient?.deactivate();
  eventSource?.close();
  window.removeEventListener("keydown", preventRefresh);
});

// 새로고침 방지
const preventRefresh = (e) => {
  if (
    e.key === "F5" ||
    (e.ctrlKey && (e.key === "r" || e.key === "R")) ||
    (e.ctrlKey && e.shiftKey && (e.key === "r" || e.key === "R"))
  ) {
    e.preventDefault();
    e.stopPropagation();
  }
};

// 원화 표시
const formatPrice = (price) => (price ?? 0).toLocaleString("ko-KR");

// 테이블 클릭 시 상세 모달 오픈
const openTableDetail = (table) => {
  selectedTable.value = table;
  showTableDetail.value = true;
};
</script>

<style scoped>
@import "@/assets/css/OwnerPanel.css";
</style>
