<template>
  <div class="kitchen-dashboard">
    <div class="header">
      <div class="header-left">
        <div class="store-name">{{ storeInfo.storeName }}</div>
        <div class="kitchen-label">🍳 주방</div>
      </div>
      <div class="header-right">
        <div class="order-stats">
          <span class="stat-item">조리중 <strong>{{ cookingCount }}</strong></span>
          <span class="stat-divider">|</span>
          <span class="stat-item">서빙대기 <strong>{{ waitingCount }}</strong></span>
        </div>
        <button class="back-btn" @click="goBack">← 돌아가기</button>
      </div>
    </div>

    <div class="kitchen-main">
      <div v-if="orders.length > 0" class="orders-grid">
        <div
          v-for="order in orders"
          :key="order.orderingId"
          class="order-card"
          :class="{ 'all-done': order.menus.every(m => m.done), 'is-gift': order.isGift }"
        >
          <div class="order-card-header">
            <div class="order-card-table">{{ order.tableNumber }}번</div>
            <div class="order-card-time">{{ order.time }}</div>
          </div>

          <div class="order-card-menus">
            <div
              v-for="(menu, idx) in order.menus"
              :key="idx"
              class="menu-row"
              :class="{ 'menu-done': menu.done }"
            >
              <div class="menu-info">
                <div class="menu-name">{{ menu.name }}</div>
                <div class="menu-detail">
                  <span class="menu-qty">{{ menu.quantity }}개</span>
                  <span v-if="menu.option" class="menu-option">{{ menu.option }}</span>
                </div>
              </div>
              <button v-if="!menu.done" class="menu-done-btn" @click="markMenuDone(order, idx)">완료</button>
              <div v-else class="menu-done-check">✓</div>
            </div>
          </div>

          <div class="order-card-footer">
            <div v-if="order.finalized" class="submitted-label">✅ 서빙 완료</div>
            <div v-else-if="order.menus.every(m => m.done)" class="submitted-label">🍽️ 서빙 대기 중...</div>
            <div v-else class="progress-bar-wrap">
              <div class="progress-bar" :style="{ width: getProgress(order) + '%' }"></div>
              <span class="progress-text">{{ getDoneCount(order) }}/{{ order.menus.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-kitchen">
        <div class="empty-icon">🍳</div>
        <div class="empty-title">대기 중인 주문이 없습니다</div>
        <div class="empty-desc">새로운 주문이 들어오면 여기에 표시됩니다</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useToast } from "vue-toastification";
import { useStoreInfo } from "@/store/storeInfo";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const toast = useToast();
const storeInfo = useStoreInfo();
const orders = ref([]);

const accessToken = ref(localStorage.getItem("accessToken"));
const storeId = ref(localStorage.getItem("ownerStoreId"));
let stompClient = null;

const cookingCount = computed(() =>
  orders.value.filter(o => !o.finalized && !o.menus.every(m => m.done)).length
);
const waitingCount = computed(() =>
  orders.value.filter(o => !o.finalized && o.menus.every(m => m.done)).length
);

const parseStoreIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.storeId;
  } catch { return null; }
};

const goBack = () => router.push("/owner/panel");

const getProgress = (order) => {
  if (order.menus.length === 0) return 0;
  return (order.menus.filter(m => m.done).length / order.menus.length) * 100;
};
const getDoneCount = (order) => order.menus.filter(m => m.done).length;

// 메뉴 단건 완료 → 점주 패널에 MENU_DONE 전송
const markMenuDone = (order, menuIdx) => {
  order.menus[menuIdx].done = true;
  toast.success(`✓ ${order.menus[menuIdx].name} 조리 완료`);

  if (stompClient?.connected) {
    stompClient.publish({
      destination: `/topic/order-queue/${storeId.value}`,
      body: JSON.stringify({
        type: 'MENU_DONE',
        orderingId: order.orderingId,
        tableNumber: order.tableNumber,
        menuName: order.menus[menuIdx].name,
        menuQuantity: order.menus[menuIdx].quantity,
        menuOption: order.menus[menuIdx].option || null,
        menuIndex: menuIdx,
        menuTotal: order.menus.length,
      }),
    });
  }
};

