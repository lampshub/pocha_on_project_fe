<template>
  <div class="settings-page">
    <header class="header">
      <div class="store-name">{{ storeName }}</div>
      <router-link to="/owner/panel" class="back-btn">← 메인으로</router-link>
    </header>

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
          <div class="settings-icon">📝</div>
          <div class="settings-card-title">메뉴 등록</div>
          <div class="settings-card-desc">새로운 메뉴 추가</div>
        </div>
        <div class="settings-card" @click="activeModal = 'menuEdit'">
          <div class="settings-icon">✏️</div>
          <div class="settings-card-title">메뉴 수정</div>
          <div class="settings-card-desc">기존 메뉴 편집 및 삭제</div>
        </div>
        <div class="settings-card" @click="openHoursModal">
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
    <div v-if="activeModal === 'table'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">테이블 관리</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="table-list" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:8px;">
            <div v-for="table in tables" :key="table.id" class="table-item" style="padding: 6px 8px; min-height:unset;">
              <button class="delete-table-btn" style="width:12px; height:12px; font-size:10px; line-height:1;" @click="deleteTable(table.id, table.number)">×</button>
              <div class="table-item-number">{{ table.number }}번</div>
            </div>
          </div>
          <div class="add-table-section">
            <div class="form-label">테이블 추가</div>
            <div style="display:flex; gap:8px; margin-bottom:8px;">
              <button class="btn" :class="tableAddMode === 'single' ? 'btn-primary' : 'btn-secondary'" style="flex:1; padding-top:4px; padding-bottom:4px;" @click="tableAddMode = 'single'">단일</button>
              <button class="btn" :class="tableAddMode === 'range' ? 'btn-primary' : 'btn-secondary'" style="flex:1; padding-top:4px; padding-bottom:4px;" @click="tableAddMode = 'range'">범위</button>
            </div>
            <div v-if="tableAddMode === 'single'" style="display:flex; gap:8px; align-items:center; min-height:48px;">
              <input type="number" v-model.number="newTableNumber" class="form-input" placeholder="테이블 번호" style="flex:1;" min="1" />
              <button style="padding: 12px 12px; background:#ea580c; color:white; border:none; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; flex-shrink:0;" @click="addTable">추가</button>
            </div>
            <div v-else style="display:flex; gap:8px; align-items:center; min-height:48px;">
              <input type="number" v-model.number="tableRangeStart" class="form-input" placeholder="시작" style="flex:1;" min="1" />
              <span>~</span>
              <input type="number" v-model.number="tableRangeEnd" class="form-input" placeholder="끝" style="flex:1;" min="1" />
              <button class="btn btn-primary" @click="addTableRange">추가</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 메뉴 등록 모달 ===== -->
    <div v-if="activeModal === 'menuRegister'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content large">
        <div class="modal-header">
          <div class="modal-title">메뉴 등록</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">메뉴 이미지</label>
            <input type="file" accept="image/*" @change="handleImageUpload" class="form-input" />
            <img v-if="newMenu.imagePreview" :src="newMenu.imagePreview" style="width:100px; height:100px; object-fit:cover; margin-top:8px; border-radius:8px;" />
          </div>
          <div class="form-group">
            <label class="form-label">카테고리 <span style="color:#ef4444; margin-left:2px;">*</span></label>
            <div style="position:relative;">
              <div class="form-select" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none;" @click="showRegisterCategoryDropdown = !showRegisterCategoryDropdown">
                <span :style="newMenu.categoryId ? 'color:#fafafa' : 'color:#a1a1aa'">
                  {{ newMenu.categoryId ? (categories.find(c => c.categoryId === newMenu.categoryId) || {}).categoryName : '선택하세요' }}
                </span>
                <span style="font-size:11px; color:#a1a1aa;">{{ showRegisterCategoryDropdown ? '▲' : '▼' }}</span>
              </div>
              <div v-if="showRegisterCategoryDropdown" style="position:absolute; top:calc(100% + 4px); left:0; right:0; background:#27272a; border:1px solid #3f3f46; border-radius:8px; z-index:100; overflow:hidden;">
                <div v-for="cat in categories" :key="cat.categoryId" style="border-bottom:1px solid #3f3f46;">
                  <div v-if="editingCategoryId !== cat.categoryId"
                    style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px;"
                    :style="{ background: newMenu.categoryId === cat.categoryId ? '#3f3f46' : '' }">
                    <span style="font-size:14px; color:#fafafa; flex:1; cursor:pointer;"
                      @click="newMenu.categoryId = cat.categoryId; showRegisterCategoryDropdown = false">{{ cat.categoryName }}</span>
                    <button @click.stop="editingCategoryId = cat.categoryId; editingCategoryName = cat.categoryName"
                      style="padding:2px 8px; font-size:11px; background:transparent; color:#a1a1aa; border:1px solid #3f3f46; border-radius:4px; cursor:pointer; flex-shrink:0; margin-left:8px;">수정</button>
                  </div>
                  <div v-else style="display:flex; gap:4px; align-items:center; padding:8px 12px; background:#18181b;">
                    <input v-model="editingCategoryName" type="text"
                      style="flex:1; height:34px; padding:0 8px; background:#27272a; border:1px solid #ea580c; border-radius:6px; color:#fafafa; font-size:13px;"
                      @keyup.enter="updateCategory(cat.categoryId)"
                      @keyup.esc="editingCategoryId = null" />
                    <button @click.stop="updateCategory(cat.categoryId)"
                      style="height:34px; padding:0 10px; background:#ea580c; color:white; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap;">저장</button>
                    <button @click.stop="deleteCategory(cat.categoryId)"
                      style="height:34px; padding:0 10px; background:transparent; color:#ef4444; border:1px solid #ef4444; border-radius:6px; font-size:12px; cursor:pointer; white-space:nowrap;">삭제</button>
                    <button @click.stop="editingCategoryId = null"
                      style="height:34px; padding:0 8px; background:transparent; color:#a1a1aa; border:1px solid #3f3f46; border-radius:6px; font-size:12px; cursor:pointer;">✕</button>
                  </div>
                </div>
                <div v-if="categories.length === 0" style="padding:12px; text-align:center; color:#a1a1aa; font-size:13px;">카테고리가 없습니다</div>
                <div style="padding:10px 12px; cursor:pointer; color:#ea580c; font-size:14px; font-weight:700; border-top:1px solid #3f3f46;"
                  @click="showRegisterCategoryDropdown = false; showNewCategoryInput = true"
                  @mouseover="$event.currentTarget.style.background='#3f3f46'"
                  @mouseout="$event.currentTarget.style.background=''">+ 새 카테고리 추가</div>
              </div>
            </div>
            <div v-if="showNewCategoryInput" style="display:flex; gap:6px; margin-top:8px; align-items:center;">
              <input v-model="newCategoryName" type="text" class="form-input" placeholder="카테고리 이름 입력" style="flex:1; height:42px; box-sizing:border-box;" />
              <button style="height:42px; padding:0 14px; background:#ea580c; color:white; border:none; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;" @click="addNewCategory('register')">추가</button>
              <button style="height:42px; padding:0 14px; background:#27272a; color:#fafafa; border:1px solid #3f3f46; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;" @click="showNewCategoryInput = false; newMenu.categoryId = null">취소</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">메뉴 이름 <span style="color:#ef4444; margin-left:2px;">*</span></label>
            <input type="text" v-model="newMenu.name" class="form-input" placeholder="메뉴 이름을 입력하세요" />
          </div>
          <div class="form-group">
            <label class="form-label">가격 (원) <span style="color:#ef4444; margin-left:2px;">*</span></label>
            <input type="number" v-model.number="newMenu.price" class="form-input" placeholder="가격을 입력하세요" />
          </div>
          <div class="form-group">
            <label class="form-label">원산지</label>
            <input type="text" v-model="newMenu.origin" class="form-input" placeholder="예: 국내산 돼지고기" />
          </div>
          <div class="form-group">
            <label class="form-label">설명</label>
            <textarea v-model="newMenu.description" class="form-textarea" placeholder="메뉴 설명을 입력하세요"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">옵션</label>
            <div v-for="(option, oIdx) in newMenu.options" :key="oIdx" class="option-group">
              <div class="option-header">
                <input type="text" v-model="option.optionName" class="form-input" placeholder="옵션 그룹명 (예: 맵기 선택)" />
                <button class="remove-option-btn" @click="newMenu.options.splice(oIdx, 1)">삭제</button>
              </div>
              <div class="option-items">
                <div v-for="(detail, dIdx) in option.details" :key="dIdx" class="option-item">
                  <input type="text" v-model="detail.optionDetailName" class="form-input" placeholder="옵션 상세명" style="height:44px; box-sizing:border-box;" />
                  <input type="number" v-model.number="detail.optionDetailPrice" class="form-input" placeholder="추가금액" style="height:44px; box-sizing:border-box;" />
                  <button class="remove-option-btn" style="display:flex; align-items:center; justify-content:center; line-height:1;" @click="option.details.splice(dIdx, 1)">×</button>
                </div>
              </div>
              <button class="add-option-detail-btn" @click="option.details.push({ optionDetailName: '', optionDetailPrice: 0 })">+ 옵션 상세 추가</button>
            </div>
            <button class="add-option-btn" @click="newMenu.options.push({ optionName: '', details: [{ optionDetailName: '', optionDetailPrice: 0 }] })">+ 옵션 추가</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="activeModal = null">취소</button>
          <button class="btn btn-primary" @click="registerMenu">등록</button>
        </div>
      </div>
    </div>

    <!-- ===== 메뉴 수정 목록 모달 ===== -->
    <div v-if="activeModal === 'menuEdit'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content large">
        <div class="modal-header">
          <div class="modal-title">메뉴 선택</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="menu-list">
            <div v-if="menuList.length === 0" style="text-align:center; color:#a1a1aa; padding:40px 0;">
              등록된 메뉴가 없습니다.
            </div>
            <div v-for="menu in menuList" :key="menu.menuId" class="menu-item" @click="openMenuDetail(menu)">
              <img :src="menu.imageUrl || 'https://via.placeholder.com/100'" class="menu-image" />
              <div class="menu-info">
                <div class="menu-name">{{ menu.menuName }}</div>
                <div class="menu-price">{{ formatPrice(menu.menuPrice) }}원</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 메뉴 상세 수정 모달 ===== -->
    <div v-if="activeModal === 'menuDetail' && editMenu" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content large">
        <div class="modal-header">
          <div class="modal-title">메뉴 수정</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">메뉴 이름 <span style="color:#ef4444; margin-left:2px;">*</span></label>
            <input type="text" v-model="editMenu.menuName" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">가격 (원) <span style="color:#ef4444; margin-left:2px;">*</span></label>
            <input type="number" v-model.number="editMenu.price" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">카테고리 <span style="color:#ef4444; margin-left:2px;">*</span></label>
            <div style="position:relative;">
              <div class="form-select" style="cursor:pointer; display:flex; justify-content:space-between; align-items:center; user-select:none;" @click="showEditCategoryDropdown = !showEditCategoryDropdown">
                <span :style="editMenu.categoryId ? 'color:#fafafa' : 'color:#a1a1aa'">
                  {{ editMenu.categoryId ? (categories.find(c => c.categoryId === editMenu.categoryId) || {}).categoryName : '선택하세요' }}
                </span>
                <span style="font-size:11px; color:#a1a1aa;">{{ showEditCategoryDropdown ? '▲' : '▼' }}</span>
              </div>
              <div v-if="showEditCategoryDropdown" style="position:absolute; top:calc(100% + 4px); left:0; right:0; background:#27272a; border:1px solid #3f3f46; border-radius:8px; z-index:100; overflow:hidden;">
                <div v-for="cat in categories" :key="cat.categoryId" style="border-bottom:1px solid #3f3f46;">
                  <div v-if="editingCategoryId !== cat.categoryId"
                    style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px;"
                    :style="{ background: editMenu.categoryId === cat.categoryId ? '#3f3f46' : '' }">
                    <span style="font-size:14px; color:#fafafa; flex:1; cursor:pointer;"
                      @click="editMenu.categoryId = cat.categoryId; showEditCategoryDropdown = false">{{ cat.categoryName }}</span>
                    <button @click.stop="editingCategoryId = cat.categoryId; editingCategoryName = cat.categoryName"
                      style="padding:2px 8px; font-size:11px; background:transparent; color:#a1a1aa; border:1px solid #3f3f46; border-radius:4px; cursor:pointer; flex-shrink:0; margin-left:8px;">수정</button>
                  </div>
                  <div v-else style="display:flex; gap:4px; align-items:center; padding:8px 12px; background:#18181b;">
                    <input v-model="editingCategoryName" type="text"
                      style="flex:1; height:34px; padding:0 8px; background:#27272a; border:1px solid #ea580c; border-radius:6px; color:#fafafa; font-size:13px;"
                      @keyup.enter="updateCategory(cat.categoryId)"
                      @keyup.esc="editingCategoryId = null" />
                    <button @click.stop="updateCategory(cat.categoryId)"
                      style="height:34px; padding:0 10px; background:#ea580c; color:white; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap;">저장</button>
                    <button @click.stop="deleteCategory(cat.categoryId)"
                      style="height:34px; padding:0 10px; background:transparent; color:#ef4444; border:1px solid #ef4444; border-radius:6px; font-size:12px; cursor:pointer; white-space:nowrap;">삭제</button>
                    <button @click.stop="editingCategoryId = null"
                      style="height:34px; padding:0 8px; background:transparent; color:#a1a1aa; border:1px solid #3f3f46; border-radius:6px; font-size:12px; cursor:pointer;">✕</button>
                  </div>
                </div>
                <div v-if="categories.length === 0" style="padding:12px; text-align:center; color:#a1a1aa; font-size:13px;">카테고리가 없습니다</div>
                <div style="padding:10px 12px; cursor:pointer; color:#ea580c; font-size:14px; font-weight:700; border-top:1px solid #3f3f46;"
                  @click="showEditCategoryDropdown = false; showEditCategoryInput = true"
                  @mouseover="$event.currentTarget.style.background='#3f3f46'"
                  @mouseout="$event.currentTarget.style.background=''">+ 새 카테고리 추가</div>
              </div>
            </div>
            <div v-if="showEditCategoryInput" style="display:flex; gap:6px; margin-top:8px; align-items:center;">
              <input v-model="newCategoryName" type="text" class="form-input" placeholder="카테고리 이름 입력" style="flex:1; height:42px; box-sizing:border-box;" />
              <button style="height:42px; padding:0 14px; background:#ea580c; color:white; border:none; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;" @click="addNewCategory('edit')">추가</button>
              <button style="height:42px; padding:0 14px; background:#27272a; color:#fafafa; border:1px solid #3f3f46; border-radius:10px; font-weight:700; font-size:14px; cursor:pointer; white-space:nowrap; flex-shrink:0;" @click="showEditCategoryInput = false; editMenu.categoryId = null">취소</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">원산지</label>
            <input type="text" v-model="editMenu.origin" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">설명</label>
            <textarea v-model="editMenu.explanation" class="form-textarea"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">메뉴 이미지</label>
            <img v-if="editMenu.imageUrl && !editMenu.imagePreview" :src="editMenu.imageUrl"
              style="width:100px; height:100px; object-fit:cover; margin-bottom:8px; border-radius:8px;" />
            <img v-if="editMenu.imagePreview" :src="editMenu.imagePreview"
              style="width:100px; height:100px; object-fit:cover; margin-bottom:8px; border-radius:8px;" />
            <input type="file" accept="image/*" @change="handleEditImageUpload" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">옵션</label>
            <div v-for="option in editMenu.options" :key="option.optionId" class="option-group">
              <div class="option-header">
                <input type="text" v-model="option.optionName" class="form-input" placeholder="옵션 그룹명" style="height:44px; box-sizing:border-box;" />
                <button style="height:36px; width:36px; background:#52525b; color:white; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;" @click="updateOption(option)">저장</button>
                <button class="remove-option-btn" style="height:36px; width:36px;" @click="deleteOption(option.optionId)">삭제</button>
              </div>
              <div class="option-items">
                <div v-for="detail in option.details" :key="detail.optionDetailId" class="option-item">
                  <input type="text" v-model="detail.optionDetailName" class="form-input" placeholder="옵션 상세명" style="height:44px; box-sizing:border-box;" />
                  <input type="number" v-model.number="detail.optionDetailPrice" class="form-input" placeholder="추가금액" style="height:44px; box-sizing:border-box;" />
                  <button style="height:36px; width:36px; background:#52525b; color:white; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;" @click="updateOptionDetail(detail)">저장</button>
                  <button class="remove-option-btn" style="height:36px; width:36px; display:flex; align-items:center; justify-content:center; line-height:1;" @click="deleteOptionDetail(detail.optionDetailId, option.optionId)">×</button>
                </div>
              </div>
              <button class="add-option-detail-btn" @click="addOptionDetail(option)">+ 옵션 상세 추가</button>
            </div>
            <button class="add-option-btn" @click="addOption">+ 옵션 추가</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-danger" @click="deleteMenu">삭제</button>
          <button class="btn btn-secondary" @click="activeModal = null">취소</button>
          <button class="btn btn-primary" @click="saveMenuEdit">저장</button>
        </div>
      </div>
    </div>

    <!-- ===== 영업시간 관리 모달 ===== -->
    <div v-if="activeModal === 'hours'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">영업시간 관리</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <!-- 영업 시작 시간 -->
          <div class="form-group">
            <label class="form-label">영업 시작 시간</label>
            <div class="custom-time-picker">
              <div class="ampm-toggle">
                <button type="button" :class="['ampm-btn', { active: hoursOpenAmPm === 'AM' }]" @click="hoursOpenAmPm = 'AM'">오전</button>
                <button type="button" :class="['ampm-btn', { active: hoursOpenAmPm === 'PM' }]" @click="hoursOpenAmPm = 'PM'">오후</button>
              </div>
              <select class="time-select" v-model="hoursOpenHour">
                <option v-for="h in timeHours" :key="h" :value="h">{{ h }}시</option>
              </select>
              <select class="time-select" v-model="hoursOpenMinute">
                <option v-for="m in timeMinutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}분</option>
              </select>
            </div>
          </div>
          <!-- 영업 종료 시간 -->
          <div class="form-group">
            <label class="form-label">영업 종료 시간</label>
            <div class="custom-time-picker">
              <div class="ampm-toggle">
                <button type="button" :class="['ampm-btn', { active: hoursCloseAmPm === 'AM' }]" @click="hoursCloseAmPm = 'AM'">오전</button>
                <button type="button" :class="['ampm-btn', { active: hoursCloseAmPm === 'PM' }]" @click="hoursCloseAmPm = 'PM'">오후</button>
              </div>
              <select class="time-select" v-model="hoursCloseHour">
                <option v-for="h in timeHours" :key="h" :value="h">{{ h }}시</option>
              </select>
              <select class="time-select" v-model="hoursCloseMinute">
                <option v-for="m in timeMinutes" :key="m" :value="m">{{ String(m).padStart(2,'0') }}분</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="activeModal = null">취소</button>
          <button class="btn btn-primary" @click="saveBusinessHours">저장</button>
        </div>
      </div>
    </div>

    <!-- ===== 마이페이지 모달 ===== -->
    <div v-if="activeModal === 'mypage'" class="modal-overlay" @click.self="activeModal = null">
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">마이페이지</div>
          <button class="close-btn" @click="activeModal = null">×</button>
        </div>
        <div class="modal-body">
          <div class="profile-section">
            <div class="profile-item">
              <div class="profile-label">점주명</div>
              <div class="profile-value">{{ ownerInfo.name }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">이메일</div>
              <div class="profile-value">{{ ownerInfo.email }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">전화번호</div>
              <div class="profile-value">{{ ownerInfo.phone }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">사업자등록번호</div>
              <div class="profile-value">{{ ownerInfo.businessNumber }}</div>
            </div>
            <div class="profile-item">
              <div class="profile-label">비밀번호</div>
              <div class="profile-value">
                <span>••••••••</span>
                <button class="edit-profile-btn" @click="editingPassword = !editingPassword">수정</button>
              </div>
              <div v-if="editingPassword" class="edit-form">
                <div class="edit-form-group">
                  <label>기존 비밀번호</label>
                  <div style="position:relative;">
                    <input v-model="oldPassword" :type="showOldPassword ? 'text' : 'password'" placeholder="기존 비밀번호 입력" style="width:100%; padding-right:48px;" />
                    <button type="button" @click="showOldPassword = !showOldPassword"
                      style="position:absolute; right:6px; top:50%; transform:translateY(-50%); padding:2px 6px; font-size:11px; background:#3f3f46; color:#a1a1aa; border:none; border-radius:4px; cursor:pointer;">
                      {{ showOldPassword ? '숨김' : '보기' }}
                    </button>
                  </div>
                </div>
                <div class="edit-form-group">
                  <label>새 비밀번호</label>
                  <div style="position:relative;">
                    <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" placeholder="새 비밀번호 (8자 이상)" style="width:100%; padding-right:48px;" />
                    <button type="button" @click="showNewPassword = !showNewPassword"
                      style="position:absolute; right:6px; top:50%; transform:translateY(-50%); padding:2px 6px; font-size:11px; background:#3f3f46; color:#a1a1aa; border:none; border-radius:4px; cursor:pointer;">
                      {{ showNewPassword ? '숨김' : '보기' }}
                    </button>
                  </div>
                </div>
                <div class="edit-form-actions">
                  <button class="btn btn-primary btn-sm" style="padding-top:4px; padding-bottom:4px;" @click="savePassword">변경</button>
                  <button class="btn btn-secondary btn-sm" style="padding-top:4px; padding-bottom:4px;" @click="cancelPasswordEdit">취소</button>
                </div>
              </div>
            </div>
          </div>
          <button class="logout-btn" @click="logout">로그아웃</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '@/api/axios.js'

const router = useRouter()
const route = useRoute()
const storeName = ref(localStorage.getItem('currentStoreName') || '매장')
const activeModal = ref(null)

// ── 테이블 ──
const tables = ref([])
const newTableNumber = ref(null)
const tableAddMode = ref('single')
const tableRangeStart = ref(null)
const tableRangeEnd = ref(null)

// ── 메뉴 ──
const menuList = ref([])
const categories = ref([])
const newMenu = reactive({
  imageFile: null,
  imagePreview: null,
  categoryId: null,
  name: '',
  price: 0,
  origin: '',
  description: '',
  options: [],
})
const editMenu = ref(null)
const expandedOptions = ref([])

// ── 메뉴 수정 이미지 미리보기 ──
const handleEditImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) {
    editMenu.value.imagePreview = null
    editMenu.value.imageFile = null
    return
  }
  editMenu.value.imageFile = file
  editMenu.value.imagePreview = URL.createObjectURL(file)
}

// ── 카테고리 ──
const showNewCategoryInput = ref(false)
const showRegisterCategoryDropdown = ref(false)
const showEditCategoryDropdown = ref(false)
const editingCategoryId = ref(null)
const editingCategoryName = ref('')
const showEditCategoryInput = ref(false)
const newCategoryName = ref('')

// ── 영업시간 커스텀 피커 ──
const timeHours   = Array.from({ length: 12 }, (_, i) => i + 1)
const timeMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

const hoursOpenAmPm   = ref('AM')
const hoursOpenHour   = ref(9)
const hoursOpenMinute = ref(0)

const hoursCloseAmPm   = ref('PM')
const hoursCloseHour   = ref(10)
const hoursCloseMinute = ref(0)

const parseTime24 = (timeStr) => {
  if (!timeStr) return null
  const [hStr, mStr] = timeStr.split(':')
  let h = parseInt(hStr)
  const m = parseInt(mStr) || 0
  const ampm = h < 12 ? 'AM' : 'PM'
  if (h === 0) h = 12
  else if (h > 12) h -= 12
  return { ampm, hour: h, minute: m }
}

const toTime24 = (ampm, hour, minute) => {
  let h = hour % 12
  if (ampm === 'PM') h += 12
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const openHoursModal = async () => {
  const storeId = localStorage.getItem('currentStoreId')
  if (!storeId) {
    alert('매장 정보가 없습니다.')
    return
  }
  try {
    const res = await api.get(`/store/${storeId}/time`)
    const openParsed  = parseTime24(res.data.OpenAt?.substring(0, 5))
    const closeParsed = parseTime24(res.data.CloseAt?.substring(0, 5))
    if (openParsed) {
      hoursOpenAmPm.value   = openParsed.ampm
      hoursOpenHour.value   = openParsed.hour
      hoursOpenMinute.value = openParsed.minute
    }
    if (closeParsed) {
      hoursCloseAmPm.value   = closeParsed.ampm
      hoursCloseHour.value   = closeParsed.hour
      hoursCloseMinute.value = closeParsed.minute
    }
  } catch (e) {
    // 기본값 유지
  }
  activeModal.value = 'hours'
}

const saveBusinessHours = async () => {
  const storeId = localStorage.getItem('currentStoreId')
  const openTime  = toTime24(hoursOpenAmPm.value,  hoursOpenHour.value,  hoursOpenMinute.value)
  const closeTime = toTime24(hoursCloseAmPm.value, hoursCloseHour.value, hoursCloseMinute.value)
  try {
    await api.patch(`/store/${storeId}/updatetime`, {
      openAt:  openTime  + ':00',
      closeAt: closeTime + ':00',
    })
    alert('영업시간이 저장되었습니다.')
    activeModal.value = null
  } catch (e) {
    alert(e.response?.data?.errorMessage || '저장 실패')
  }
}

// ── 마이페이지 ──
const ownerInfo = reactive({ name: '', email: '', phone: '', businessNumber: '' })
const editingPassword = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const showOldPassword = ref(false)
const showNewPassword = ref(false)

// ── 초기 로딩 ──
onMounted(async () => {
  await Promise.all([loadTables(), loadMenus(), loadCategories(), loadMyPage()])
  if (route.query.modal === 'table') {
    activeModal.value = 'table'
  }
})

const loadTables = async () => {
  try {
    const res = await api.get('/customertable/gettablelist')
    tables.value = res.data
      .map(t => ({ id: t.customerTableId, number: t.tableNum }))
      .sort((a, b) => a.number - b.number)
  } catch (e) {
    console.error('테이블 목록 로딩 실패:', e)
  }
}

const loadMenus = async () => {
  try {
    const res = await api.get('/view/all')
    menuList.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.error('메뉴 목록 로딩 실패:', e)
  }
}

const loadCategories = async () => {
  try {
    const res = await api.get('/view/category')
    categories.value = res.data
  } catch (e) {
    console.error('카테고리 로딩 실패:', e)
  }
}

const formatBusinessNumber = (value) => {
  const digits = (value || '').replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 5) return `${digits.slice(0,3)}-${digits.slice(3)}`
  return `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`
}

const loadMyPage = async () => {
  try {
    const res = await api.get('/owner/mypage')
    ownerInfo.name = res.data.ownerName
    ownerInfo.email = res.data.ownerEmail
    ownerInfo.phone = res.data.phoneNumber
    ownerInfo.businessNumber = formatBusinessNumber(res.data.businessRegistrationNumber || '')
  } catch (e) {
    console.error('마이페이지 로딩 실패:', e)
  }
}

const formatPrice = (price) => (price ?? 0).toLocaleString('ko-KR')

// ── 테이블 ──
const addTable = async () => {
  if (newTableNumber.value === null || newTableNumber.value === undefined || newTableNumber.value === '') {
    return alert('테이블 번호를 입력하세요.')
  }
  if (newTableNumber.value < 1) return alert('테이블 번호는 1 이상이어야 합니다.')
  try {
    await api.post('/customertable/create', { tableNum: newTableNumber.value })
    alert('테이블이 추가되었습니다.')
    newTableNumber.value = null
    await loadTables()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '테이블 추가 실패')
  }
}

