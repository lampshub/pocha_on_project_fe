/**
 * useTableManagement
 * - 테이블 CRUD (단일 추가, 범위 추가, 삭제)
 * - 테이블 목록 로딩 및 정렬
 */
import { ref } from 'vue'
import api from '@/api/axios.js'

export function useTableManagement() {
  /** 테이블 목록 */
  const tables = ref([])
  /** 단일 추가 시 입력할 테이블 번호 */
  const newTableNumber = ref(null)
  /** 추가 모드: 'single' | 'range' */
  const tableAddMode = ref('single')
  /** 범위 추가 시작 번호 */
  const tableRangeStart = ref(null)
  /** 범위 추가 끝 번호 */
  const tableRangeEnd = ref(null)

  /** 서버에서 테이블 목록을 가져와 번호순 정렬 */
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

  /** 단일 테이블 추가 */
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

  /** 범위 테이블 추가 (시작~끝 번호) */
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

  /** 테이블 삭제 (확인 후) */
  const deleteTable = async (tableId, tableNum) => {
    if (!confirm(`${tableNum}번 테이블을 삭제하시겠습니까?`)) return
    try {
      await api.delete(`/customertable/${tableId}`)
      await loadTables()
    } catch (e) {
      alert(e.response?.data?.errorMessage || '테이블 삭제 실패')
    }
  }

  return {
    tables,
    newTableNumber,
    tableAddMode,
    tableRangeStart,
    tableRangeEnd,
    loadTables,
    addTable,
    addTableRange,
    deleteTable,
  }
}
