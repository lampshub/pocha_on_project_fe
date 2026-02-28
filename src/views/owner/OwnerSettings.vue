<!--
  OwnerSettings.vue
  설정 관리 페이지 - 오케스트레이터
  각 기능별 composable과 모달 컴포넌트를 조합하여 구성
-->
<template>
  <div class="settings-page">
    <!-- 상단 헤더 -->
    <header class="header">
      <div class="store-name">{{ storeName }}</div>
      <router-link to="/owner/panel" class="back-btn">← 메인으로</router-link>
    </header>

    <!-- 설정 카드 그리드 -->
    <div class="settings-view">
      <div class="settings-header">
        <div class="settings-title">설정 관리</div>
        <div class="settings-subtitle">매장 운영 설정</div>
      </div>
      <div class="settings-grid">
        <div class="settings-card" @click="activeModal = 'table'">
          <div class="settings-icon">🪑</div>
          <div class="settings-card-title">테이블 관리</div>
          <div class="settings-card-desc">테이블 추가 및 삭제</div>
        </div>
        <div class="settings-card" @click="activeModal = 'menuRegister'">
          <div class="settings-icon">🍽️</div>
          <div class="settings-card-title">메뉴 등록</div>
          <div class="settings-card-desc">새로운 메뉴 추가</div>
        </div>
        <div class="settings-card" @click="activeModal = 'menuEdit'">
          <div class="settings-icon">📋</div>
          <div class="settings-card-title">메뉴 수정</div>
          <div class="settings-card-desc">기존 메뉴 편집 및 삭제</div>
        </div>
        <div class="settings-card" @click="handleOpenHours">
          <div class="settings-icon">🕐</div>
          <div class="settings-card-title">영업시간 관리</div>
          <div class="settings-card-desc">영업 시간 설정</div>
        </div>
        <div class="settings-card" @click="activeModal = 'mypage'">
          <div class="settings-icon">👤</div>
          <div class="settings-card-title">마이페이지</div>
          <div class="settings-card-desc">점주 정보 및 로그아웃</div>
        </div>
      </div>
    </div>

    <!-- ===== 테이블 관리 모달 ===== -->
    <TableManagementModal
      :show="activeModal === 'table'"
      :tables="tables"
      v-model:newTableNumber="newTableNumber"
      v-model:tableAddMode="tableAddMode"
      v-model:tableRangeStart="tableRangeStart"
      v-model:tableRangeEnd="tableRangeEnd"
      @close="activeModal = null"
      @add-table="addTable"
      @add-table-range="addTableRange"
      @delete-table="deleteTable"
    />

    <!-- ===== 메뉴 등록 모달 ===== -->
    <MenuRegisterModal
      :show="activeModal === 'menuRegister'"
      :newMenu="newMenu"
      :categories="categories"
      :showRegisterCategoryDropdown="showRegisterCategoryDropdown"
      :showNewCategoryInput="showNewCategoryInput"
      :editingCategoryId="editingCategoryId"
      :editingCategoryName="editingCategoryName"
      :newCategoryName="newCategoryName"
      @close="activeModal = null"
      @register="handleRegisterMenu"
      @image-upload="handleImageUpload"
      @update:showRegisterCategoryDropdown="showRegisterCategoryDropdown = $event"
      @update:showNewCategoryInput="showNewCategoryInput = $event"
      @update:editingCategoryName="editingCategoryName = $event"
      @update:newCategoryName="newCategoryName = $event"
      @start-edit-category="(id, name) => { editingCategoryId = id; editingCategoryName = name }"
      @update-category="updateCategory"
      @delete-category="(id) => deleteCategory(id, { newMenu, editMenu })"
      @cancel-edit-category="editingCategoryId = null"
      @add-category="(mode) => addNewCategory(mode, { newMenu, editMenu })"
      @clear-new-menu-category="newMenu.categoryId = null"
    />

    <!-- ===== 메뉴 수정 목록 모달 ===== -->
    <MenuEditListModal
      :show="activeModal === 'menuEdit'"
      :menuList="menuList"
      :formatPrice="formatPrice"
      @close="activeModal = null"
      @select-menu="handleSelectMenu"
    />

    <!-- ===== 메뉴 상세 수정 모달 ===== -->
    <MenuDetailEditModal
      :show="activeModal === 'menuDetail'"
      :editMenu="editMenu"
      :categories="categories"
      :showEditCategoryDropdown="showEditCategoryDropdown"
      :showEditCategoryInput="showEditCategoryInput"
      :editingCategoryId="editingCategoryId"
      :editingCategoryName="editingCategoryName"
      :newCategoryName="newCategoryName"
      :formatPrice="formatPrice"
      @close="activeModal = null"
      @save="saveMenuEdit(() => { activeModal = null })"
      @delete-menu="deleteMenu(() => { activeModal = null })"
      @edit-image-upload="handleEditImageUpload"
      @update:showEditCategoryDropdown="showEditCategoryDropdown = $event"
      @update:showEditCategoryInput="showEditCategoryInput = $event"
      @update:editingCategoryName="editingCategoryName = $event"
      @update:newCategoryName="newCategoryName = $event"
      @start-edit-category="(id, name) => { editingCategoryId = id; editingCategoryName = name }"
      @update-category="updateCategory"
      @delete-category="(id) => deleteCategory(id, { newMenu, editMenu })"
      @cancel-edit-category="editingCategoryId = null"
      @add-category="(mode) => addNewCategory(mode, { newMenu, editMenu })"
      @clear-edit-menu-category="editMenu.categoryId = null"
      @add-option="addOption"
      @update-option="updateOption"
      @delete-option="deleteOption"
      @add-option-detail="addOptionDetail"
      @update-option-detail="updateOptionDetail"
      @delete-option-detail="deleteOptionDetail"
    />

    <!-- ===== 영업시간 관리 모달 ===== -->
    <BusinessHoursModal
      :show="activeModal === 'hours'"
      v-model:hoursOpenAmPm="hoursOpenAmPm"
      v-model:hoursOpenHour="hoursOpenHour"
      v-model:hoursOpenMinute="hoursOpenMinute"
      v-model:hoursCloseAmPm="hoursCloseAmPm"
      v-model:hoursCloseHour="hoursCloseHour"
      v-model:hoursCloseMinute="hoursCloseMinute"
      :timeHours="timeHours"
      :timeMinutes="timeMinutes"
      @close="activeModal = null"
      @save="saveBusinessHours(() => { activeModal = null })"
    />

    <!-- ===== 마이페이지 모달 ===== -->
    <MyPageModal
      :show="activeModal === 'mypage'"
      :ownerInfo="ownerInfo"
      v-model:editingPassword="editingPassword"
      v-model:oldPassword="oldPassword"
      v-model:newPassword="newPassword"
      v-model:showOldPassword="showOldPassword"
      v-model:showNewPassword="showNewPassword"
      @close="activeModal = null"
      @save-password="savePassword"
      @cancel-password-edit="cancelPasswordEdit"
      @logout="logout"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// 컴포저블 (비즈니스 로직)