const addTableRange = async () => {
  if (!tableRangeStart.value || !tableRangeEnd.value) return alert('시작과 끝 번호를 입력하세요.')
  if (tableRangeStart.value < 1 || tableRangeEnd.value < 1) return alert('테이블 번호는 1 이상이어야 합니다.')
  if (tableRangeStart.value > tableRangeEnd.value) return alert('시작 번호가 끝 번호보다 클 수 없어요.')
  if (tableRangeEnd.value - tableRangeStart.value > 49) return alert('한 번에 최대 50개까지 추가할 수 있어요.')
  try {
    for (let i = tableRangeStart.value; i <= tableRangeEnd.value; i++) {
      await api.post('/customertable/create', { tableNum: i })
    }
    alert(`${tableRangeStart.value}번 ~ ${tableRangeEnd.value}번 테이블이 추가되었습니다.`)
    tableRangeStart.value = null
    tableRangeEnd.value = null
    await loadTables()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '테이블 추가 실패')
  }
}

const deleteTable = async (tableId, tableNum) => {
  if (!confirm(`${tableNum}번 테이블을 삭제하시겠습니까?`)) return
  try {
    await api.delete(`/customertable/${tableId}`)
    await loadTables()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '테이블 삭제 실패')
  }
}

// ── 메뉴 등록 ──
const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  newMenu.imageFile = file
  const reader = new FileReader()
  reader.onload = (ev) => { newMenu.imagePreview = ev.target.result }
  reader.readAsDataURL(file)
}

