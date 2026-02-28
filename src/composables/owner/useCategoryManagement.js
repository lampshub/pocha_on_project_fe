/**
 * useCategoryManagement
 * - 카테고리 목록 로딩 / 추가 / 수정 / 삭제
 * - 카테고리 드롭다운 및 입력 UI 상태 관리
 */
import { ref } from 'vue'
import api from '@/api/axios.js'

export function useCategoryManagement() {
  /** 카테고리 목록 */
  const categories = ref([])

  /** 등록 모달: 새 카테고리 입력 필드 표시 여부 */
  const showNewCategoryInput = ref(false)
  /** 등록 모달: 카테고리 드롭다운 표시 여부 */
  const showRegisterCategoryDropdown = ref(false)
  /** 수정 모달: 카테고리 드롭다운 표시 여부 */
  const showEditCategoryDropdown = ref(false)
  /** 수정 모달: 새 카테고리 입력 필드 표시 여부 */
  const showEditCategoryInput = ref(false)

  /** 현재 수정 중인 카테고리 ID */
  const editingCategoryId = ref(null)
  /** 현재 수정 중인 카테고리 이름 */
  const editingCategoryName = ref('')
  /** 새 카테고리 이름 입력값 */
  const newCategoryName = ref('')

  /** 서버에서 카테고리 목록 가져오기 */
  const loadCategories = async () => {
    try {
      const res = await api.get('/view/category')
      categories.value = res.data
    } catch (e) {
      console.error('카테고리 로딩 실패:', e)
    }
  }

  /**
   * 새 카테고리 추가
   * @param {string} mode - 'register' (등록 모달) 또는 'edit' (수정 모달)
   * @param {Object} context - { newMenu, editMenu } 참조 객체
   */
  const addNewCategory = async (mode, context = {}) => {
    if (!newCategoryName.value.trim()) return alert('카테고리 이름을 입력하세요.')
    try {
      await api.post('/store/category/create', { categoryName: newCategoryName.value.trim() })
      await loadCategories()
      if (mode === 'register') {
        if (context.newMenu) context.newMenu.categoryId = null
        showNewCategoryInput.value = false
      } else {
        if (context.editMenu?.value) context.editMenu.value.categoryId = null
        showEditCategoryInput.value = false
      }
      newCategoryName.value = ''
    } catch (e) {
      alert(e.response?.data?.errorMessage || '카테고리 추가 실패')
    }
  }

  /**
   * 카테고리 이름 수정
   * @param {number} categoryId - 수정할 카테고리 ID
   */
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

  /**
   * 카테고리 삭제 (확인 후)
   * @param {number} categoryId - 삭제할 카테고리 ID
   * @param {Object} context - { newMenu, editMenu } 연관 메뉴의 카테고리 초기화용
   */
  const deleteCategory = async (categoryId, context = {}) => {
    if (!confirm('이 카테고리를 삭제하시겠습니까?\n해당 카테고리의 메뉴들은 카테고리가 없어집니다.')) return
    try {
      await api.delete(`/store/category/${categoryId}`)
      await loadCategories()
      // 삭제된 카테고리를 선택 중이던 메뉴 폼 초기화
      if (context.newMenu && context.newMenu.categoryId === categoryId) {
        context.newMenu.categoryId = null
      }
      if (context.editMenu?.value && context.editMenu.value.categoryId === categoryId) {
        context.editMenu.value.categoryId = null
      }
    } catch (e) {
      alert(e.response?.data?.errorMessage || '카테고리 삭제 실패')
    }
  }

  return {
    categories,
    showNewCategoryInput,
    showRegisterCategoryDropdown,
    showEditCategoryDropdown,
    showEditCategoryInput,
    editingCategoryId,
    editingCategoryName,
    newCategoryName,
    loadCategories,
    addNewCategory,
    updateCategory,
    deleteCategory,
  }
}
