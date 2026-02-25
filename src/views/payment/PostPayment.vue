<template>
  <div class="pos-payment-page">
    <div class="payment-header">
      <button class="back-btn" @click="goBack">← 뒤로</button>
      <h2 class="payment-title">{{ tableNum }}번 테이블 결제 (POS)</h2>
    </div>

    <PaymentWidget
        :amount="totalAmount"
        :order-name="orderName"
        :success-path="`/payment/success?from=pos`"
        fail-path="/payment/fail"
        :metadata="paymentMetadata"
        @ready="onWidgetReady"
        @error="onWidgetError"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tableNum = ref(0)
const totalAmount = ref(0)
const tableId = ref(null)

onMounted(() => {
  // OwnerPanel에서 쿼리로 넘겨받은 정보
  tableNum.value = Number(route.query.tableNum) || 0
  totalAmount.value = Number(route.query.amount) || 0
  tableId.value = route.query.tableId || null

  if (totalAmount.value <= 0) {
    alert('결제 금액이 올바르지 않습니다.')
    router.back()
  }
})

const orderName = computed(() =>
    `포차온 ${tableNum.value}번 테이블 주문 (POS)`
)

const paymentMetadata = computed(() => ({
  tableId: tableId.value,
  tableNum: tableNum.value,
  payerType: 'POS', // 직원이 POS에서 결제
}))

const goBack = () => router.back()
const onWidgetReady = () => console.log('POS 결제 위젯 준비 완료')
const onWidgetError = (err) => console.error('POS 결제 위젯 에러:', err)
</script>

<style scoped>
.pos-payment-page {
  min-height: 100vh;
  background: #0f0f1a;
  padding: 20px;
  color: #fff;
}

.payment-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  padding: 8px;
}

.payment-title {
  font-size: 20px;
  font-weight: 800;
}
</style>