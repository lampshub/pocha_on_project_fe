<template>
  <div class="customer-payment-page">
    <div class="payment-header">
      <button class="back-btn" @click="goBack">← 뒤로</button>
      <h2 class="payment-title">{{ tableNumber }}번 테이블 결제</h2>
    </div>

    <PaymentWidget
        v-if="totalAmount > 0"
        :amount="totalAmount"
        :order-name="orderName"
        :success-path="`/payment/success?from=customer`"
        fail-path="/payment/fail"
        :metadata="paymentMetadata"
        @ready="onWidgetReady"
        @error="onWidgetError"
    />
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useToast} from "vue-toastification";

const toast = useToast();
import PaymentWidget from '@/components/payment/PaymentWidget.vue'
import axios from "axios";

const router = useRouter()
const route = useRoute()

const selectedTableData = JSON.parse(localStorage.getItem('selectedTable') || '{}')
const tableNumber = ref(selectedTableData.tableNum || 0)
const totalAmount = ref(0)
const groupId = ref('')

onMounted(async () => {
  // 쿼리 파라미터에서 금액과 그룹ID를 가져옵니다.
  groupId.value = route.query.groupId || localStorage.getItem('currentGroupId') || '';
  if (!groupId.value) {
    toast.error('주문 정보가 없습니다');
    router.back();
    return;
  }
  try {
    const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/ordering/total`, {
      params: {groupId: groupId.value}
    })
    totalAmount.value = res.data;
  } catch (e) {
    console.error('주문 금액 조회 실패', e);
    toast.error('결제할 금액을 불러올 수 없습니다');
    router.back();
  }
})
  const orderName = computed(() =>
      `포차온 ${tableNumber.value}번 테이블 주문`
  )

  const paymentMetadata = computed(() => ({
    tableId: selectedTableData.customerTableId,
    tableNumber: tableNumber.value,
    groupId: groupId.value,
    payerType: 'CUSTOMER',
  }))

  const goBack = () => router.back()
  const onWidgetReady = () => console.log('결제 위젯 준비 완료')
  const onWidgetError = (err) => {
    console.error('결제 위젯 에러:', err)
    toast.error('결제 준비 중 오류가 발생했습니다: ' + err)
  }
</script>

<style scoped>
.customer-payment-page {
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