import { useTableManagement } from '@/composables/owner/useTableManagement'
import { useMenuManagement } from '@/composables/owner/useMenuManagement'
import { useCategoryManagement } from '@/composables/owner/useCategoryManagement'
import { useOptionManagement } from '@/composables/owner/useOptionManagement'
import { useBusinessHours } from '@/composables/owner/useBusinessHours'
import { useOwnerProfile } from '@/composables/owner/useOwnerProfile'

// 자식 모달 컴포넌트
import TableManagementModal from '@/components/owner/settings/TableManagementModal.vue'
import MenuRegisterModal from '@/components/owner/settings/MenuRegisterModal.vue'
import MenuEditListModal from '@/components/owner/settings/MenuEditListModal.vue'
import MenuDetailEditModal from '@/components/owner/settings/MenuDetailEditModal.vue'
import BusinessHoursModal from '@/components/owner/settings/BusinessHoursModal.vue'
import MyPageModal from '@/components/owner/settings/MyPageModal.vue'

const route = useRoute()

// 공통 상태
const storeName = ref(localStorage.getItem('currentStoreName') || '매장')
const activeModal = ref(null)

// 컴포저블 초기화
const {
  tables, newTableNumber, tableAddMode, tableRangeStart, tableRangeEnd,
  loadTables, addTable, addTableRange, deleteTable,
} = useTableManagement()

