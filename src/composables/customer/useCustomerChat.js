/**
 * useCustomerChat
 * - 테이블 간 채팅 기능 (STOMP WebSocket + SSE 알림)
 * - 채팅방 생성/조회, 메시지 전송/수신
 * - 읽지 않은 메시지 카운트 관리
 * - 채팅방 종료 처리
 */
import { ref, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import { chatApi } from '@/api/customerChatApi'
import axios from 'axios'

// eslint-disable-next-line no-unused-vars
export function useCustomerChat(tableNum, storeId, accessToken, tableStompClient, closePanel) {
  const toast = useToast()

  const showChatModal = ref(false)
  const showChatPanel = ref(false)
  const selectedChatTable = ref(null)
  const chatInput = ref('')
  const chatMessages = ref([])
  const chatMessagesRef = ref(null)
  const unreadChatCount = ref(0)
  const unreadMessagesByTable = ref({})
  const activeTables = ref([])
  const myChatRooms = ref([])
  const currentChatRoom = ref(null)
  const currentSubscription = ref(null)
  const sseAlarmSource = ref(null)

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const scrollToBottom = async () => {
    await nextTick()
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  }

  const getUnreadCountForTable = (t) => unreadMessagesByTable.value[t] || 0

  const loadAvailableTables = async () => {
    try {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/customertable/available`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            storeId: storeId.value,
          },
        }
      )
      if (response.data && Array.isArray(response.data)) {
        activeTables.value = response.data
          .map((t) => t.tableNum)
          .filter((t) => t !== tableNum.value)
      } else {
        activeTables.value = []
      }
    } catch (e) {
      console.error('사용 가능 테이블 로드 실패:', e)
    }
  }

  const loadMyChatRooms = async () => {
    try {
      const { data } = await chatApi.getMyActiveRooms(storeId.value, tableNum.value)
      myChatRooms.value = data || []
    } catch (e) {
      console.error('채팅방 목록 로드 실패:', e)
      myChatRooms.value = []
    }
  }

  const loadUnreadTotalCount = async () => {
    try {
      const { data: rooms } = await chatApi.getMyActiveRooms(
        storeId.value,
        tableNum.value
      )
      unreadChatCount.value = rooms.reduce(
        (sum, room) => sum + (room.unreadCount || 0),
        0
      )
      rooms.forEach((room) => {
        if (room.unreadCount > 0 && room.otherTableNum) {
          unreadMessagesByTable.value[String(room.otherTableNum)] =
            room.unreadCount
        }
      })
    } catch (e) {
      console.error('알람 개수 로드 실패:', e)
    }
  }

  const loadChatMessages = async (roomId) => {
    try {
      const { data } = await chatApi.getMessages(roomId)
      chatMessages.value = data.map((m) => ({
        text: m.message,
        isMine: Number(m.senderTableNum) === Number(tableNum.value),
        time: formatTime(m.createdAt),
      }))
    } catch (e) {
      console.error('메시지 로드 실패:', e)
    }
  }

  const openChatModal = async () => {
    try {
      showChatModal.value = true
      // selectedTable은 외부에서 관리
      await Promise.all([loadAvailableTables(), loadUnreadTotalCount(), loadMyChatRooms()])
    } catch (e) {
      console.error('채팅 모달 열기 중 오류:', e)
    }
  }

  const closeChatModal = () => {
    showChatModal.value = false
  }

  const subscribeToChatRoom = (roomId) => {
    if (currentSubscription.value) {
      currentSubscription.value.unsubscribe()
    }

    const doSubscribe = () => {
      currentSubscription.value = tableStompClient.value.subscribe(
        `/topic/chat/${roomId}`,
        (message) => {
          const received = JSON.parse(message.body)
          chatMessages.value.push({
            text: received.message,
            isMine: Number(received.senderTableNum) === Number(tableNum.value),
            time: formatTime(received.createdAt),
          })
          scrollToBottom()
        }
      )
    }

    if (tableStompClient.value?.connected) {
      doSubscribe()
    } else {
      let attempts = 0
      const maxAttempts = 10
      const retryInterval = setInterval(() => {
        attempts++
        if (tableStompClient.value?.connected) {
          clearInterval(retryInterval)
          doSubscribe()
        } else if (attempts >= maxAttempts) {
          clearInterval(retryInterval)
          toast.error('채팅 연결에 실패했습니다. 다시 시도해주세요.')
        }
      }, 300)
    }
  }

  const openChat = async (targetNum, selectedTable) => {
    const tNum = targetNum || selectedTable?.tableNum
    if (!tNum) return

    try {
      const { data: room } = await chatApi.getOrCreateRoom(Number(tNum))
      currentChatRoom.value = room
      selectedChatTable.value = tNum

      await loadChatMessages(room.id)

      const senderKey = String(tNum)
      const localCount =
        unreadMessagesByTable.value[senderKey] ||
        unreadMessagesByTable.value[Number(tNum)] ||
        0
      unreadChatCount.value = Math.max(0, unreadChatCount.value - localCount)
      unreadMessagesByTable.value[senderKey] = 0
      unreadMessagesByTable.value[Number(tNum)] = 0

      await chatApi.markAsRead(room.id, tableNum.value)
      await loadUnreadTotalCount()

      showChatModal.value = false
      setTimeout(() => {
        showChatPanel.value = true
        nextTick(() => scrollToBottom())
      }, 150)

      subscribeToChatRoom(room.id)
      nextTick(() => scrollToBottom())
    } catch (e) {
      console.error('채팅방 열기 실패:', e)
      toast.error('채팅방을 열 수 없습니다. 다시 시도해주세요.')
    }
  }

  const closeChatPanel = async () => {
    if (currentChatRoom.value) {
      try {
        await chatApi.markAsRead(currentChatRoom.value.id, tableNum.value)
        await loadUnreadTotalCount()
      } catch (e) {
        console.error('패널 닫기 시 읽음 처리 실패:', e)
      }
    }
    showChatPanel.value = false
    selectedChatTable.value = null
    currentChatRoom.value = null
    chatMessages.value = []
    chatInput.value = ''
  }

  const sendMessage = () => {
    if (!chatInput.value.trim() || !currentChatRoom.value) return

    const messageDto = {
      chatRoomId: currentChatRoom.value.id,
      storeId: Number(storeId.value),
      senderTableNum: Number(tableNum.value),
      receiverTableNum: Number(selectedChatTable.value),
      message: chatInput.value,
    }

    tableStompClient.value.publish({
      destination: '/app/chat/send',
      body: JSON.stringify(messageDto),
    })

    chatInput.value = ''
  }

  // SSE 채팅 알림
  const handleChatClosed = (payload) => {
    const closedRoomId = payload.chatRoomId
    delete unreadMessagesByTable.value[String(payload.table1Num)]
    delete unreadMessagesByTable.value[String(payload.table2Num)]
    loadUnreadTotalCount()

    if (currentChatRoom.value?.id === closedRoomId) {
      currentChatRoom.value = null
      showChatPanel.value = false
      toast.info('상대 테이블이 퇴장하여 채팅이 종료되었습니다.')
    }
  }

  const handleChatAlarm = (payload) => {
    if (showChatPanel.value && currentChatRoom.value) {
      chatApi
        .markAsRead(currentChatRoom.value.id, tableNum.value)
        .then(() => loadUnreadTotalCount())
        .catch(() => {})
      return
    }

    unreadChatCount.value++

    const sender = payload?.senderTableNum ?? payload?.senderTable
    if (sender != null) {
      const key = String(sender)
      const prev = unreadMessagesByTable.value[key] || 0
      unreadMessagesByTable.value[key] = prev + 1
      unreadMessagesByTable.value[Number(sender)] = prev + 1
    } else {
      loadUnreadTotalCount()
    }
  }

  const connectChatAlarmSSE = () => {
    disconnectChatAlarmSSE()
    fetchChatAlarmSSE()
  }

  const fetchChatAlarmSSE = async () => {
    if (!accessToken.value) return
    try {
      const response = await fetch(`${process.env.VUE_APP_API_BASE_URL}/sseChat/connect`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      sseAlarmSource.value = reader

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const dataStr = line.slice(5).trim()
          if (!dataStr) continue

          try {
            const payload = JSON.parse(dataStr)
            if (payload.type === 'chat-closed') {
              handleChatClosed(payload)
            } else {
              handleChatAlarm(payload)
            }
          } catch (_e) {
            /* 비-JSON 연결 확인 메시지 등 무시 */
          }
        }
      }
    } catch (e) {
      console.error('SSE 채팅 알림 연결 실패:', e)
    }
  }

  const disconnectChatAlarmSSE = async () => {
    if (sseAlarmSource.value) {
      try {
        await sseAlarmSource.value.cancel()
      } catch (_e) {
        /* ignore */
      }
      sseAlarmSource.value = null
    }
    try {
      await fetch(`${process.env.VUE_APP_API_BASE_URL}/sseChat/disconnect`, {
        headers: { Authorization: `Bearer ${accessToken.value}` },
      })
    } catch (_e) {
      /* ignore */
    }
  }

  return {
    showChatModal,
    showChatPanel,
    selectedChatTable,
    chatInput,
    chatMessages,
    chatMessagesRef,
    unreadChatCount,
    unreadMessagesByTable,
    activeTables,
    myChatRooms,
    currentChatRoom,
    getUnreadCountForTable,
    openChatModal,
    closeChatModal,
    openChat,
    closeChatPanel,
    sendMessage,
    connectChatAlarmSSE,
    disconnectChatAlarmSSE,
    loadUnreadTotalCount,
  }
}
