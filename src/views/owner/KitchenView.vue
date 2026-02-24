<template>
  <div class="kitchen-dashboard">
    <!-- ── 헤더 ─────────────────────────────────────── -->
    <div class="header">
      <div class="header-left">
        <div class="store-name">{{ storeInfo.storeName }}</div>
        <div class="kitchen-label">🍳 주방</div>
      </div>
      <div class="header-right">
        <div class="order-stats">
          <span class="stat-item">대기 <strong>{{ pendingCount }}</strong></span>
          <span class="stat-divider">|</span>
          <span class="stat-item">완료 <strong>{{ completedCount }}</strong></span>
        </div>
        <button class="back-btn" @click="goBack">← 돌아가기</button>
      </div>
    </div>

    <!-- ── 메인: 주문 카드 그리드 ──────────────────── -->
    <div class="kitchen-main">
      <div v-if="orders.length > 0" class="orders-grid">
        <div
          v-for="order in orders"
          :key="order.orderingId"
          class="order-card"
          :class="{
            'all-done': order.menus.every(m => m.done),
            'is-gift': order.isGift
          }"
        >
          <!-- 카드 헤더 -->
          <div class="order-card-header">
            <div class="order-card-table">{{ order.tableNumber }}번</div>
            <div class="order-card-time">{{ order.time }}</div>
          </div>

          <!-- 메뉴 리스트 -->
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
              <button
                v-if="!menu.done"
                class="menu-done-btn"
                @click="markMenuDone(order, idx)"
              >
                완료
              </button>
              <div v-else class="menu-done-check">✓</div>
            </div>
          </div>

          <!-- 카드 하단: 전체 완료 시 서빙 버튼 -->
          <div class="order-card-footer">
            <button
              v-if="order.menus.every(m => m.done) && !order.submitted"
              class="serving-btn"
              @click="submitOrder(order)"
            >
              🍽️ 서빙 완료
            </button>
            <div v-else-if="order.submitted" class="submitted-label">
              ✅ 전달 완료
            </div>
            <div v-else class="progress-bar-wrap">
              <div class="progress-bar" :style="{ width: getProgress(order) + '%' }"></div>
              <span class="progress-text">{{ getDoneCount(order) }}/{{ order.menus.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
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

// 토큰/storeId
const accessToken = ref(localStorage.getItem("accessToken"));
const storeId = ref(localStorage.getItem("ownerStoreId"));
let stompClient = null;

// 통계
const pendingCount = computed(() => orders.value.filter(o => !o.submitted).length);
const completedCount = ref(0);

// JWT에서 storeId 파싱
const parseStoreIdFromToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.storeId;
  } catch { return null; }
};

// 돌아가기
const goBack = () => {
  router.push("/owner/panel");
};

// 진행률 계산
const getProgress = (order) => {
  if (order.menus.length === 0) return 0;
  return (order.menus.filter(m => m.done).length / order.menus.length) * 100;
};
const getDoneCount = (order) => order.menus.filter(m => m.done).length;

// 메뉴 완료 처리
const markMenuDone = (order, menuIdx) => {
  order.menus[menuIdx].done = true;
};

// 전체 완료 → 오너에게 전달 (POST /ordering/{orderingId}/done)
const submitOrder = async (order) => {
  try {
    await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/ordering/${order.orderingId}/done`,
      null,
      { headers: { Authorization: `Bearer ${accessToken.value}` } }
    );
    order.submitted = true;
    completedCount.value++;
    toast.success(`${order.tableNumber}번 테이블 주문 서빙 완료!`);

    // 3초 후 카드 제거
    setTimeout(() => {
      orders.value = orders.value.filter(o => o.orderingId !== order.orderingId);
    }, 3000);
  } catch (e) {
    console.error("서빙 완료 실패:", e);
    toast.error(e.response?.data?.errorMessage || "서빙 완료 처리에 실패했습니다.");
  }
};

// 웹소켓 연결 — /topic/order/{storeId} 구독
const connectWebSocket = () => {
  if (!accessToken.value || !storeId.value) return;
  stompClient = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8083/connect"),
    connectHeaders: { Authorization: `Bearer ${accessToken.value}` },
    onConnect: () => {
      console.log("주방 웹소켓 연결됨");

      // 새 주문 수신 (OrderCreateDto)
      stompClient.subscribe(`/topic/order/${storeId.value}`, (message) => {
        const orderDto = JSON.parse(message.body);
        handleNewOrder(orderDto);
      });
    },
    onStompError: (frame) => console.error("STOMP 에러:", frame),
  });
  stompClient.activate();
};

// 새 주문 → 카드 추가
const handleNewOrder = (orderDto) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // 선물 주문
  if (orderDto.receiverTableNum != null) {
    const menus = (orderDto.menuDtoList || []).map((menu) => ({
      name: `🎁 ${menu.menuName} → ${orderDto.receiverTableNum}번`,
      quantity: menu.menuQuantity,
      option: null,
      done: false,
    }));
    orders.value.unshift({
      orderingId: orderDto.orderingId || Date.now(),
      tableNumber: orderDto.senderTableNum,
      time,
      menus,
      isGift: true,
      submitted: false,
    });
    toast.info(`🎁 ${orderDto.senderTableNum}번 → ${orderDto.receiverTableNum}번 선물 주문`);
    return;
  }

  // 일반 주문
  const menus = (orderDto.webMenuList || []).map((menu) => {
    const optionStr = menu.optionList
      ?.map(opt => `${opt.optionGroupName}: ${opt.optionDetailList?.map(d => d.optionDetailName).join(', ')}`)
      .join(' / ') || null;
    return {
      name: menu.menuName,
      quantity: menu.quantity,
      option: optionStr,
      done: false,
    };
  });

  orders.value.unshift({
    orderingId: orderDto.orderingId,
    tableNumber: orderDto.tableNumber,
    time,
    menus,
    isGift: false,
    submitted: false,
  });

  toast.info(`📋 ${orderDto.tableNumber}번 테이블 새 주문!`);
};

// 페이지 로드 시 기존 STANDBY 주문 불러오기
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
        option: d.option?.length ? d.option.join(', ') : null,
        done: false,
      }));
      const created = dto.createAt ? new Date(dto.createAt) : now;
      const time = `${String(created.getHours()).padStart(2, "0")}:${String(created.getMinutes()).padStart(2, "0")}`;
      orders.value.push({
        orderingId: dto.orderingId,
        tableNumber: dto.tableId,
        time,
        menus,
        isGift: false,
        submitted: false,
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

  // 기존 STANDBY 주문 로드
  await loadExistingOrders();

  // 웹소켓 연결
  connectWebSocket();
});

onUnmounted(() => {
  stompClient?.deactivate();
});
</script>

<style scoped>
@import "@/assets/css/KitchenView.css";
</style>