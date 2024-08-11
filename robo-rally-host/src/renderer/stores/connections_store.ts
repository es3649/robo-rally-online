import { defineStore } from "pinia";

export const useConnectionsStore = defineStore({
    id: 'connections',
    state() {
        return {
            ip: '0.0.0.0',
            characters: new Map<string, boolean>()
        }
    },
    actions: {
        async getIP(): Promise<string|undefined> {
            return await window.mainAPI.getIP()
        }
    }
})