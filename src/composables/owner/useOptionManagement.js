/**
 * useOptionManagement
 * - 메뉴 옵션 추가 / 수정 / 삭제
 * - 옵션 상세(옵션 항목) 추가 / 수정 / 삭제
 */
import api from '@/api/axios.js'

export function useOptionManagement(editMenu, expandedOptions) {
  /**
   * 새 옵션 그룹 추가 (서버에 즉시 생성)
   * editMenu.value.id 기반으로 해당 메뉴에 옵션 추가
   */
  const addOption = async () => {
    try {
      const res = await api.post(`/store/menu/${editMenu.value.id}/option`, { optionName: '' })
      editMenu.value.options.push({ optionId: res.data, optionName: '', details: [] })
      expandedOptions.value.push(res.data)
    } catch (e) {
      alert(e.response?.data?.errorMessage || '옵션 추가 실패')
    }
  }

  /**
   * 옵션 그룹 이름 수정
   * @param {Object} option - { optionId, optionName }
   */
  const updateOption = async (option) => {
    try {
      await api.put(`/store/menu/option/${option.optionId}`, { optionName: option.optionName })
      alert('옵션이 수정되었습니다.')
    } catch (e) {
      alert(e.response?.data?.errorMessage || '옵션 수정 실패')
    }
  }

  /**
   * 옵션 그룹 삭제 (확인 후)
   * @param {number} optionId - 삭제할 옵션 ID
   */
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

  /**
   * 옵션 상세 항목 추가 (서버에 즉시 생성)
   * @param {Object} option - 상위 옵션 그룹 객체
   */
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

  /**
   * 옵션 상세 항목 수정
   * @param {Object} detail - { optionDetailId, optionDetailName, optionDetailPrice }
   */
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

  /**
   * 옵션 상세 항목 삭제 (확인 후)
   * @param {number} optionDetailId - 삭제할 옵션 상세 ID
   * @param {number} optionId - 상위 옵션 ID (목록에서 제거용)
   */
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

  return {
    addOption,
    updateOption,
    deleteOption,
    addOptionDetail,
    updateOptionDetail,
    deleteOptionDetail,
  }
}
