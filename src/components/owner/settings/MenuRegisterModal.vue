<!--
  MenuRegisterModal.vue
  메뉴 등록 모달 - 이미지, 카테고리, 메뉴명, 가격, 원산지, 설명, 옵션 입력
-->
<!-- eslint-disable vue/no-mutating-props -->
<template>
  <!-- 메뉴 등록 모달 오버레이 -->
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content large">
      <!-- 모달 헤더 -->
      <div class="modal-header">
        <div class="modal-title">메뉴 등록</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <!-- 메뉴 이미지 업로드 -->
        <div class="form-group">
          <label class="form-label">메뉴 이미지</label>
          <input type="file" accept="image/*" @change="$emit('image-upload', $event)" class="form-input" />
          <img v-if="newMenu.imagePreview" :src="newMenu.imagePreview"
            style="width:100px; height:100px; object-fit:cover; margin-top:8px; border-radius:8px;" />
        </div>

        <!-- 카테고리 선택 드롭다운 -->
        <div class="form-group">
          <label class="form-label">카테고리 <span style="color:#ef4444; margin-left:2px;">*</span></label>
          <div style="position:relative;">
            <!-- 카테고리 선택 버튼 -->
            <div class="form-select"
              style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none;"
              @click="$emit('update:showRegisterCategoryDropdown', !showRegisterCategoryDropdown)">
              <span :style="newMenu.categoryId ? 'color:#fafafa' : 'color:#a1a1aa'">
                {{ newMenu.categoryId ? (categories.find(c => c.categoryId === newMenu.categoryId) || {}).categoryName : '선택하세요' }}
              </span>
              <span style="font-size:11px; color:#a1a1aa;">{{ showRegisterCategoryDropdown ? '&#9650;' : '&#9660;' }}</span>
            </div>

            <!-- 카테고리 드롭다운 목록 -->
            <div v-if="showRegisterCategoryDropdown"
              style="position:absolute; top:calc(100% + 4px); left:0; right:0; background:#27272a; border:1px solid #3f3f46; border-radius:8px; z-index:100; overflow:hidden;">
              <div v-for="cat in categories" :key="cat.categoryId" style="border-bottom:1px solid #3f3f46;">
                <!-- 일반 표시 모드 -->
                <div v-if="editingCategoryId !== cat.categoryId"
                  style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px;"
                  :style="{ background: newMenu.categoryId === cat.categoryId ? '#3f3f46' : '' }">
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
              <!-- 카테고리 비어있을 때 -->
              <div v-if="categories.length === 0" style="padding:12px; text-align:center; color:#a1a1aa; font-size:13px;">카테고리가 없습니다</div>
              <!-- 새 카테고리 추가 버튼 -->
              <div style="padding:10px 12px; cursor:pointer; color:#ea580c; font-size:14px; font-weight:700; border-top:1px solid #3f3f46;"
                @click="$emit('update:showRegisterCategoryDropdown', false); $emit('update:showNewCategoryInput', true)"
                @mouseover="$event.currentTarget.style.background='#3f3f46'"
                @mouseout="$event.currentTarget.style.background=''">+ 새 카테고리 추가</div>
            </div>
          </div>

          <!-- 새 카테고리 입력 필드 -->
          <div v-if="showNewCategoryInput" style="display:flex; gap:6px; margin-top:8px; align-items:center;">
            <input :value="newCategoryName" @input="$emit('update:newCategoryName', $event.target.value)"
              type="text" class="form-input" placeholder="카테고리 이름 입력"
              style="flex:1; height:42px; box-sizing:border-box;" />
            <button
              style="height:42px; padding:0 14px; background:#ea580c; color:white; border:none; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;"
              @click="$emit('add-category', 'register')">추가</button>
            <button
              style="height:42px; padding:0 14px; background:#27272a; color:#fafafa; border:1px solid #3f3f46; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;"
              @click="$emit('update:showNewCategoryInput', false); $emit('clear-new-menu-category')">취소</button>
          </div>
        </div>

        <!-- 메뉴 이름 입력 -->
        <div class="form-group">
          <label class="form-label">메뉴 이름 <span style="color:#ef4444; margin-left:2px;">*</span></label>
          <input type="text" v-model="newMenu.name" class="form-input" placeholder="메뉴 이름을 입력하세요" />
        </div>

        <!-- 가격 입력 -->
        <div class="form-group">
          <label class="form-label">가격 (원) <span style="color:#ef4444; margin-left:2px;">*</span></label>
          <input type="number" v-model.number="newMenu.price" class="form-input" placeholder="가격을 입력하세요" />
        </div>

        <!-- 원산지 입력 -->
        <div class="form-group">
          <label class="form-label">원산지</label>
          <input type="text" v-model="newMenu.origin" class="form-input" placeholder="예: 국내산 돼지고기" />
        </div>

        <!-- 설명 입력 -->
        <div class="form-group">
          <label class="form-label">설명</label>
          <textarea v-model="newMenu.description" class="form-textarea" placeholder="메뉴 설명을 입력하세요"></textarea>
        </div>

        <!-- 옵션 목록 -->
        <div class="form-group">
          <label class="form-label">옵션</label>
          <div v-for="(option, oIdx) in newMenu.options" :key="oIdx" class="option-group">
            <div class="option-header">
              <input type="text" v-model="option.optionName" class="form-input" placeholder="옵션 그룹명 (예: 맵기 선택)" />
              <button class="remove-option-btn" @click="newMenu.options.splice(oIdx, 1)">삭제</button>
            </div>
            <div class="option-items">
              <div v-for="(detail, dIdx) in option.details" :key="dIdx" class="option-item">
                <input type="text" v-model="detail.optionDetailName" class="form-input" placeholder="옵션 상세명"
                  style="height:44px; box-sizing:border-box;" />
                <input type="number" v-model.number="detail.optionDetailPrice" class="form-input" placeholder="추가금액"
                  style="height:44px; box-sizing:border-box;" />
                <button class="remove-option-btn"
                  style="display:flex; align-items:center; justify-content:center; line-height:1;"
                  @click="option.details.splice(dIdx, 1)">×</button>
              </div>
            </div>
            <button class="add-option-detail-btn"
              @click="option.details.push({ optionDetailName: '', optionDetailPrice: 0 })">+ 옵션 상세 추가</button>
          </div>
          <button class="add-option-btn"
            @click="newMenu.options.push({ optionName: '', details: [{ optionDetailName: '', optionDetailPrice: 0 }] })">+ 옵션 추가</button>
        </div>
      </div>

      <!-- 모달 푸터 -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('close')">취소</button>
        <button class="btn btn-primary" @click="$emit('register')">등록</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/* eslint-disable vue/no-mutating-props */
