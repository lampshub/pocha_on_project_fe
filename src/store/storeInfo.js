import {defineStore} from "pinia";
import {ref} from "vue";

export const useStoreInfo = defineStore('storeInfo', () => {
    const storeId = ref(null);
    const storeName = ref('');

    function setStore(id, name) {
        storeId.value = id;
        storeName.value = name;

        localStorage.setItem('currentStoreId', id);
        localStorage.setItem('currentStoreName', name);
    }

    function loadFromStorage() {
        storeId.value = localStorage.getItem('currentStoreId');
        storeName.value = localStorage.getItem('currentStoreName');
    }

    function clear() {
        storeId.value = null;
        storeName.value = '';
        localStorage.removeItem('currentStoreId');
        localStorage.removeItem('currentStoreName');
    }

    return {storeId, storeName, setStore, loadFromStorage, clear};
})