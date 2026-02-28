<!--
  MenuDetailEditModal.vue
  메뉴 상세 수정 모달 - 메뉴명, 가격, 카테고리, 원산지, 설명, 이미지, 옵션 수정/삭제
-->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <!-- 메뉴 상세 수정 모달 오버레이 -->
  <div v-if="show && editMenu" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content large">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <div class="modal-title">메뉴 수정</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <!-- 메뉴 이름 -->
        <div class="form-group">
          <label class="form-label">메뉴 이름 <span style="color:#ef4444; margin-left:2px;">*</span></label>
          <input type="text" v-model="editMenu.menuName" class="form-input" />
        </div>

        <!-- 가격 -->
        <div class="form-group">
          <label class="form-label">가격 (원) <span style="color:#ef4444; margin-left:2px;">*</span></label>
          <input type="number" v-model.number="editMenu.price" class="form-input" />
        </div>

        <!-- 카테고리 선택 드롭다운 -->
        <div class="form-group">
          <label class="form-label">카테고리 <span style="color:#ef4444; margin-left:2px;">*</span></label>
          <div style="position:relative;">
            <!-- 카테고리 선택 버튼 -->
            <div class="form-select"
              style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none;"
              @click="$emit('update:showEditCategoryDropdown', !showEditCategoryDropdown)">
              <span :style="editMenu.categoryId ? 'color:#fafafa' : 'color:#a1a1aa'">
                {{ editMenu.categoryId ? (categories.find(c => c.categoryId === editMenu.categoryId) || {}).categoryName : '선택하세요' }}
              </span>
              <span style="font-size:11px; color:#a1a1aa;">{{ showEditCategoryDropdown ? '&#9650;' : '&#9660;' }}</span>
            </div>

            <!-- 카테고리 드롭다운 목록 -->
            <div v-if="showEditCategoryDropdown"
              style="position:absolute; top:calc(100% + 4px); left:0; right:0; background:#27272a; border:1px solid #3f3f46; border-radius:8px; z-index:100; overflow:hidden;">
              <div v-for="cat in categories" :key="cat.categoryId" style="border-bottom:1px solid #3f3f46;">
                <!-- 일반 표시 모드 -->
                <div v-if="editingCategoryId !== cat.categoryId"
                  style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px;"
                  :style="{ background: editMenu.categoryId === cat.categoryId ? '#3f3f46' : '' }">
                  <span style="font-size:14px; color:#fafafa; flex:1; cursor:pointer;"
                    @click="selectCategory(cat.categoryId)">{{ cat.categoryName }}</span>
                  <button @click.stop="$emit('start-edit-category', cat.categoryId, cat.categoryName)"
                    style="padding:2px 8px; font-size:11px; background:transparent; color:#a1a1aa; border:1px solid #3f3f46; border-radius:4px; cursor:pointer; flex-shrink:0; margin-left:8px;">수정</button>
                </div>
                <!-- 카테고리 수정 모드 -->
                <div v-else style="display:flex; gap:4px; align-items:center; padding:8px 12px; background:#18181b;">
                  <input :value="editingCategoryName" @input="$emit('update:editingCategoryName', $event.target.value)"
                    type="text"
                    style="flex:1; height:34px; padding:0 8px; background:#27272a; border:1px solid #ea580c; border-radius:6px; color:#fafafa; font-size:13px;"
                    @keyup.enter="$emit('update-category', cat.categoryId)"
                    @keyup.esc="$emit('cancel-edit-category')" />
                  <button @click.stop="$emit('update-category', cat.categoryId)"
                    style="height:34px; padding:0 10px; background:#ea580c; color:white; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap;">저장</button>
                  <button @click.stop="$emit('delete-category', cat.categoryId)"
                    style="height:34px; padding:0 10px; background:transparent; color:#ef4444; border:1px solid #ef4444; border-radius:6px; font-size:12px; cursor:pointer; white-space:nowrap;">삭제</button>
                  <button @click.stop="$emit('cancel-edit-category')"
                    style="height:34px; padding:0 8px; background:transparent; color:#a1a1aa; border:1px solid #3f3f46; border-radius:6px; font-size:12px; cursor:pointer;">&#10005;</button>
                </div>
              </div>
              <!-- 카테고리가 없을 때 -->
              <div v-if="categories.length === 0" style="padding:12px; text-align:center; color:#a1a1aa; font-size:13px;">카테고리가 없습니다</div>
              <!-- 새 카테고리 추가 버튼 -->
              <div style="padding:10px 12px; cursor:pointer; color:#ea580c; font-size:14px; font-weight:700; border-top:1px solid #3f3f46;"
                @click="$emit('update:showEditCategoryDropdown', false); $emit('update:showEditCategoryInput', true)"
                @mouseover="$event.currentTarget.style.background='#3f3f46'"
                @mouseout="$event.currentTarget.style.background=''">+ 새 카테고리 추가</div>
            </div>
          </div>

          <!-- 새 카테고리 입력 필드 -->
          <div v-if="showEditCategoryInput" style="display:flex; gap:6px; margin-top:8px; align-items:center;">
            <input :value="newCategoryName" @input="$emit('update:newCategoryName', $event.target.value)"
              type="text" class="form-input" placeholder="카테고리 이름 입력"
              style="flex:1; height:42px; box-sizing:border-box;" />
            <button
              style="height:42px; padding:0 14px; background:#ea580c; color:white; border:none; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;"
              @click="$emit('add-category', 'edit')">추가</button>
            <button
              style="height:42px; padding:0 14px; background:#27272a; color:#fafafa; border:1px solid #3f3f46; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;"
              @click="$emit('update:showEditCategoryInput', false); $emit('clear-edit-menu-category')">취소</button>
          </div>
        </div>

        <!-- 원산지 -->
        <div class="form-group">
          <label class="form-label">원산지</label>
          <input type="text" v-model="editMenu.origin" class="form-input" />
        </div>

        <!-- 설명 -->
        <div class="form-group">
          <label class="form-label">설명</label>
          <textarea v-model="editMenu.explanation" class="form-textarea"></textarea>
        </div>

        <!-- 메뉴 이미지 -->
        <div class="form-group">
          <label class="form-label">메뉴 이미지</label>
          <img v-if="editMenu.imageUrl && !editMenu.imagePreview" :src="editMenu.imageUrl"
            style="width:100px; height:100px; object-fit:cover; margin-bottom:8px; border-radius:8px;" />
          <img v-if="editMenu.imagePreview" :src="editMenu.imagePreview"
            style="width:100px; height:100px; object-fit:cover; margin-bottom:8px; border-radius:8px;" />
          <input type="file" accept="image/*" @change="$emit('edit-image-upload', $event)" class="form-input" />
        </div>

        <!-- 옵션 목록 -->
        <div class="form-group">
          <label class="form-label">옵션</label>
          <div v-for="option in editMenu.options" :key="option.optionId" class="option-group">
            <!-- 옵션 그룹 헤더 -->
            <div class="option-header">
              <input type="text" v-model="option.optionName" class="form-input" placeholder="옵션 그룹명"
                style="height:44px; box-sizing:border-box;" />
              <button
                style="height:36px; width:36px; background:#52525b; color:white; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;"
                @click="$emit('update-option', option)">저장</button>
              <button class="remove-option-btn" style="height:36px; width:36px;"
                @click="$emit('delete-option', option.optionId)">삭제</button>
            </div>
            <!-- 옵션 상세 항목 -->
            <div class="option-items">
              <div v-for="detail in option.details" :key="detail.optionDetailId" class="option-item">
                <input type="text" v-model="detail.optionDetailName" class="form-input" placeholder="옵션 상세명"
                  style="height:44px; box-sizing:border-box;" />
                <input type="number" v-model.number="detail.optionDetailPrice" class="form-input" placeholder="추가금액"
                  style="height:44px; box-sizing:border-box;" />
                <button
                  style="height:36px; width:36px; background:#52525b; color:white; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;"
                  @click="$emit('update-option-detail', detail)">저장</button>
                <button class="remove-option-btn"
                  style="height:36px; width:36px; display:flex; align-items:center; justify-content:center; line-height:1;"
                  @click="$emit('delete-option-detail', detail.optionDetailId, option.optionId)">×</button>
              </div>
            </div>
            <button class="add-option-detail-btn" @click="$emit('add-option-detail', option)">+ 옵션 상세 추가</button>
          </div>
          <button class="add-option-btn" @click="$emit('add-option')">+ 옵션 추가</button>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button class="btn btn-danger" @click="$emit('delete-menu')">삭제</button>
        <button class="btn btn-secondary" @click="$emit('close')">취소</button>
        <button class="btn btn-primary" @click="$emit('save')">저장</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