// ORDER_DONE 수신 → 해당 주문 카드 제거
const handleOrderDone = (orderingId) => {
  const order = orders.value.find(o => o.orderingId === orderingId);
  if (order) order.finalized = true;
  setTimeout(() => {
    orders.value = orders.value.filter(o => o.orderingId !== orderingId);
  }, 2000);
};

// 새 주문 수신
const handleNewOrder = (orderDto) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 선물 주문
  if (orderDto.receiverTableNum != null) {
    const menus = (orderDto.menuDtoList || []).map((m) => ({
      name: `🎁 ${m.menuName} → ${orderDto.receiverTableNum}번`,
      quantity: m.menuQuantity,
      option: null,
      done: false,
    }));
    orders.value.unshift({
      orderingId: orderDto.orderingId || Date.now(),
      tableNumber: orderDto.senderTableNum,
      time, menus, isGift: true, finalized: false,
    });
    toast.info(`🎁 선물 주문 접수`);
    return;
  }

  // 일반 주문
  const menus = (orderDto.webMenuList || []).map((menu) => {
    const optionStr = menu.optionList
      ?.map(opt => `${opt.optionGroupName}: ${opt.optionDetailList?.map(d => d.optionDetailName).join(", ")}`)
      .join(" / ") || null;
    return { name: menu.menuName, quantity: menu.quantity, option: optionStr, done: false };
  });

  orders.value.unshift({
    orderingId: orderDto.orderingId,
    tableNumber: orderDto.tableNum,
    time, menus, isGift: false, finalized: false,
  });
  toast.info(`📋 ${orderDto.tableNum}번 테이블 새 주문!`);
};

// 웹소켓 연결
const connectWebSocket = () => {
  if (!accessToken.value || !storeId.value) return;
  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8083/connect"),
    connectHeaders: { Authorization: `Bearer ${accessToken.value}` },
    onConnect: () => {
      console.log("주방 웹소켓 연결됨");

      // 손님 → 주방: 신규 주문 수신
      stompClient.subscribe(`/topic/order/${storeId.value}`, (message) => {
        const orderDto = JSON.parse(message.body);
        handleNewOrder(orderDto);
      });

      // 점주 → 주방: ORDER_DONE 수신 (서빙 완료 후 카드 제거)
      stompClient.subscribe(`/topic/order-queue/${storeId.value}`, (message) => {
        const data = JSON.parse(message.body);
        if (data.type === 'ORDER_DONE') {
          handleOrderDone(data.orderingId);
        }
      });
    },
    onStompError: (frame) => console.error("STOMP 에러:", frame),
  });
  stompClient.activate();
};

// 기존 대기 주문 복원
const loadExistingOrders = async () => {
  try {
    const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/ordering/queue`, {
      headers: { Authorization: `Bearer ${accessToken.value}` },
    });
    const now = new Date();
    res.data.forEach((dto) => {
      const menus = (dto.orderingDetailInfos || []).map((d) => ({
        name: d.menuName,
        quantity: d.quantity,
        option: d.option?.length ? d.option.join(", ") : null,
        done: false,
      }));
      const created = dto.createAt ? new Date(dto.createAt) : now;
      const time = `${String(created.getHours()).padStart(2, "0")}:${String(created.getMinutes()).padStart(2, "0")}`;
      orders.value.push({
        orderingId: dto.orderingId,
        tableNumber: dto.tableId,
        time, menus, isGift: false, finalized: false,
      });
    });
  } catch (e) {
    console.error("기존 주문 로드 실패:", e);
  }
};

onMounted(async () => {
  storeInfo.loadFromStorage();
  const token = localStorage.getItem("accessToken");
  if (token && !storeId.value) {
    const parsed = parseStoreIdFromToken(token);
    if (parsed) {
      storeId.value = String(parsed);
      localStorage.setItem("ownerStoreId", storeId.value);
    }
  }
  await loadExistingOrders();
  connectWebSocket();
});

onUnmounted(() => { stompClient?.deactivate(); });
</script>

<style scoped>
@import "@/assets/css/KitchenView.css";
</style>
