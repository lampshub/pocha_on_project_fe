<!--
  TableManagementModal.vue
  테이블 관리 모달 - 테이블 목록 표시, 단일/범위 추가, 삭제
-->
<template>
  <!-- 테이블 관리 모달 오버레이 -->
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <div class="modal-title">테이블 관리</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <!-- 테이블 목록 그리드 -->
        <div class="table-list" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:8px;">
          <div v-for="table in tables" :key="table.id" class="table-item" style="padding: 6px 8px; min-height:unset;">
            <button
              class="delete-table-btn"
              style="width:12px; height:12px; font-size:10px; line-height:1;"
              @click="$emit('delete-table', table.id, table.number)"
            >×</button>
            <div class="table-item-number">{{ table.number }}번</div>
          </div>
        </div>

        <!-- 테이블 추가 영역 -->
        <div class="add-table-section">
          <div class="form-label">테이블 추가</div>
          <!-- 단일/범위 모드 전환 버튼 -->
          <div style="display:flex; gap:8px; margin-bottom:8px;">
            <button
              class="btn"
              :class="tableAddMode === 'single' ? 'btn-primary' : 'btn-secondary'"
              style="flex:1; padding-top:4px; padding-bottom:4px;"
              @click="$emit('update:tableAddMode', 'single')"
            >단일</button>
            <button
              class="btn"
              :class="tableAddMode === 'range' ? 'btn-primary' : 'btn-secondary'"
              style="flex:1; padding-top:4px; padding-bottom:4px;"
              @click="$emit('update:tableAddMode', 'range')"
            >범위</button>
          </div>

          <!-- 단일 추가 입력 -->
          <div v-if="tableAddMode === 'single'" style="display:flex; gap:8px; align-items:center; min-height:48px;">
            <input
              type="number"
              :value="newTableNumber"
              @input="$emit('update:newTableNumber', $event.target.valueAsNumber)"
              class="form-input"
              placeholder="테이블 번호"
              style="flex:1;"
              min="1"
            />
            <button
              style="padding: 12px 12px; background:#ea580c; color:white; border:none; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; flex-shrink:0;"
              @click="$emit('add-table')"
            >추가</button>
          </div>

          <!-- 범위 추가 입력 -->
          <div v-else style="display:flex; gap:8px; align-items:center; min-height:48px;">
            <input
              type="number"
              :value="tableRangeStart"
              @input="$emit('update:tableRangeStart', $event.target.valueAsNumber)"
              class="form-input"
              placeholder="시작"
              style="flex:1;"
              min="1"
            />
            <span>~</span>
            <input
              type="number"
              :value="tableRangeEnd"
              @input="$emit('update:tableRangeEnd', $event.target.valueAsNumber)"
              class="form-input"
              placeholder="끝"
              style="flex:1;"
              min="1"
            />
            <button class="btn btn-primary" @click="$emit('add-table-range')">추가</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Props:
 * - show: 모달 표시 여부
 * - tables: 테이블 목록 배열
 * - newTableNumber: 단일 추가 시 테이블 번호
 * - tableAddMode: 추가 모드 ('single' | 'range')
 * - tableRangeStart: 범위 추가 시작 번호
 * - tableRangeEnd: 범위 추가 끝 번호
 */
defineProps({
  show: { type: Boolean, required: true },
  tables: { type: Array, required: true },
  newTableNumber: { type: [Number, null], default: null },
  tableAddMode: { type: String, default: 'single' },
  tableRangeStart: { type: [Number, null], default: null },
  tableRangeEnd: { type: [Number, null], default: null },
})

/**
 * Emits:
 * - close: 모달 닫기
 * - add-table: 단일 테이블 추가
 * - add-table-range: 범위 테이블 추가
 * - delete-table: 테이블 삭제 (tableId, tableNumber)
 * - update:newTableNumber: 테이블 번호 양방향 바인딩
 * - update:tableAddMode: 추가 모드 양방향 바인딩
 * - update:tableRangeStart: 범위 시작 번호 양방향 바인딩
 * - update:tableRangeEnd: 범위 끝 번호 양방향 바인딩
 */
defineEmits([
  'close',
  'add-table',
  'add-table-range',
  'delete-table',
  'update:newTableNumber',
  'update:tableAddMode',
  'update:tableRangeStart',
  'update:tableRangeEnd',
])
</script>
