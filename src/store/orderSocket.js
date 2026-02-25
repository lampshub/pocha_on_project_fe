// src/store/orderSocket.js
import { defineStore } from "pinia";
import { ref } from "vue";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export const useOrderSocketStore = defineStore("orderSocket", () => {
  const isConnected = ref(false);
  const lastOrderMessage = ref(null);
  const lastQueueMessage = ref(null);
  let stompClient = null;

  function connect(storeId, accessToken) {
    if (stompClient?.active) return;

    stompClient = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8083/connect"),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 3000,

      onConnect: () => {
        isConnected.value = true;
        console.log("주문 웹소켓 연결됨 (Pinia)");

        stompClient.subscribe(`/topic/order/${storeId}`, (message) => {
          lastOrderMessage.value = {
            data: JSON.parse(message.body),
            _ts: Date.now(),
          };
        });

        stompClient.subscribe(`/topic/order-queue/${storeId}`, (message) => {
          lastQueueMessage.value = {
            data: JSON.parse(message.body),
            _ts: Date.now(),
          };
        });
      },

      onDisconnect: () => { isConnected.value = false; },
      onStompError: (frame) => { console.error("주문 STOMP 에러:", frame); },
    });

    stompClient.activate();
  }

  function disconnect() {
    stompClient?.deactivate();
    stompClient = null;
    isConnected.value = false;
  }

  return { isConnected, lastOrderMessage, lastQueueMessage, connect, disconnect };
});