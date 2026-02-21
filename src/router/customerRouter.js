
import CustomerMenu from "@/views/customer/CustomerMenu.vue";

export const customerRouter = [
    {
        path: "/customer/menu/:tableId",
        name: "CustomerMenu",
        component: CustomerMenu
    },
]