import AddStore from "@/views/another/AddStore.vue";
import OwnerLogin from "@/views/another/OwnerLogin.vue";
import OwnerSignUp from "@/views/another/OwnerSignUp.vue";
import OwnerDashBoard from "@/views/another/OwnerDashBoard.vue";
import OwnerTableSelection from "@/views/another/OwnerTableSelection.vue";

export const anotherRouter = [

  {
    path: "/another/addstore",
    name: "AddStore",
    component: AddStore,
  },
  {
    path: "/",
    name: "OwnerLogin",
    component: OwnerLogin,
  },
  {
    path: "/another/signUp",
    name: "OwnerSignUp",
    component: OwnerSignUp,
  },
  {
    path: "/another/tableselect",
    name: "OwnerTableSelection",
    component: OwnerTableSelection, // ← static import로 변경
  },
  {
    path: "/another/dashboard",
    name: "OwnerDashBoard",
    component: OwnerDashBoard,
  },
];

