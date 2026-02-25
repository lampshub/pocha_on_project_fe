<template>
  <div class="dashboard-root">

    <!-- 환영 헤더 -->
    <div class="welcome-header">
      <div class="welcome-content">
        <h1 class="welcome-message">
          <span class="owner-name">{{ ownerName }}님</span> 환영합니다
        </h1>
        <div class="datetime-display">
          <div class="date-text">{{ currentDate }}</div>
          <div class="time-text">{{ currentTime }}</div>
        </div>
      </div>
    </div>

    <!-- 메인 컨테이너 -->
    <div class="main-container">

      <!-- 왼쪽: 매출 현황 -->
      <div class="sales-panel">
        <div class="sales-card">
          <div class="sales-icon">💰</div>
          <div class="sales-label">월 매출 현황</div>
          <div class="sales-amount">
            {{ formatNumber(monthlySales) }}
            <span class="currency">원</span>
          </div>
          <div class="sales-change positive">
            <span>↑</span>
            <span>전월 대비 {{ monthlyGrowth }}%</span>
          </div>
        </div>

        <div class="sales-card">
          <div class="sales-icon">📊</div>
          <div class="sales-label">월 매출 평균</div>
          <div class="sales-amount">
            {{ formatNumber(monthlyAverage) }}
            <span class="currency">원</span>
          </div>
          <div class="sales-change positive">
            <span>↑</span>
            <span>최근 3개월 기준</span>
          </div>
        </div>

        <div class="sales-card">
          <div class="sales-icon">📈</div>
          <div class="sales-label">일 매출 평균</div>
          <div class="sales-amount">
            {{ formatNumber(dailyAverage) }}
            <span class="currency">원</span>
          </div>
          <div class="sales-change positive">
            <span>↑</span>
            <span>이번 달 기준</span>
          </div>
        </div>
      </div>

      <!-- 가운데: 매장 리스트 -->
      <div class="store-section">
        <div class="section-header">
          <h2 class="section-title">내 매장</h2>
          <button class="add-store-btn" @click="goToAddStore">
            <span>➕</span>
            <span>매장 추가</span>
          </button>
        </div>

        <div class="store-grid">
          <!-- 매장 카드 -->
          <div
              v-for="store in stores"
              :key="store.id"
              class="store-card"
              @click="handleStoreClick(store)"
          >
            <div class="store-header">
              <div class="store-main-info">
                <div class="store-name">{{ store.storeName }}</div>
                <div class="store-address">{{ store.address }}</div>
              </div>
              <div :class="['store-status', store.isOpen ? 'open' : 'closed']">
                {{ store.isOpen ? "OPEN" : "CLOSED" }}
              </div>
            </div>

            <div class="store-info">
              <div class="info-item">
                <div class="info-label">Today Sales</div>
                <div class="info-value highlight">
                  {{ formatNumberShort(store.todaySales) }}
                </div>
              </div>
              <div class="info-item">
                <div class="info-label">Tables</div>
                <div class="info-value">{{ store.tableCount || 0 }}개</div>
              </div>
              <div class="info-item">
                <div class="info-label">Orders</div>
                <div class="info-value">{{ store.todayOrders }}건</div>
              </div>
            </div>
          </div>

          <!-- 빈 상태 -->
          <div v-if="stores.length === 0" class="empty-state">
            <div class="empty-icon">🏪</div>
            <div class="empty-title">등록된 매장이 없습니다</div>
            <div class="empty-description">
              매장을 추가하여 관리를 시작하세요
            </div>
            <button class="add-store-btn" @click="goToAddStore">
              <span>➕</span>
              <span>첫 매장 추가하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 모드 선택 모달 -->
    <transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-store-name">{{ selectedStore?.storeName }}</div>
            <div class="modal-store-address">{{ selectedStore?.address }}</div>
          </div>

          <div class="modal-buttons">
            <button class="mode-btn" @click="goToCustomerView">
              <div class="mode-icon">👥</div>
              <div class="mode-title">손님 화면</div>
              <div class="mode-desc">QR 주문 및<br />메뉴 확인</div>
            </button>

            <button class="mode-btn" @click="goToOwnerView">
              <div class="mode-icon">⚙️</div>
              <div class="mode-title">점주 화면</div>
              <div class="mode-desc">매장 관리 및<br />주문 처리</div>
            </button>
          </div>

          <button class="modal-close-btn" @click="closeModal">닫기</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios"; // 또는 이미 설정된 axios 인스턴스
const router = useRouter();

// ── 상태 ──────────────────────────────────────────────
// 로컬 스토리지에서 이름 가져오기
const ownerName = ref(localStorage.getItem("ownerName") || "점주");
const currentDate = ref("");
const currentTime = ref("");
const showModal = ref(false);
const selectedStore = ref(null);

// 대시보드 상단 통계 데이터
const monthlySales = ref(0);
const monthlyAverage = ref(0);
const dailyAverage = ref(0);
const monthlyGrowth = ref(0);

// 매장 목록 (백엔드 StoreListDto 대응)
const stores = ref([]);

