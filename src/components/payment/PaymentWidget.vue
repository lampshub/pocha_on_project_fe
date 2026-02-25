<template>
  <div class="payment-widget-wrapper">
    <!-- 로딩 상태 -->
    <div v-if="isLoading && !isReady" class="payment-loading">
      <div class="loading-spinner" />
      <p>결제 정보를 불러오는 중...</p>
    </div>

    <!-- 에러 상태 -->
    <div v-if="error" class="payment-error">
      <span>⚠️ {{ error }}</span>
      <button class="retry-btn" @click="retry">다시 시도</button>
    </div>

    <!-- 결제 위젯 렌더링 영역 -->
    <div v-show="isReady">
      <!-- 주문 요약 -->
      <div class="order-summary">
        <div class="summary-row">
          <span class="summary-label">주문명</span>
          <span class="summary-value">{{ orderName }}</span>
        </div>
        <div class="summary-row total">
          <span class="summary-label">결제 금액</span>
          <span class="summary-value">{{ formatPrice(amount) }}원</span>
        </div>
      </div>

      <!-- 토스 결제수단 UI (SDK가 여기에 렌더링) -->
      <div id="payment-method-widget" />

      <!-- 토스 이용약관 UI -->
      <div id="agreement-widget" />

      <!-- 결제하기 버튼 -->
      <button
          class="pay-btn"
          :disabled="!isReady || isLoading"
          @click="handlePay"
      >
        <span v-if="isLoading" class="loading-spinner small" />
        <span v-else>{{ formatPrice(amount) }}원 결제하기</span>
      </button>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable */
import { onMounted, watch } from 'vue'
import { usePayment } from '@/composables/usePayment'

const props = defineProps({
  /** 결제 금액 (원) */
  amount: { type: Number, required: true },
  /** 주문명 */
  orderName: { type: String, default: '포차온 주문' },
  /** 고객 이름 */
  customerName: { type: String, default: '' },
  /** 고객 이메일 */
  customerEmail: { type: String, default: '' },
  /** 회원 고유 키 (비회원이면 빈 문자열) */
  customerKey: { type: String, default: '' },
  /** 성공 리다이렉트 경로 */
  successPath: { type: String, default: '/payment/success' },
  /** 실패 리다이렉트 경로 */
  failPath: { type: String, default: '/payment/fail' },
  /** 서버에 함께 보낼 추가 데이터 (tableId, storeId, groupId 등) */
  metadata: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['ready', 'error', 'cancel'])

const { initWidget, updateAmount, requestPayment, isReady, isLoading, error } = usePayment()

// 위젯 초기화
onMounted(async () => {
  await initWidget(
      '#payment-method-widget',
      '#agreement-widget',
      props.amount,
      props.customerKey || undefined,
  )
  if (isReady.value) emit('ready')
  if (error.value) emit('error', error.value)
})

// 금액 변경 감지
watch(() => props.amount, async (newAmount) => {
  await updateAmount(newAmount)
})

// 결제 요청
const handlePay = async () => {
  await requestPayment({
    orderName: props.orderName,
    customerName: props.customerName || undefined,
    customerEmail: props.customerEmail || undefined,
    successPath: props.successPath,
    failPath: props.failPath,
    metadata: props.metadata,
  })

  if (error.value) {
    emit('error', error.value)
  }
}

// 재시도
const retry = async () => {
  await initWidget(
      '#payment-method-widget',
      '#agreement-widget',
      props.amount,
      props.customerKey || undefined,
  )
}

const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')
</script>

<style scoped>
.payment-widget-wrapper {
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
}

.payment-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e2e2;
  border-top-color: #ea580c;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

.loading-spinner.small {
  width: 18px;
  height: 18px;
  border-width: 2px;
  margin-bottom: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.payment-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  background: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #dc2626;
  font-size: 14px;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 6px 14px;
  background: #dc2626;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.order-summary {
  background: #1a1a2e;
  border: 1px solid #2a2a3e;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #aaa;
  margin-bottom: 8px;
}

.summary-row.total {
  margin-bottom: 0;
  padding-top: 10px;
  border-top: 1px solid #2a2a3e;
  font-size: 18px;
  font-weight: 900;
  color: #ea580c;
}

.summary-label {
  font-weight: 600;
}

.pay-btn {
  width: 100%;
  padding: 16px;
  margin-top: 16px;
  background: #ea580c;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pay-btn:hover:not(:disabled) {
  background: #c2410c;
}

.pay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>