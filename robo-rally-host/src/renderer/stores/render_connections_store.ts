import type { CharacterID, PlayerID } from "@/shared/models/player";
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
            console.log("returned ip:", ip)
            if (ip !== undefined) {
                this.ip = ip
            }
            return ip
        },
        async getToDos(): Promise<Map<PlayerID, string[]>> {
            return await window.mainAPI.getToDos()
        },
        sendStart(): Promise<boolean> {
            // TODO we also need to advance the phase
            return window.mainAPI.startGame()
        },
        async connectRobot(id: CharacterID): Promise<boolean> {
            return window.mainAPI.connectRobot(id)
        },
        async removePlayer(player_id: PlayerID): Promise<boolean> {
           return window.mainAPI.removePlayer(player_id)
        }
    }
})