// ── 데이터 로드 함수 ────────────────────────────────────
const fetchDashboardData = async () => {
  try {
    // 1. 매장 리스트 조회
    const baseUrl = process.env.VUE_APP_API_BASE_URL;
    const storeResponse = await axios.post(`${baseUrl}/store/list`);
    console.log("매장 리스트 데이터:", storeResponse.data);
    stores.value = storeResponse.data;

    // 2. 각 매장별 매출 데이터를 가져와 대시보드 통계 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    let totalMonthly = 0;
    let totalDaily = 0;
    let storeCount = stores.value.length;

    if (storeCount > 0) {
      // 모든 매장의 데이터를 병렬로 요청
      const settlementPromises = stores.value.map(async (store) => {
        // 월 매출 정보 (Calendar API 활용)
        const monthlyRes = await axios.get(
          `${baseUrl}/store/monthlysettlement`,
          {
            params: { year: currentYear, month: currentMonth, day: currentDay },
            headers: { storeId: store.id }, // @RequestAttribute 대응 (인터셉터 설정에 따라 다를 수 있음)
          },
        );

        // 일 매출 정보 (Daily API 활용)
        const dailyRes = await axios.get(`${baseUrl}/store/dailysettlement`, {
          params: { year: currentYear, month: currentMonth, day: currentDay },
          headers: { storeId: store.id },
        });

        // 데이터 합산
        const monthlyTotalForStore = Object.values(
          monthlyRes.data.dailySales || {},
        ).reduce((a, b) => a + b, 0);
        return {
    monthly: monthlyTotalForStore,
    daily: dailyRes.data.dayTotal || 0, // dayTotal -> dayTotalAmount 로 수정
    todayOrders: dailyRes.data.orderCount || 0
  };
      });

      const results = await Promise.all(settlementPromises);

      results.forEach((res, index) => {
        totalMonthly += res.monthly;
        totalDaily += res.daily;

        // 개별 매장 카드에 실시간 매출/주문 수 할당
        stores.value[index].todaySales = res.daily;
        stores.value[index].todayOrders = res.todayOrders;
      });

      // 상단 요약 카드에 값 할당
      dailyAverage.value = totalDaily; // 일일 총 매출액
      monthlySales.value = totalMonthly; // 이번 달 총 매출액
      monthlyAverage.value = totalMonthly / (storeCount || 1); // 매장당 월 평균 매출
    }
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
};

// ── 날짜 / 시간 (기존 유지) ───────────────────────────
const updateDateTime = () => {
  const now = new Date();
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  currentDate.value = `${now.getFullYear()}년 ${
    now.getMonth() + 1
  }월 ${now.getDate()}일 (${days[now.getDay()]})`;
  currentTime.value = now.toLocaleTimeString("ko-KR", { hour12: false });
};

let timer;
onMounted(() => {
  updateDateTime();
  timer = setInterval(updateDateTime, 1000);
  fetchDashboardData(); // 데이터 호출
});
onUnmounted(() => clearInterval(timer));

// ── 숫자 포맷 (기존 유지) ───────────────────────────────
const formatNumber = (num) => (num ? num.toLocaleString("ko-KR") : 0);
const formatNumberShort = (num) => {
  if (!num) return "0원";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}백만`;
  if (num >= 10000) return `${Math.floor(num / 10000)}만원`;
  return `${num.toLocaleString("ko-KR")}원`;
};

// ── 이벤트 핸들러 ────────────────────────────────────
const handleStoreClick = (store) => {
  selectedStore.value = store;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedStore.value = null;
};

const goToCustomerView = async () => {
  if (!selectedStore.value) return;
  try {
    const baseUrl = process.env.VUE_APP_API_BASE_URL;
    const response = await axios.post(`${baseUrl}/store/select`, {
      storeId: selectedStore.value.id
    });
    const token = response.data.storeAccessToken;
    if (!token) {
      alert("매장 인증에 실패했습니다.");
      return;
    }

    // ── BASE 토큰 백업 추가 ──────────────────────────────
    const baseToken = localStorage.getItem('accessToken');
    localStorage.setItem('baseAccessToken', baseToken);

    localStorage.setItem('accessToken', token);
    localStorage.setItem('currentStoreId', selectedStore.value.id);
    localStorage.setItem('currentStoreName', selectedStore.value.storeName);
    localStorage.setItem('currentStoreAddress', selectedStore.value.address);

    closeModal();
    router.push('/another/tableselect');
  } catch (error) {
    console.error("손님 화면 진입 실패:", error);
    alert("매장 진입에 실패했습니다.");
  }
};

const goToOwnerView = async () => {
  if (!selectedStore.value) return;
  try {
    const baseUrl = process.env.VUE_APP_API_BASE_URL;

    // 1. 서버에 매장 선택 요청 (현재 BASE 토큰이 Authorization 헤더에 있어야 함)
    const response = await axios.post(`${baseUrl}/store/select`, {
      storeId: selectedStore.value.id
    });

    console.log("서버 응답 데이터:", response.data);

    // 2. 응답 데이터의 키값이 'storeAccessToken'이므로 이를 정확히 추출합니다.
    const token = response.data.storeAccessToken;

    if (token) {
      // ✅ BASE 토큰 백업 (뒤로가기 시 복원용)
      const baseToken = localStorage.getItem('accessToken');
      
      localStorage.setItem('baseAccessToken', baseToken);
      // 3. 로컬 스토리지 갱신 (기존 BASE -> STORE 토큰으로 교체)
      localStorage.setItem('accessToken', token);

      localStorage.setItem('currentStoreId', selectedStore.value.id);
      localStorage.setItem('currentStoreName', selectedStore.value.storeName);
      localStorage.setItem('currentStoreAddress', selectedStore.value.address);

      console.log("토큰 교체 성공! 새 토큰(STORE)으로 이동합니다.");

      // 4. 화면 이동
      router.push("/owner/panel");
    } else {
      console.error("응답에 토큰이 없습니다. 필드명을 확인하세요.");
    }
  } catch (error) {
    console.error("매장 인증 및 이동 실패:", error);
    alert("매장 진입에 실패했습니다.");
  }
};

const goToAddStore = () => {
  router.push("/another/addstore");
};
</script>

<style scoped>
@import "@/assets/css/OwnerDashBoard.css";
</style>
