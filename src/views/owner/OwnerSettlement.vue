<template>
  <div class="settlement-page">

    <!-- ── 헤더 ─────────────────────────────────────── -->
    <header class="header">
      <div class="store-name">💰 매출 정산</div>
      <router-link to="/owner/panel" class="back-btn">← 메인으로</router-link>
    </header>

    <!-- ── 메인 레이아웃 ──────────────────────────────── -->
    <div class="main-layout">

      <!-- 왼쪽 통계 영역 -->
      <aside class="stats-sidebar">
        <div class="stat-card primary">
          <div class="stat-label">오늘의 매출</div>
          <div class="stat-value">{{ formatPrice(todaySales) }}원</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">오늘의 주문</div>
          <div class="stat-value">{{ todayOrderCount }}건</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">평균 단가</div>
          <div class="stat-value">{{ formatPrice(averagePrice) }}원</div>
        </div>
      </aside>

      <!-- 오른쪽 달력 영역 -->
      <div class="calendar-area">
        <div class="page-header">
          <div class="page-title">{{ currentYear }}년 {{ currentMonth }}월 매출 현황</div>
          <div class="page-subtitle">날짜를 클릭하면 상세 내역을 확인할 수 있습니다</div>
        </div>

        <div class="calendar-container">
          <!-- 달력 헤더 -->
          <div class="calendar-header">
            <div class="calendar-month">{{ currentMonth }}월</div>
            <div class="calendar-nav">
              <button class="nav-arrow" @click="previousMonth">←</button>
              <button class="nav-arrow" @click="nextMonth">→</button>
            </div>
          </div>

          <!-- 달력 그리드 -->
          <div class="calendar-grid">
            <div v-for="d in DAY_NAMES" :key="d" class="calendar-day-header">{{ d }}</div>

            <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                class="calendar-day"
                :class="{ empty: !day.date, today: day.isToday }"
                @click="day.date && selectDay(day)"
            >
              <div v-if="day.date" class="calendar-date">{{ day.date }}</div>
              <div v-if="day.date" class="calendar-sales">{{ formatPriceShort(day.sales) }}원</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 날짜 상세 모달 ─────────────────────────────── -->
    <transition name="modal-fade">
      <div v-if="selectedDay" class="modal-overlay" @click.self="selectedDay = null">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-title">{{ currentMonth }}월 {{ selectedDay.date }}일 매출</div>
            <button class="close-btn" @click="selectedDay = null">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-row">
              <span class="detail-label">날짜</span>
              <span class="detail-value">{{ currentYear }}년 {{ currentMonth }}월 {{ selectedDay.date }}일</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">총 매출</span>
              <span class="detail-value primary">{{ formatPrice(selectedDay.sales) }}원</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">주문 건수</span>
              <span class="detail-value">{{ selectedDay.orders }}건</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">평균 단가</span>
              <span class="detail-value">
                {{ selectDay.orders > 0 ? formatPrice(Math.floor(selectedDay.sales / selectedDay.orders)) : "0" }}원
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import axios from "axios";
import {useToast} from 'vue-toastification'

const toast = useToast()

// ── 상수 ─────────────────────────────────────────────
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

// ── 상태 ─────────────────────────────────────────────
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)
const calendarDays = ref([])
const selectedDay = ref(null)

// ── 달력 생성 ─────────────────────────────────────────
const generateCalendar = () => {
  const year = currentYear.value
  const month = currentMonth.value - 1
  const today = new Date()
  const isCurrentMonth =
      year === today.getFullYear() && month === today.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()

  const days = []

  // 빈 칸
  for (let i = 0; i < firstDay; i++) {
    days.push({date: null, sales: 0, orders: 0, isToday: false})
  }

  // 날짜
  for (let date = 1; date <= lastDate; date++) {
    const orders = Math.floor(Math.random() * 50) + 10
    days.push({
      date,
      sales: Math.floor(Math.random() * 2000000) + 500000,
      orders,
      isToday: isCurrentMonth && date === today.getDate(),
    })
  }

  calendarDays.value = days
}
const todaySales = ref(0);
const todayOrderCount = ref(0);
const averagePrice = ref(0);

const fetchTodaySettlement = async () => {
  const token = localStorage.getItem('storeAccessToken');
  if (!token) return;
  try {
    const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/owner/settlement`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    todaySales.value = res.data.dayTotal;
    todayOrderCount.value = res.data.orderCount;
    averagePrice.value = res.data.averageOrderAmount;
  } catch (e) {
    toast.error(e.response?.data?.errorMessage || "정산 조회에 실패했습니다.");
  }
}
// ── 이벤트 핸들러 ─────────────────────────────────────
const selectDay = (day) => {
  selectedDay.value = day
}

const previousMonth = () => {
  if (currentMonth.value === 1) {
    currentMonth.value = 12;
    currentYear.value--
  } else currentMonth.value--
  generateCalendar()
}

const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentMonth.value = 1;
    currentYear.value++
  } else currentMonth.value++
  generateCalendar()
}

// ── 포맷 ─────────────────────────────────────────────
const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

const formatPriceShort = (price) => {
  if (price >= 10000) return Math.floor(price / 10000) + '만'
  return price.toLocaleString('ko-KR')
}

onMounted(() => {
  fetchTodaySettlement()
  generateCalendar()
})
</script>
<style scoped>
@import "@/assets/css/OwnerSettlement.css";
</style>