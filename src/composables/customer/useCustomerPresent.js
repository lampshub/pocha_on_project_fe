/**
 * useCustomerPresent
 * - 선물 전송 (다른 테이블에 메뉴 선물)
 * - 선물 수신 처리 (STOMP 구독)
 * - 선물 팝업 및 폭죽 애니메이션
 */
import { ref, nextTick } from 'vue'
import { customerMenuApi as customerOrderApi } from '@/api/customerMenuApi'
import { useToast } from 'vue-toastification'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

export function useCustomerPresent(tableNum, storeId, accessToken, selectedMenu, menuQuantity, closeMenuDetail, parseJwt, closePanel) {
  const toast = useToast()

  const showPresentPanel = ref(false)
  const selectedPresentTable = ref(null)
  const presentNotification = ref(null)
  const presentUnread = ref(false)
  const presentToastTimer = ref(null)
  const showPresentToast = ref(false)
  const presentPendingList = ref([])
  const presentActiveData = ref(null)
  const presentOverlayVisible = ref(false)
  const presentConfettiCanvasRef = ref(null)
  const presentConfettiAnim = ref(null)
  const presentParticles = ref([])
  const tableStompClient = ref(null)

  const PRESENT_CONFETTI_COLORS = [
    '#ff6b35', '#e94560', '#ffd700', '#7c3aed',
    '#00b4d8', '#06d6a0', '#ff6fa0', '#ffa552',
  ]

  const openPresent = (selectedTable) => {
    selectedPresentTable.value = selectedTable?.tableNum
    closePanel()
    showPresentPanel.value = true
  }

  const closePresentPanel = () => {
    showPresentPanel.value = false
    selectedPresentTable.value = null
  }

  const handlePresentReceived = (presentData) => {
    presentNotification.value = presentData
    showPresentToast.value = true
    presentUnread.value = true

    if (presentToastTimer.value) clearTimeout(presentToastTimer.value)
    presentToastTimer.value = setTimeout(() => {
      showPresentToast.value = false
    }, 5000)
    presentPendingList.value.push({ ...presentData, id: Date.now() })
  }

  const _openPresentPopup = (presentData) => {
    presentActiveData.value = presentData
    presentOverlayVisible.value = true
    nextTick(() => {
      setTimeout(() => _launchPresentConfetti(), 150)
    })
  }

  const onPresentToastClick = () => {
    showPresentToast.value = false
    presentUnread.value = false
    if (presentToastTimer.value) clearTimeout(presentToastTimer.value)
    if (presentNotification.value) {
      _openPresentPopup(presentNotification.value)
      presentPendingList.value = presentPendingList.value.slice(1)
    }
  }

  const openPresentFromHeader = () => {
    if (presentPendingList.value.length === 0) return
    const presentData = presentPendingList.value[0]
    presentPendingList.value = presentPendingList.value.slice(1)
    _openPresentPopup(presentData)
  }

  const closePresentPopup = () => {
    presentOverlayVisible.value = false
    presentActiveData.value = null
    if (presentConfettiAnim.value) cancelAnimationFrame(presentConfettiAnim.value)
    if (presentConfettiCanvasRef.value) {
      const ctx = presentConfettiCanvasRef.value.getContext('2d')
      ctx.clearRect(0, 0, 9999, 9999)
    }
    if (presentPendingList.value.length === 0) {
      presentUnread.value = false
    }
  }

  const _launchPresentConfetti = () => {
    const canvas = presentConfettiCanvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const cx = canvas.width / 2, cy = canvas.height / 2
    presentParticles.value = []
    for (let i = 0; i < 250; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 4 + Math.random() * 14
      const size = 5 + Math.random() * 9
      const type = Math.random() < 0.5 ? 'rect' : 'circle'
      presentParticles.value.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (Math.random() * 6 + 2),
        gravity: 0.25 + Math.random() * 0.15,
        color: PRESENT_CONFETTI_COLORS[Math.floor(Math.random() * PRESENT_CONFETTI_COLORS.length)],
        size, type,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
        alpha: 1,
        decay: 0.012 + Math.random() * 0.008,
        w: type === 'rect' ? size : size / 2,
        h: type === 'rect' ? size * 0.4 : size / 2,
      })
    }
    _addPresentBurstRings()
    if (presentConfettiAnim.value) cancelAnimationFrame(presentConfettiAnim.value)
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false
      presentParticles.value.forEach((p) => {
        if (p.alpha <= 0) return
        alive = true
        p.x += p.vx; p.y += p.vy
        p.vy += p.gravity; p.vx *= 0.99
        p.rotation += p.rotSpeed; p.alpha -= p.decay
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        if (p.type === 'rect') ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        else { ctx.beginPath(); ctx.arc(0, 0, p.w, 0, Math.PI * 2); ctx.fill() }
        ctx.restore()
      })
      if (alive) presentConfettiAnim.value = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    draw()
  }

  const _addPresentBurstRings = () => {
    const overlay = document.querySelector('.present-overlay')
    if (!overlay) return
    ;['#ff6b35', '#e94560', '#ffd700'].forEach((color, i) => {
      const ring = document.createElement('div')
      ring.className = 'present-burst-ring'
      ring.style.cssText = `border-color:${color};animation-delay:${i * 0.08}s;animation-duration:${0.55 + i * 0.1}s;`
      overlay.appendChild(ring)
      ring.addEventListener('animationend', () => ring.remove())
    })
  }

  const sendPresent = async () => {
    if (!selectedMenu.value) return

    const payload = parseJwt(localStorage.getItem('accessToken') || '')

    try {
      await customerOrderApi.sendPresent({
        idempotencyKey: crypto.randomUUID(),
        senderTableNum: tableNum.value,
        receiverTableNum: selectedPresentTable.value,
        menuId: selectedMenu.value.id,
        menuQuantity: menuQuantity.value,
        storeId: payload.storeId,
      })
      toast.success(
        `${selectedPresentTable.value}번 테이블에 ${selectedMenu.value.name}을(를) 선물했습니다!`
      )
    } catch (e) {
      console.error(e)
      toast.error('선물 전송에 실패했습니다.')
    }

    closeMenuDetail()
    closePresentPanel()
  }

  const connectTableWebSocket = () => {
    if (!accessToken.value || !tableNum.value) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect`),
      connectHeaders: { Authorization: `Bearer ${accessToken.value}` },
      onConnect: () => {
        client.subscribe(`/topic/table/${tableNum.value}`, (message) => {
          const receiverDto = JSON.parse(message.body)
          handlePresentReceived({
            fromTable: receiverDto.senderTableNum,
            menuName: receiverDto.menuList?.[0]?.menuName,
            menuList: receiverDto.menuList,
          })
        })
      },
      onStompError: (frame) => console.error('손님 STOMP 에러:', frame),
    })
    client.activate()
    tableStompClient.value = client
  }

  return {
    showPresentPanel,
    selectedPresentTable,
    presentNotification,
    presentUnread,
    showPresentToast,
    presentPendingList,
    presentActiveData,
    presentOverlayVisible,
    presentConfettiCanvasRef,
    presentToastTimer,
    tableStompClient,
    openPresent,
    closePresentPanel,
    onPresentToastClick,
    openPresentFromHeader,
    closePresentPopup,
    sendPresent,
    connectTableWebSocket,
  }
}
