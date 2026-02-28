/**
 * useBusinessHours
 * - 영업시간 커스텀 피커 상태 관리
 * - 24시간 <-> AM/PM 변환 유틸
 * - 영업시간 로딩 및 저장
 */
import { ref } from 'vue'
import api from '@/api/axios.js'

export function useBusinessHours() {
  /** 시간 선택지 (1~12) */
  const timeHours = Array.from({ length: 12 }, (_, i) => i + 1)
  /** 분 선택지 (5분 단위) */
  const timeMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

  /** 영업 시작 - 오전/오후 */
  const hoursOpenAmPm = ref('AM')
  /** 영업 시작 - 시 */
  const hoursOpenHour = ref(9)
  /** 영업 시작 - 분 */
  const hoursOpenMinute = ref(0)

  /** 영업 종료 - 오전/오후 */
  const hoursCloseAmPm = ref('PM')
  /** 영업 종료 - 시 */
  const hoursCloseHour = ref(10)
  /** 영업 종료 - 분 */
  const hoursCloseMinute = ref(0)

  /**
   * 24시간 형식 문자열("HH:MM")을 AM/PM, 시, 분으로 파싱
   * @param {string} timeStr - "HH:MM" 형식
   * @returns {{ ampm: string, hour: number, minute: number } | null}
   */
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

  /**
   * AM/PM, 시, 분을 24시간 형식 문자열로 변환
   * @param {string} ampm - 'AM' | 'PM'
   * @param {number} hour - 1~12
   * @param {number} minute - 0~59
   * @returns {string} "HH:MM" 형식
   */
  const toTime24 = (ampm, hour, minute) => {
    let h = hour % 12
    if (ampm === 'PM') h += 12
    return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }

  /**
   * 서버에서 현재 영업시간을 가져와 피커에 반영 후 모달 열기 콜백 호출
   * @param {Function} onReady - 데이터 로딩 완료 후 호출할 콜백
   */
  const openHoursModal = async (onReady) => {
    const storeId = localStorage.getItem('currentStoreId')
    if (!storeId) {
      alert('매장 정보가 없습니다.')
      return
    }
    try {
      const res = await api.get(`/store/${storeId}/time`)
      const openParsed = parseTime24(res.data.openAt?.substring(0, 5))
      const closeParsed = parseTime24(res.data.closeAt?.substring(0, 5))
      if (openParsed) {
        hoursOpenAmPm.value = openParsed.ampm
        hoursOpenHour.value = openParsed.hour
        hoursOpenMinute.value = openParsed.minute
      }
      if (closeParsed) {
        hoursCloseAmPm.value = closeParsed.ampm
        hoursCloseHour.value = closeParsed.hour
        hoursCloseMinute.value = closeParsed.minute
      }
    } catch (e) {
      // 기본값 유지
    }
    if (onReady) onReady()
  }

  /**
   * 영업시간을 서버에 저장
   * @param {Function} onSuccess - 저장 성공 시 콜백
   */
  const saveBusinessHours = async (onSuccess) => {
    const storeId = localStorage.getItem('currentStoreId')
    const openTime = toTime24(hoursOpenAmPm.value, hoursOpenHour.value, hoursOpenMinute.value)
    const closeTime = toTime24(hoursCloseAmPm.value, hoursCloseHour.value, hoursCloseMinute.value)
    try {
      await api.patch(`/store/${storeId}/updatetime`, {
        openAt: openTime + ':00',
        closeAt: closeTime + ':00',
      })
      alert('영업시간이 저장되었습니다.')
      if (onSuccess) onSuccess()
    } catch (e) {
      alert(e.response?.data?.errorMessage || '저장 실패')
    }
  }

  return {
    timeHours,
    timeMinutes,
    hoursOpenAmPm,
    hoursOpenHour,
    hoursOpenMinute,
    hoursCloseAmPm,
    hoursCloseHour,
    hoursCloseMinute,
    parseTime24,
    toTime24,
    openHoursModal,
    saveBusinessHours,
  }
}
