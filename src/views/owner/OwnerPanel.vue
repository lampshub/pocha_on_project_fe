<template>
  <div class="owner-dashboard">
    <!-- ── 헤더 ─────────────────────────────────────── -->
    <div class="header">
      <div class="store-name">{{ storeInfo.storeName }}</div>
      <div class="header-btns">
        <button class="nav-btn-header" :class="{ active: showTableView }" @click="showTableView = !showTableView">
          {{ showTableView ? '📋 실시간 주문' : '🪑 테이블 현황' }}
        </button>
        <router-link to="/owner/settlement" class="nav-btn-header">📊 매출 정산</router-link>
        <router-link to="/owner/settings" class="nav-btn-header">⚙️ 설정 관리</router-link>
        <button class="back-btn" @click="goBackToDashboard">🏠 대시보드</button>
      </div>
    </div>

    <div class="main-layout">

      <!-- ── 테이블 현황 뷰 (메인 100% 전환) ────────── -->
      <div v-if="showTableView" class="center-content">
        <div class="orders-header">
          <div class="orders-title-area">
            <h2 class="orders-main-title">🪑 테이블 현황</h2>
            <div class="orders-count-badge">{{ tables.length }}개</div>
          </div>
        </div>
        <div v-if="tables.length > 0" class="table-grid-full">
          <div
            v-for="table in tables"
            :key="table.number"
            class="table-card"
            @click="openTableDetail(table)"
          >
            <div class="table-number">{{ table.number }}번 테이블</div>
            <div class="table-orders">
              <div v-if="table.detailOrders.length === 0" class="table-no-order">주문 없음</div>
              <div v-for="order in table.detailOrders.slice(0, 5)" :key="order.id" class="table-order-line">
                {{ order.menu }} × {{ order.quantity }}
                <span v-if="order.option" class="table-order-option">{{ order.option }}</span>
              </div>
              <div v-if="table.detailOrders.length > 5" class="table-order-more">
                +{{ table.detailOrders.length - 5 }}건 더보기
              </div>
            </div>
            <div v-if="table.total > 0" class="table-total">{{ formatPrice(table.total) }}원</div>
          </div>
        </div>
        <div v-else class="empty-orders">
          <div class="empty-orders-icon">🍽️</div>
          <div class="empty-orders-title">등록된 테이블이 없습니다</div>
          <div class="empty-orders-desc">설정 관리에서 테이블을 추가해주세요</div>
        </div>
      </div>

      <!-- ── 실시간 주문 뷰 (기존 메인) ────────────── -->
      <div v-else class="center-content">

        <!-- 직원 호출 알림 바 -->
        <div class="call-alert-bar">
          <div class="call-alert-title">
            <span class="call-alert-icon">🔔</span>
            직원 호출 <span class="call-alert-count">{{ calledTables.length }}건</span>
          </div>
          <div class="call-alert-list">
            <div v-for="table in calledTables" :key="'call-' + table.number" class="call-alert-item">
              <span class="call-alert-table">{{ table.number }}번 테이블</span>
              <button class="call-dismiss-btn" @click="dismissCall(table)">확인</button>
            </div>
          </div>
          <!-- <div v-else class="call-alert-empty">호출 없음</div> -->
        </div>

        <!-- 실시간 주문 헤더 -->
        <div class="orders-header">
          <div class="orders-title-area">
            <h2 class="orders-main-title">실시간 주문</h2>
            <div class="orders-count-badge">{{ realtimeOrders.length }}건</div>
          </div>
        </div>

        <!-- 실시간 주문 그리드 -->
        <div v-if="realtimeOrders.length > 0" class="orders-grid">
          <div v-for="order in realtimeOrders" :key="order.id" class="order-card" :class="{ 'is-gift': order.status === '선물' }">
            <div class="order-card-header">
              <div class="order-card-table">{{ order.tableNumber }}번 테이블</div>
              <div class="order-card-time">{{ order.time }}</div>
            </div>
            <div class="order-card-body">
              <div class="order-card-menu">{{ order.menu }}</div>
              <div class="order-card-detail">
                <span class="order-card-option">{{ order.option || '옵션 없음' }}</span>
                <span class="order-card-qty">{{ order.quantity }}개</span>
              </div>
              <div v-if="order.price > 0" class="order-card-price">{{ formatPrice(order.price * order.quantity) }}원</div>
            </div>
            <button class="order-complete-btn" @click="completeOrder(order)">
              ✓ 조리 완료
            </button>
          </div>
        </div>

        <div v-else class="empty-orders">
          <div class="empty-orders-icon">📋</div>
          <div class="empty-orders-title">대기 중인 주문이 없습니다</div>
          <div class="empty-orders-desc">새로운 주문이 들어오면 여기에 표시됩니다</div>
        </div>
      </div>
    </div>

    <!-- ── 테이블 상세 모달 ──────────────────────────── -->
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
import {ref, computed, onMounted, onUnmounted} from "vue";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {useToast} from 'vue-toastification'
import {useStoreInfo} from "@/store/storeInfo";
import axios from "axios";
import {useRouter} from "vue-router";
import {EventSourcePolyfill} from "event-source-polyfill";

