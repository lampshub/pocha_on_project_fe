<!-- 주문 상세 섹션 — 결제수단/상태 필터와 펼침 가능한 주문 목록을 표시 -->
<template>
  <div class="ds-section">
    <SectionHeader num="05" icon="📋" title="주문 상세" sub="필터 · 클릭 시 상세 펼침"/>

    <div class="ds-filter-wrap">
      <button v-for="f in methodFilters" :key="f.v"
              class="ds-filter-btn" :class="{ active: orderFilter === f.v }"
              @click="$emit('update:orderFilter', f.v)">{{ f.l }}
      </button>
      <div class="ds-filter-divider"></div>
      <button v-for="f in statusFilters" :key="f.v"
              class="ds-filter-btn ds-filter-status" :class="{ active: statusFilter === f.v }"
              @click="$emit('update:statusFilter', f.v)">{{ f.l }}
      </button>
    </div>

    <div class="ds-order-count">
      {{ filteredOrders.length }}건
      <template v-if="!showAllOrders && filteredOrders.length > 5">(5건 표시 중)</template>
    </div>

    <div v-if="filteredOrders.length === 0" class="ds-empty">주문 내역이 없습니다</div>
    <div v-else class="ds-order-list">
      <div v-for="o in displayOrders" :key="o.id"
           class="ds-card ds-order-item" :class="{ expanded: expandedOrder === o.id }"
           @click="$emit('update:expandedOrder', expandedOrder === o.id ? null : o.id)">
        <div class="ds-order-head">
          <div class="ds-order-left">
            <span class="ds-order-table">{{ o.table }}</span>
            <div>
              <div class="ds-order-amount">{{ fmt(o.amount) }}원</div>
              <div class="ds-order-meta">{{ o.id }} · {{ o.time }}</div>
            </div>
          </div>
          <div class="ds-order-badges">
            <span class="ds-badge" :class="'method-' + o.method">{{ methodLabel(o.method) }}</span>
            <span class="ds-badge" :class="o.status === '취소' ? 'status-cancel' : 'status-ok'">{{
                o.status
              }}</span>
          </div>
        </div>
        <transition name="slide-down">
          <div v-if="expandedOrder === o.id" class="ds-order-detail" @click.stop>
            <div v-for="(item, idx) in o.items" :key="idx" class="ds-order-menu-row">
              <span class="ds-menu-name">{{ item.name }} × {{ item.qty }}</span>
              <span class="ds-menu-price">{{ fmt(item.price * item.qty) }}원</span>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <button v-if="filteredOrders.length > 5" class="ds-show-all-btn"
            @click="$emit('update:showAllOrders', !showAllOrders)">
      {{ showAllOrders ? '접기 ▲' : `전체 ${filteredOrders.length}건 보기 ▼` }}
    </button>
  </div>
</template>

<script setup>
import SectionHeader from './SectionHeader.vue'

defineProps({
  methodFilters: { type: Array, required: true },
  statusFilters: { type: Array, required: true },
  orderFilter: { type: String, required: true },
  statusFilter: { type: String, required: true },
  filteredOrders: { type: Array, required: true },
  displayOrders: { type: Array, required: true },
  showAllOrders: { type: Boolean, required: true },
  expandedOrder: { default: null },
  fmt: { type: Function, required: true },
  methodLabel: { type: Function, required: true },
})

defineEmits([
  'update:orderFilter',
  'update:statusFilter',
  'update:expandedOrder',
  'update:showAllOrders',
])
</script>