const registerMenu = async () => {
  if (!newMenu.name || !newMenu.categoryId || !newMenu.price) return alert('필수 항목을 모두 입력하세요.')
  try {
    const formData = new FormData()
    formData.append('menuName', newMenu.name)
    formData.append('price', newMenu.price)
    formData.append('origin', newMenu.origin)
    formData.append('explanation', newMenu.description)
    formData.append('categoryId', newMenu.categoryId)
    if (newMenu.imageFile) formData.append('menuImage', newMenu.imageFile)

    const menuRes = await api.post('/store/menu/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const menuId = menuRes.data

    for (const option of newMenu.options) {
      if (!option.optionName.trim()) continue
      const optionRes = await api.post(`/store/menu/${menuId}/option`, { optionName: option.optionName })
      const optionId = optionRes.data
      for (const detail of option.details) {
        if (!detail.optionDetailName.trim()) continue
        await api.post(`/store/menu/option/${optionId}/detail`, {
          optionDetailName: detail.optionDetailName,
          optionDetailPrice: detail.optionDetailPrice,
        })
      }
    }

    alert('메뉴가 등록되었습니다.')
    Object.assign(newMenu, {
      imageFile: null, imagePreview: null, categoryId: null,
      name: '', price: 0, origin: '', description: '', options: [],
    })
    showNewCategoryInput.value = false
    newCategoryName.value = ''
    activeModal.value = null
    await loadMenus()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '메뉴 등록 실패')
  }
}

