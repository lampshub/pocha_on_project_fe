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
            <div :class="['table-status', table.isOccupied ? 'occupied' : 'available']">
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
import {useToast} from "vue-toastification";

const toast = useToast();

export default {
  name: "TableSelection",
  data() {
    return {
      storeInfo: {
        id: null,
        name: "",
        address: "",
      },
      tables: [],
    };
  },
  computed: {
    availableCount() {
      return this.tables.filter((table) => !table.isOccupied).length;
    },
  },
  methods: {
    async selectTable(table) {
      if (table.isOccupied) {
        alert(`테이블 ${table.tableNum}번은 현재 사용 중입니다.`);
        return;
      }

      try {
        const baseUrl = process.env.VUE_APP_API_BASE_URL;
        const response = await axios.post(`${baseUrl}/customertable/select`, {
          tableNum: table.tableNum,
        });

        const newToken = response.data.tableAccessToken;

        if (!newToken) {
          console.error("TABLE 토큰이 응답에 없습니다.");
          alert("테이블 인증에 실패했습니다.");
          return;
        }

        // BASE → TABLE 토큰 교체
        localStorage.setItem("accessToken", newToken);
        localStorage.setItem("selectedTable", JSON.stringify(table));

        this.$router.push({
          name: "CustomerMenu",
          params: {
            storeId: this.storeInfo.id,
            tableId: table.customerTableId,
          },
        });
      } catch (error) {
        console.error("테이블 선택 실패:", error);
        alert("테이블 선택에 실패했습니다.");
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
        const storeId = this.storeInfo.id;

        const response = await axios.get(`${baseUrl}/customertable/list`, {
          params: {storeId},
        });

        this.tables = response.data.map((t) => ({
          ...t,
          isOccupied: t.tableStatus === "USING",
        }));
      } catch (error) {
        console.error("테이블 데이터 로드 실패:", error);
        toast.error("테이블 정보를 불러오는데 실패했습니다.");
      }
    },
  },
  async mounted() {
    const storeId = localStorage.getItem("currentStoreId");

    if (!storeId) {
      alert("잘못된 접근입니다.");
      this.$router.push("/");
      return;
    }

    this.storeInfo = {
      id: Number(storeId),
      name: localStorage.getItem("currentStoreName") || "",
      address: localStorage.getItem("currentStoreAddress") || "",
    };

    await this.loadTables();
  },
};
</script>

<style scoped>
@import "@/assets/css/OwnerTableSelection.css";


</style>