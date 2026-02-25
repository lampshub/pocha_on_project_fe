<template>
  <div class="table-selection-page">
    <!-- 헤더 -->
    <div class="header">
      <div class="header-left">
        <h1 class="store-name">
          <span class="store-highlight">{{ storeInfo.name }}</span>
        </h1>
        <p class="store-address">{{ storeInfo.address }}</p>
      </div>
      <p class="page-subtitle">테이블을 선택해주세요</p>
      <button class="back-btn-header" @click="goBack">뒤로 가기</button>
    </div>

    <!-- 나머지는 그대로 -->
    <div class="main-container">
      <div v-if="tables.length > 0">
        <h2 class="section-title">
          전체 테이블 ({{ availableCount }}개 이용 가능)
        </h2>
        <div class="table-grid">
          <div
            v-for="table in tables"
            :key="table.customerTableId"
            :class="['table-card', { occupied: table.isOccupied }]"
            @click="selectTable(table)"
          >
            <div class="table-icon">🍽️</div>
            <div class="table-number">{{ table.tableNum }}</div>
            <div class="table-label">Table</div>
            <div
              :class="[
                'table-status',
                table.isOccupied ? 'occupied' : 'available',
              ]"
            >
              {{ table.isOccupied ? "이용 중" : "이용 가능" }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">🍽️</div>
        <div class="empty-title">등록된 테이블이 없습니다</div>
        <div class="empty-description">점주님께 문의해주세요.</div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { useToast } from "vue-toastification";

const toast = useToast();

export default {
  name: "TableSelection",
  data() {
    return {
      storeInfo: { id: null, name: "", address: "" },
      tables: [],
      sseReader: null, // fetch SSE reader
    };
  },
  computed: {
    availableCount() {
      return this.tables.filter((t) => !t.isOccupied).length;
    },
  },
  methods: {
    async selectTable(table) {
      if (table.isOccupied) {
        toast(`테이블 ${table.tableNum}번은 현재 사용 중입니다.`);
        return;
      }
      try {
        const baseUrl = process.env.VUE_APP_API_BASE_URL;
        const response = await axios.post(`${baseUrl}/customertable/select`, {
          tableNum: table.tableNum,
        });
        const newToken = response.data.tableAccessToken;
        if (!newToken) {
          toast("테이블 인증에 실패했습니다.");
          return;
        }
        localStorage.setItem("accessToken", newToken);
        this.$router.push({
          name: "CustomerMenu",
          params: {
            storeId: this.storeInfo.id,
            tableId: table.customerTableId,
          },
        });
      } catch (error) {
        if (error.response?.status === 409) {
          toast.error("이미 다른 고객이 선택한 테이블입니다.");
        } else {
          toast("테이블 선택에 실패했습니다.");
        }
      }
    },

    // ── SSE 연결 (fetch + ReadableStream) ─────────────────────
    async connectSSE() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;

  const self = this; // ← this 고정

  try {
    const response = await fetch(
      `${process.env.VUE_APP_API_BASE_URL}/sse/connect`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    self.sseReader = reader;

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      let eventName = "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (!dataStr) continue;
          try {
            const payload = JSON.parse(dataStr);
            console.log("SSE 수신:", eventName, payload);
            if (eventName === "TABLE_STATUS") {
              self.tables = self.tables.map((t) =>  // ← self 사용
                Number(t.tableNum) === Number(payload.tableNum)
                  ? { ...t, isOccupied: payload.status === "USING" }
                  : t,
              );
              console.log("tables 업데이트 후:", self.tables);
            }
          } catch (e) {
            console.debug("SSE parse error:", e);
          }
          eventName = "";
        }
      }
    }
  } catch (e) {
    console.error("SSE 연결 실패:", e);
  }
},

    async disconnectSSE() {
      if (this.sseReader) {
        try {
          await this.sseReader.cancel();
        } catch (e) {
          console.debug("SSE JSON parse error:", e);
        }
        this.sseReader = null;
      }
    },

    goBack() {
      if (confirm("이전 화면으로 돌아가시겠습니까?")) {
        this.$router.back();
      }
    },

    async loadTables() {
      try {
        const baseUrl = process.env.VUE_APP_API_BASE_URL;
        const response = await axios.get(`${baseUrl}/customertable/list`, {
          params: { storeId: this.storeInfo.id },
        });
        this.tables = response.data.map((t) => ({
          ...t,
          tableNum: t.tableNum,
          isOccupied: t.tableStatus === "USING",
        }));
      } catch (error) {
        toast.error("테이블 정보를 불러오는데 실패했습니다.");
      }
    },
  },

  async mounted() {
    const storeId = localStorage.getItem("currentStoreId");
    if (!storeId) {
      toast("잘못된 접근입니다.");
      this.$router.push("/");
      return;
    }
    this.storeInfo = {
      id: Number(storeId),
      name: localStorage.getItem("currentStoreName") || "",
      address: localStorage.getItem("currentStoreAddress") || "",
    };
    await this.loadTables();
    this.connectSSE(); // 테이블 로드 후 SSE 상시 구독 시작
  },

  beforeUnmount() {
    this.disconnectSSE();
  },
};
</script>

<style scoped>
@import "@/assets/css/OwnerTableSelection.css";
</style>
