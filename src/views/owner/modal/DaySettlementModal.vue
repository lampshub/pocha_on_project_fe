<!-- 일별 정산 모달 — 하위 컴포넌트와 컴포저블을 조합하는 최상위 오케스트레이터 -->
<template>
  <transition name="modal-fade">
    <div v-if="visible" class="ds-overlay" @click.self="$emit('close')">
      <div class="ds-modal">

        <!-- Sticky Header -->
        <div class="ds-header">
          <div class="ds-header-inner">
            <div class="ds-header-left">
              <button class="ds-back-btn" @click="$emit('close')">←</button>
              <div>
                <div class="ds-header-date">
                  {{ month }}월 {{ day }}일
                  <span class="ds-header-dow">{{ dayOfWeekLabel }}</span>
                </div>
                <div class="ds-header-sub">포차온 · 영업 정산</div>
              </div>
            </div>
            <div class="ds-status-badge">
              <div class="ds-status-dot"></div>
              <span>마감 전</span>
            </div>
          </div>
        </div>

        <!-- Scrollable Body -->
        <div class="ds-body">

          <!-- 로딩 -->
          <div v-if="isLoading" class="ds-loading">데이터를 불러오는 중...</div>

          <template v-else>
            <DaySummarySection :stats="stats" :summaryCards="summaryCards" :fmt="fmt"/>
            <DayRevenueSection :donutSegments="donutSegments" :methodList="methodList" :fmt="fmt"/>
            <DayOperationSection :hourlyData="hourlyData"/>
            <DayMenuSection :stats="stats" :fmt="fmt"/>
            <DayOrderSection
              :methodFilters="methodFilters"
              :statusFilters="statusFilters"
              :orderFilter="orderFilter"
              :statusFilter="statusFilter"
              :filteredOrders="filteredOrders"
              :displayOrders="displayOrders"
              :showAllOrders="showAllOrders"
              :expandedOrder="expandedOrder"
              :fmt="fmt"
              :methodLabel="methodLabel"
              @update:orderFilter="orderFilter = $event"
              @update:statusFilter="statusFilter = $event"
              @update:expandedOrder="expandedOrder = $event"
              @update:showAllOrders="showAllOrders = $event"
            />
          </template>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { useDaySettlement } from '@/composables/owner/useDaySettlement'
import DaySummarySection from '@/components/owner/settlement/DaySummarySection.vue'
import DayRevenueSection from '@/components/owner/settlement/DayRevenueSection.vue'
import DayOperationSection from '@/components/owner/settlement/DayOperationSection.vue'
import DayMenuSection from '@/components/owner/settlement/DayMenuSection.vue'
import DayOrderSection from '@/components/owner/settlement/DayOrderSection.vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  day: { type: Number, required: true },
})
defineEmits(['close'])

const {
  orderFilter, statusFilter, expandedOrder, showAllOrders, isLoading,
  dayOfWeekLabel, stats, summaryCards, donutSegments, methodList, hourlyData,
  filteredOrders, displayOrders, methodFilters, statusFilters,
  fmt, methodLabel,
} = useDaySettlement(props)
</script>

<style scoped>
@import "@/assets/css/DaySettlementModal.css";
</style>