/**
 * Props:
 * - show: 모달 표시 여부
 * - editMenu: 수정 중인 메뉴 데이터 (ref 값, 직접 v-model 바인딩)
 * - categories: 카테고리 목록
 * - showEditCategoryDropdown: 카테고리 드롭다운 열림 여부
 * - showEditCategoryInput: 새 카테고리 입력 필드 표시 여부
 * - editingCategoryId: 수정 중인 카테고리 ID
 * - editingCategoryName: 수정 중인 카테고리 이름
 * - newCategoryName: 새 카테고리 이름
 * - formatPrice: 가격 포맷팅 함수
 */
const props = defineProps({
  show: { type: Boolean, required: true },
  editMenu: { type: Object, default: null },
  categories: { type: Array, required: true },
  showEditCategoryDropdown: { type: Boolean, default: false },
  showEditCategoryInput: { type: Boolean, default: false },
  editingCategoryId: { type: [Number, null], default: null },
  editingCategoryName: { type: String, default: '' },
  newCategoryName: { type: String, default: '' },
  formatPrice: { type: Function, required: true },
})

const emit = defineEmits([
  'close',
  'save',
  'delete-menu',
  'edit-image-upload',
  'update:showEditCategoryDropdown',
  'update:showEditCategoryInput',
  'update:editingCategoryName',
  'update:newCategoryName',
  'start-edit-category',
  'update-category',
  'delete-category',
  'cancel-edit-category',
  'add-category',
  'clear-edit-menu-category',
  'add-option',
  'update-option',
  'delete-option',
  'add-option-detail',
  'update-option-detail',
  'delete-option-detail',
])

/** 카테고리 선택 후 드롭다운 닫기 */
const selectCategory = (categoryId) => {
  props.editMenu.categoryId = categoryId
  emit('update:showEditCategoryDropdown', false)
}
</script>
