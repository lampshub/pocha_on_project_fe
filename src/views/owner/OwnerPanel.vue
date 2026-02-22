<template>
  <div class="owner-dashboard">
    <div class="header">
      <div class="store-name">{{ storeInfo.storeName }}</div>
      <div class="header-btns">
        <router-link to="/owner/settlement" class="nav-btn-header">📊 매출 정산</router-link>
        <router-link to="/owner/settings" class="nav-btn-header">⚙️ 설정 관리</router-link>
      </div>
    </div>

    <div class="main-layout">
      <div class="center-content">
        <div class="table-status-area">
          <!--          테이블ㄹ 있을 때-->
          <div v-if="tables.length > 0" class="table-grid">
            <div
                v-for="table in tables"
                :key="table.number"
                class="table-card"
                :class="{ 'has-call': table.hasCall }"
                @click="openTableDetail(table)">
              <div v-if="table.hasCall" class="call-badge">호출</div>
              <div class="table-number">{{ table.number }}번 테이블</div>
              <div class="table-orders">
                <div v-if="table.detailOrders.length === 0">주문 없음</div>
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
          <!--          테이블 없을 때-->
          <div v-else class="empty-table-state">
            <div class="empty-icon">🍽️</div>
            <div class="empty-title">등록된 테이블이 없습니다</div>
            <div class="empty-description">설정 관리에서 테이블을 추가해주세요</div>
            <router-link to="/owner/settings" class="add-table-btn">테이블 추가하기</router-link>
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
              <button class="complete-order-btn" @click="completeOrder(order)">완료</button>
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
import {ref, onMounted, onUnmounted} from "vue";
import {Client} from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {useToast} from 'vue-toastification'
import {useStoreInfo} from "@/store/storeInfo";
import axios from "axios";

const toast = useToast();
const realtimeOrders = ref([]);
const storeInfo = useStoreInfo();
const tables = ref([]);
const showTableDetail = ref(false);
const selectedTable = ref(null);

// 토큰/storeId
const accessToken = ref(localStorage.getItem("accessToken"));
const storeId = ref(localStorage.getItem("ownerStoreId"));

let stompClient = null;

// JWT에서 storeId 파싱
const parseStoreIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.storeId;
  } catch {
    return null;
  }
};

// 웹소켓 연결
const connectWebSocket = () => {
  if (!accessToken.value || !storeId.value) return;

  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8083/connect"),
    connectHeaders: {Authorization: `Bearer ${accessToken.value}`},
    onConnect: () => {
      console.log("웹소켓 연결됨");
      stompClient.subscribe(`/topic/order/${storeId.value}`, (message) => {
        const orderDto = JSON.parse(message.body);
        handleNewOrder(orderDto);
      });
    },
    onStompError: (frame) => console.error("STOMP 에러:", frame),
  });
  stompClient.activate();
};

// 새 주문 처리
const handleNewOrder = (orderDto) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // ★ 실시간 주문 카드 (메뉴별 개별 카드) — 기존 unshift 블록 삭제하고 이걸로 교체
  orderDto.webMenuList?.forEach((menu) => {
    const optionStr = menu.optionList
        ?.map(opt => `${opt.optionGroupName}: ${opt.optionDetailList?.map(d => d.optionDetailName).join(', ')}`)
        .join(' / ') || null

    realtimeOrders.value.push({
      id: Date.now() + Math.random(),
      tableNumber: orderDto.tableNumber,
      time,
      menu: menu.menuName,
      option: optionStr,
      quantity: menu.quantity,
      price: menu.menuPrice ?? 0,
      status: '주문접수',
      orderingId: orderDto.orderingId,
    })
  });

  // ★ 테이블 카드 업데이트 — 기존 코드 그대로
  let table = tables.value.find((t) => t.number === orderDto.tableNumber);
  if (!table) {
    table = {number: orderDto.tableNumber, total: 0, hasCall: false, orders: [], detailOrders: []};
    tables.value.push(table);
    tables.value.sort((a, b) => a.number - b.number);
  }

  orderDto.webMenuList?.forEach((menu) => {
    const optionStr =
        menu.optionList
            ?.map(
                (opt) =>
                    `${opt.optionGroupName}: ${opt.optionDetailList
                        ?.map((d) => d.optionDetailName)
                        .join(" / ")}`,
            )
            .join(" / ") || null;
    const optionPrice =
        menu.optionList
            ?.flatMap((opt) => opt.optionDetailList ?? [])
            .reduce((sum, d) => sum + (d.optionDetailPrice ?? 0), 0) ?? 0;

    table.detailOrders.push({
      id: Date.now(),
      menu: menu.menuName,
      option: optionStr,
      quantity: menu.quantity,
      price: (menu.menuPrice ?? 0) + optionPrice,
    });
    table.total += ((menu.menuPrice ?? 0) + optionPrice) * menu.quantity;
  });
};

onMounted(async () => {
  // storeInfo 로드
  if (!storeInfo.storeName) {
    storeInfo.loadFromStorage()
  }

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
  } catch (e) {
    toast.error(e.response?.data?.errorMessage || "테이블 불러오기 실패")
  }

  // 웹소켓 연결
  connectWebSocket();
});
onUnmounted(() => {
  stompClient?.deactivate();
});

const formatPrice = (price) => (price ?? 0).toLocaleString("ko-KR");

const openTableDetail = (table) => {
  selectedTable.value = table;
  showTableDetail.value = true;
  if (table.hasCall) table.hasCall = false;
};


const processPayment = () => {
  if (!selectedTable.value) return
  if (confirm(`${selectedTable.value.number}번 테이블 ${formatPrice(selectedTable.value.total)}원을 결제하시겠습니까?`)) {
    selectedTable.value.orders = []
    selectedTable.value.detailOrders = []
    selectedTable.value.total = 0
    showTableDetail.value = false
  }
};
const completeOrder = async (order) => {
  try {
    await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/ordering/${order.orderingId}/done`
    )
    realtimeOrders.value = realtimeOrders.value.filter(o => o.id !== order.id);
  } catch (e) {
    toast.error(e.response?.data?.errorMessage || "주문완료 처리 실패");
  }
}
</script>

<style scoped>
@import "@/assets/css/OwnerPanel.css";
</style>