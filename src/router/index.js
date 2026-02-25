import {createRouter, createWebHistory} from "vue-router";
import {customerRouter} from "@/router/customerRouter";
import {ownerRouter} from "@/router/ownerRouter";
import {anotherRouter} from "@/router/anotherRouter";
import {payRouter} from "@/router/payRouter";

const routes = [
    ...customerRouter,
    ...ownerRouter,
    ...anotherRouter,
    ...payRouter,
]

export const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)