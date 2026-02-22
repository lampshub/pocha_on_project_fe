import {defineStore} from "pinia";
import {ref} from "vue";

export const useStoreInfo = defineStore('storeInfo', () => {
    const storeId = ref(null);
    const storeName = ref('');

    function setStore(id, name) {
        storeId.value = ref(id);
        storeName.value = name;

        localStorage.setItem('storeId', id);
        localStorage.setItem('storeName', name);
    }

    function loadFromStorage() {
        storeId.value = localStorage.getItem('storeId');
        storeName.value = localStorage.getItem('storeName');

    }

    function clear() {
        storeId.value = null;
        storeName.value = '';
        localStorage.removeItem('storeId');
        localStorage.removeItem('storeName');
    }

    return {storeId, storeName, setStore, loadFromStorage, clear};
})