const {
  menuList, newMenu, editMenu, expandedOptions,
  loadMenus, handleImageUpload, handleEditImageUpload,
  registerMenu, openMenuDetail, saveMenuEdit, deleteMenu, formatPrice,
} = useMenuManagement()

const {
  categories, showNewCategoryInput, showRegisterCategoryDropdown,
  showEditCategoryDropdown, showEditCategoryInput,
  editingCategoryId, editingCategoryName, newCategoryName,
  loadCategories, addNewCategory, updateCategory, deleteCategory,
} = useCategoryManagement()

const {
  addOption, updateOption, deleteOption,
  addOptionDetail, updateOptionDetail, deleteOptionDetail,
} = useOptionManagement(editMenu, expandedOptions)

const {
  timeHours, timeMinutes,
  hoursOpenAmPm, hoursOpenHour, hoursOpenMinute,
  hoursCloseAmPm, hoursCloseHour, hoursCloseMinute,
  openHoursModal, saveBusinessHours,
} = useBusinessHours()

const {
  ownerInfo, editingPassword, oldPassword, newPassword,
  showOldPassword, showNewPassword,
  loadMyPage, savePassword, cancelPasswordEdit, logout,
} = useOwnerProfile()

// 메뉴 등록 핸들러 (성공 시 모달 닫기 + 카테고리 UI 초기화)
const handleRegisterMenu = () => {
  registerMenu({
    onSuccess: () => {
      showNewCategoryInput.value = false
      newCategoryName.value = ''
      activeModal.value = null
    },
  })
}

// 메뉴 선택 핸들러 (수정 모달로 전환)
const handleSelectMenu = (menu) => {
  showEditCategoryInput.value = false
  newCategoryName.value = ''
  openMenuDetail(menu, () => { activeModal.value = 'menuDetail' })
}

// 영업시간 모달 열기 핸들러
const handleOpenHours = () => {
  openHoursModal(() => { activeModal.value = 'hours' })
}

// 초기 데이터 로딩
onMounted(async () => {
  await Promise.all([loadTables(), loadMenus(), loadCategories(), loadMyPage()])
  // 쿼리 파라미터로 특정 모달 자동 열기
  if (route.query.modal === 'table') {
    activeModal.value = 'table'
  }
})
</script>

<style scoped>
@import "@/assets/css/OwnerSettings.css";

.btn-cat {
  padding: 0 14px !important;
  height: 42px;
  box-sizing: border-box;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 커스텀 시간 선택기 스타일 */
.custom-time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  padding: 12px 16px;
}

.ampm-toggle {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #3f3f46;
}

.ampm-btn {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  background: #27272a;
  color: #a1a1aa;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 1;
}

.ampm-btn:first-child {
  border-right: 1px solid #3f3f46;
}

.ampm-btn.active {
  background: #ea580c;
  color: #fff;
}

.ampm-btn:not(.active):hover {
  background: rgba(234, 88, 12, 0.15);
  color: #ea580c;
}

.time-select {
  padding: 10px 8px;
  background: #27272a;
  border: 1px solid #3f3f46;
  border-radius: 8px;
  color: #fafafa;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
  appearance: auto;
}

.time-select:hover,
.time-select:focus {
  border-color: #ea580c;
}
</style>