// ── 카테고리 추가 ──
const addNewCategory = async (mode) => {
  if (!newCategoryName.value.trim()) return alert('카테고리 이름을 입력하세요.')
  try {
    await api.post('/store/category/create', { categoryName: newCategoryName.value.trim() })
    await loadCategories()
    if (mode === 'register') {
      newMenu.categoryId = null
      showNewCategoryInput.value = false
    } else {
      editMenu.value.categoryId = null
      showEditCategoryInput.value = false
    }
    newCategoryName.value = ''
  } catch (e) {
    alert(e.response?.data?.errorMessage || '카테고리 추가 실패')
  }
}

// ── 카테고리 수정 ──
const updateCategory = async (categoryId) => {
  if (!editingCategoryName.value.trim()) return alert('카테고리 이름을 입력하세요.')
  try {
    await api.put(`/store/category/${categoryId}`, { categoryName: editingCategoryName.value.trim() })
    await loadCategories()
    editingCategoryId.value = null
    editingCategoryName.value = ''
  } catch (e) {
    alert(e.response?.data?.errorMessage || '카테고리 수정 실패')
  }
}

// ── 카테고리 삭제 ──
const deleteCategory = async (categoryId) => {
  if (!confirm('이 카테고리를 삭제하시겠습니까?\n해당 카테고리의 메뉴들은 카테고리가 없어집니다.')) return
  try {
    await api.delete(`/store/category/${categoryId}`)
    await loadCategories()
    if (newMenu.categoryId === categoryId) newMenu.categoryId = null
    if (editMenu.value && editMenu.value.categoryId === categoryId) editMenu.value.categoryId = null
  } catch (e) {
    alert(e.response?.data?.errorMessage || '카테고리 삭제 실패')
  }
}