const router = useRouter();
const toast = useToast();
const realtimeOrders = ref([]);
const storeInfo = useStoreInfo();
const tables = ref([]);
const showTableDetail = ref(false);
const selectedTable = ref(null);
const showTableView = ref(false);
const CALL_STORAGE_KEY = 'staffCallTables'  //호출 상태저장(화면이동후에도 남아있게)

// 호출 중인 테이블 목록 (실시간 주문 위 호출 바에 표시)
const calledTables = computed(() => tables.value.filter(t => t.hasCall))

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
  const calledNums = tables.value.filter(t => t.hasCall).map(t => t.number)
  localStorage.setItem(CALL_STORAGE_KEY, JSON.stringify(calledNums))
}
const loadCallState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CALL_STORAGE_KEY) || '[]')
    saved.forEach(num => {
      const table = tables.value.find(t => t.number === num)
      if (table) table.hasCall = true
    })
  } catch { /* 무시 */ }
}

// 호출알람끄기
const dismissCall = (table) => {
  table.hasCall = false
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

      // pub/sub 구독 (OrderCreateDto) - webPublisher 전용
      stompClient.subscribe(`/topic/order/${storeId.value}`, (message) => {
        const orderDto = JSON.parse(message.body);
        handleNewOrder(orderDto);
      });

      // 점주 전용 큐 구독 — ORDER_DONE 처리 전용
      // (새 주문 추가는 /topic/order/ 구독의 handleNewOrder에서 처리)
      stompClient.subscribe(`/topic/order-queue/${storeId.value}`, (message) => {
        const data = JSON.parse(message.body);

  if (data.type === 'ORDER_DONE') {
    realtimeOrders.value = realtimeOrders.value.filter(o => o.orderingId !== data.orderingId);
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
    headers: {Authorization: `Bearer ${token}`}
  })
  eventSource.addEventListener('connect', (e) => {
    console.log('SSE 연결 완료:', e.data)
  })
  // 직원호출 이벤트 수신
  eventSource.addEventListener('staffcall', (e) => {
    const data = JSON.parse(e.data)
    console.log('직원호출 수신:', data)

    // 해당 테이블 카드에 호출 표시
    const table = tables.value.find(t => t.number === Number(data.tableNum))
    if (table) {
      table.hasCall = true
      saveCallState()
    }
    // 토스트 알림
    toast.warning(`🔔 ${data.message}`)
  })
  eventSource.onerror = (e) => { console.error('SSE 에러:', e) }
}

// 새 주문 처리 (OrderCreateDto — /topic/order/ 구독)
const handleNewOrder = (orderDto) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

 if (orderDto.type === 'PRESENT') {
    orderDto.menuDtoList?.forEach((menu) => {
      // 실시간 주문 카드
      realtimeOrders.value.push({
        id: `${orderDto.groupId}-${menu.menuName}-${Date.now()}`,
        tableNum: orderDto.senderTableNum,
        time,
        menu: `🎁 ${menu.menuName} → ${orderDto.receiverTableNum}번`,
        option: '선물',
        quantity: menu.menuQuantity,
        price: 0,
        status: '선물',
        orderingId: orderDto.orderingId,
      });

      let table = tables.value.find(t => t.number === orderDto.senderTableNum);
      if (table) {
        table.detailOrders.push({
          id: `${orderDto.groupId}-${menu.menuName}`,
          menu: `🎁 ${menu.menuName} → ${orderDto.receiverTableNum}번`,
          option: '선물',
          quantity: menu.menuQuantity,
          price: 0,
        });
      }
    });
    return;
  }

  // ★ 실시간 주문 카드 (메뉴별 개별 카드) — 기존 unshift 블록 삭제하고 이걸로 교체
  orderDto.webMenuList?.forEach((menu) => {
    const optionStr = menu.optionList
        ?.map(opt => `${opt.optionGroupName}: ${opt.optionDetailList?.map(d => d.optionDetailName).join(', ')}`)
        .join(' / ') || null

    realtimeOrders.value.push({
      // id: `${orderDto.orderingId}-${Date.now()}-${Math.random()}`,
      // orderingId: orderDto.orderingId,
      id: `${orderDto.orderingId}-${menu.menuName}-${Date.now()}-${Math.random()}`,
      tableNum: orderDto.tableNum,
      time,
      menu: menu.menuName,
      option: optionStr,
      quantity: menu.quantity,
      price: menu.menuPrice ?? 0,
      status: '주문접수',
      orderingId: orderDto.orderingId,
    })
  });

  // ★ 테이블 카드 업데이트
  let table = tables.value.find((t) => t.number === orderDto.tableNumber);
  if (!table) {
    table = {number: orderDto.tableNum, total: 0, hasCall: false, orders: [], detailOrders: []};
    tables.value.push(table);
    tables.value.sort((a, b) => a.number - b.number);
  }
  // 메뉴별로 테이블에 누적
  orderDto.webMenuList?.forEach((menu) => {
    const optionStr = menu.optionList
      ?.map((opt) => `${opt.optionGroupName}: ${opt.optionDetailList?.map((d) => d.optionDetailName).join(", ")}`)
      .join(" / ") || null;
    // 옵션 추가금액 합산
    const optionPrice = menu.optionList
      ?.flatMap((opt) => opt.optionDetailList ?? [])
      .reduce((sum, d) => sum + (d.optionDetailPrice ?? 0), 0) ?? 0;
    table.detailOrders.push({
      id: `${orderDto.orderingId}-${menu.menuName}-${Date.now()}`,
      menu: menu.menuName,
      option: optionStr,
      quantity: menu.quantity,
      price: (menu.menuPrice ?? 0) + optionPrice,
    });
    table.total += ((menu.menuPrice ?? 0) + optionPrice) * menu.quantity;
  });
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
  // 테이블 목록 로드
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
    loadCallState();  //호출 상태저장
  } catch (e) {
    toast.error(e.response?.data?.errorMessage || "테이블 불러오기 실패")
  }
  // 웹소켓 연결
  connectWebSocket();

  // SSE연결(직원호출 수신용)
  connectSSE();
});

onUnmounted(() => {
  stompClient?.deactivate();
  eventSource?.close();
});

// 원화 표시
const formatPrice = (price) => (price ?? 0).toLocaleString("ko-KR");

// 테이블 클릭 시 상세 모달 오픈
const openTableDetail = (table) => {
  selectedTable.value = table;
  showTableDetail.value = true;
};

const processPayment = () => {
  router.push({
    name: 'POSPayment',
    query: {
      tableNum: selectedTable.value.number,
      tableId: selectedTable.value.tableId,
      amount: selectedTable.value.total,
    }
  })
};

const completeOrder = async (order) => {
  console.log('삭제할 order.id:', order.id)
  try {
    await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/ordering/${order.orderingId}/done`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken.value}` } }  //
    )
    // 같은 orderingId의 모든 카드 제거
    // realtimeOrders.value = realtimeOrders.value.filter(o => o.orderingId !== order.orderingId);
    console.log('삭제 후 realtimeOrders:', realtimeOrders.value.map(o => o.id))
  } catch (e) {
    toast.error(e.response?.data?.errorMessage || "주문완료 처리 실패");
  }
}
</script>

<style scoped>
@import "@/assets/css/OwnerPanel.css";
</style>