/**
 * Props:
 * - show: 모달 표시 여부
 * - newMenu: 새 메뉴 reactive 객체 (직접 v-model 바인딩)
 * - categories: 카테고리 목록
 * - showRegisterCategoryDropdown: 카테고리 드롭다운 열림 여부
 * - showNewCategoryInput: 새 카테고리 입력 표시 여부
 * - editingCategoryId: 수정 중인 카테고리 ID
 * - editingCategoryName: 수정 중인 카테고리 이름
 * - newCategoryName: 새 카테고리 이름
 */
const props = defineProps({
  show: { type: Boolean, required: true },
  newMenu: { type: Object, required: true },
  categories: { type: Array, required: true },
  showRegisterCategoryDropdown: { type: Boolean, default: false },
  showNewCategoryInput: { type: Boolean, default: false },
  editingCategoryId: { type: [Number, null], default: null },
  editingCategoryName: { type: String, default: '' },
  newCategoryName: { type: String, default: '' },
})

const emit = defineEmits([
  'close',
  'register',
  'image-upload',
  'update:showRegisterCategoryDropdown',
  'update:showNewCategoryInput',
  'update:editingCategoryName',
  'update:newCategoryName',
  'start-edit-category',
  'update-category',
  'delete-category',
  'cancel-edit-category',
  'add-category',
  'clear-new-menu-category',
])

/** 카테고리 선택 후 드롭다운 닫기 */
const selectCategory = (categoryId) => {
  props.newMenu.categoryId = categoryId
  emit('update:showRegisterCategoryDropdown', false)
}
</script>