// ── 메뉴 수정 열기 ──
const openMenuDetail = async (menu) => {
  const menuId = menu.menuId ?? menu.id
  if (!menuId) return alert('메뉴 ID를 찾을 수 없습니다.')
  expandedOptions.value = []
  showEditCategoryInput.value = false
  newCategoryName.value = ''
  editMenu.value = {
    id: menuId, menuName: menu.menuName || '', price: menu.menuPrice || 0,
    categoryId: null, origin: '', explanation: '', imageFile: null, options: [],
  }
  activeModal.value = 'menuDetail'
  try {
    const res = await api.get(`/store/menu/${menuId}/detail`)
    editMenu.value = {
      id: menuId,
      menuName: res.data.menuName || '',
      price: res.data.price || 0,
      categoryId: res.data.categoryId ?? null,
      origin: res.data.origin || '',
      explanation: res.data.explanation || '',
      imageUrl: res.data.imageUrl || null,
      imageFile: null,
      imagePreview: null,
      options: (res.data.options || []).map(o => ({
        optionId: o.optionId,
        optionName: o.optionName || '',
        details: (o.details || []).map(d => ({
          optionDetailId: d.optionDetailId,
          optionDetailName: d.optionDetailName || '',
          optionDetailPrice: d.optionDetailPrice || 0,
        })),
      })),
    }
  } catch (e) {
    alert('메뉴 정보 로딩 실패: ' + (e.response?.data?.errorMessage || e.message))
  }
}

