import CustomerMenu from "@/views/customer/CustomerMenu.vue";
import CustomerPayment from "@/views/customer/CustomerPayment.vue";

export const customerRouter = [
    {
        path: "/customer/menu/:tableId",
        name: "CustomerMenu",
        component: CustomerMenu
    },
    {
        path: '/customer/payment/:tableNum',
        name: 'CustomerPayment',
        component: CustomerPayment
    },
]