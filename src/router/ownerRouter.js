import OwnerPanel from "@/views/owner/OwnerPanel.vue";
import OwnerSettlement from "@/views/owner/OwnerSettlement.vue";
import OwnerSettings from "@/views/owner/OwnerSettings.vue";

export const ownerRouter = [

    {
        path: "/owner/panel",
        name: "OwnerPanel",
        component: OwnerPanel
    },
    {
        path: "/owner/settlement",
        name: "OwnerSettlement",
        component: OwnerSettlement
    },
    {
        path: "/owner/settings",
        name: "OwnerSettings",
        component: OwnerSettings
    },


]
