<template>
  <div class="payment-result-page">
    <div v-if="isLoading" class="result-loading">
      <div class="loading-spinner"/>
      <p>결제를 승인하고 있습니다...</p>
    </div>

    <div v-else-if="paymentData" class="result-success">
      <div class="result-icon">✅</div>
      <h2>결제가 완료되었습니다!</h2>

      <div class="result-info">
        <div class="info-row">
          <span class="info-label">주문번호</span>
          <span class="info-value">{{ paymentData.orderId }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">결제금액</span>
          <span class="info-value highlight">{{ formatPrice(paymentData.totalAmount) }}원</span>
        </div>
        <div class="info-row">
          <span class="info-label">결제수단</span>
          <span class="info-value">{{ paymentData.method || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">승인일시</span>
          <span class="info-value">{{ formatDate(paymentData.approvedAt) }}</span>
        </div>
      </div>

      <button class="done-btn" @click="goHome">확인</button>
    </div>

    <div v-else-if="errorMessage" class="result-fail">
      <div class="result-icon">❌</div>
      <h2>결제 승인에 실패했습니다</h2>
      <p class="error-message">{{ errorMessage }}</p>
      <button class="done-btn" @click="goHome">돌아가기</button>
    </div>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {usePayment} from '@/composables/usePayment'

const router = useRouter()
const route = useRoute()
const {confirmPayment} = usePayment()

const isLoading = ref(true)
const paymentData = ref(null)
const errorMessage = ref('')

onMounted(async () => {
  const paymentKey = route.query.paymentKey
  const orderId = route.query.orderId
  const amount = route.query.amount

  if (!paymentKey || !orderId || !amount) {
    errorMessage.value = '잘못된 접근입니다.'
    isLoading.value = false
    return
  }

  try {
    const data = await confirmPayment({paymentKey, orderId, amount})
    paymentData.value = data
  } catch (e) {
    errorMessage.value = e.response?.data?.message || '결제 승인 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
})

const goHome = () => {
  const from = route.query.from;
  const selectedTable = JSON.parse(localStorage.getItem('selectedTable') || '{}');

  // 결제 완료 → 주문 그룹 초기화 (새 세션 시작)
  if (paymentData.value) {
    localStorage.removeItem('currentGroupId')
  }

  if (from === 'pos') {
    router.push('/owner/panel')
  } else {
    router.replace(`/customer/menu/${selectedTable.tableNum}`);
  }
}

const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.payment-result-page {
  min-height: 100vh;
  background: #0f0f1a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #fff;
}

.result-loading {
  text-align: center;
  color: #aaa;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #2a2a3e;
  border-top-color: #ea580c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.result-success,
.result-fail {
  text-align: center;
  max-width: 420px;
  width: 100%;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-success h2 {
  color: #22c55e;
  margin-bottom: 24px;
}

.result-fail h2 {
  color: #ef4444;
  margin-bottom: 12px;
}

.error-message {
  color: #aaa;
  font-size: 14px;
  margin-bottom: 24px;
}

.result-info {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #2a2a3e;
  font-size: 14px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #888;
}

.info-value {
  font-weight: 600;
}

.info-value.highlight {
  color: #ea580c;
  font-size: 18px;
  font-weight: 900;
}

.done-btn {
  width: 100%;
  padding: 16px;
  background: #ea580c;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.done-btn:hover {
  background: #c2410c;
}
</style>