// ── 메뉴 저장 ──
const saveMenuEdit = async () => {
  try {
    const formData = new FormData()
    formData.append('menuName', editMenu.value.menuName)
    formData.append('price', editMenu.value.price)
    formData.append('origin', editMenu.value.origin || '')
    formData.append('explanation', editMenu.value.explanation || '')
    formData.append('categoryId', editMenu.value.categoryId)
    if (editMenu.value.imageFile) formData.append('menuImage', editMenu.value.imageFile)
    await api.put(`/store/menu/${editMenu.value.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    alert('메뉴 정보가 수정되었습니다.')
    activeModal.value = null
    await loadMenus()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '메뉴 수정 실패')
  }
}

// ── 메뉴 삭제 ──
const deleteMenu = async () => {
  if (!confirm('정말 이 메뉴를 삭제하시겠습니까?')) return
  try {
    await api.delete(`/store/menu/${editMenu.value.id}`)
    alert('메뉴가 삭제되었습니다.')
    activeModal.value = null
    await loadMenus()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '메뉴 삭제 실패')
  }
}

// ── 옵션 추가 ──
const addOption = async () => {
  try {
    const res = await api.post(`/store/menu/${editMenu.value.id}/option`, { optionName: '' })
    editMenu.value.options.push({ optionId: res.data, optionName: '', details: [] })
    expandedOptions.value.push(res.data)
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 추가 실패')
  }
}

// ── 옵션 수정 ──
const updateOption = async (option) => {
  try {
    await api.put(`/store/menu/option/${option.optionId}`, { optionName: option.optionName })
    alert('옵션이 수정되었습니다.')
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 수정 실패')
  }
}

// ── 옵션 삭제 ──
const deleteOption = async (optionId) => {
  if (!confirm('이 옵션을 삭제하시겠습니까?')) return
  try {
    await api.delete(`/store/menu/option/${optionId}`)
    editMenu.value.options = editMenu.value.options.filter(o => o.optionId !== optionId)
    expandedOptions.value = expandedOptions.value.filter(id => id !== optionId)
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 삭제 실패')
  }
}

// ── 옵션 상세 추가 ──
const addOptionDetail = async (option) => {
  try {
    const res = await api.post(`/store/menu/option/${option.optionId}/detail`, {
      optionDetailName: '', optionDetailPrice: 0,
    })
    option.details.push({ optionDetailId: res.data, optionDetailName: '', optionDetailPrice: 0 })
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 상세 추가 실패')
  }
}

// ── 옵션 상세 수정 ──
const updateOptionDetail = async (detail) => {
  try {
    await api.put(`/store/menu/option/detail/${detail.optionDetailId}`, {
      optionDetailName: detail.optionDetailName,
      optionDetailPrice: detail.optionDetailPrice,
    })
    alert('옵션 상세가 수정되었습니다.')
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 상세 수정 실패')
  }
}

// ── 옵션 상세 삭제 ──
const deleteOptionDetail = async (optionDetailId, optionId) => {
  if (!confirm('이 옵션 상세를 삭제하시겠습니까?')) return
  try {
    await api.delete(`/store/menu/option/detail/${optionDetailId}`)
    const option = editMenu.value.options.find(o => o.optionId === optionId)
    if (option) option.details = option.details.filter(d => d.optionDetailId !== optionDetailId)
  } catch (e) {
    alert(e.response?.data?.errorMessage || '옵션 상세 삭제 실패')
  }
}

// ── 비밀번호 ──
const savePassword = async () => {
  if (!oldPassword.value || !newPassword.value) return alert('모든 항목을 입력하세요.')
  try {
    await api.put('/owner/mypage/updatepassword', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    alert('비밀번호가 변경되었습니다.')
    cancelPasswordEdit()
  } catch (e) {
    alert(e.response?.data?.errorMessage || '비밀번호 변경 실패')
  }
}

const cancelPasswordEdit = () => {
  editingPassword.value = false
  oldPassword.value = ''
  newPassword.value = ''
  showOldPassword.value = false
  showNewPassword.value = false
}

const logout = () => {
  if (!confirm('로그아웃 하시겠습니까?')) return
  localStorage.clear()
  router.push('/')
}
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

/* ── 커스텀 시간 선택기 ───────────────────────────── */
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