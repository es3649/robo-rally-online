import type { PlayerID } from "@/main/models/player";
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
            const ip = await window.mainAPI.getIP()
            if (ip !== undefined) {
                this.ip = ip
            }
            return ip
        },
        async getToDos(): Promise<Map<PlayerID, string[]>> {
            return await window.mainAPI.getToDos()
        },
        sendStart(): void {
            // TODO we also need to advance the phase
            window.mainAPI.startGame()
        }
    }
})
