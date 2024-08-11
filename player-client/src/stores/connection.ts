import { acceptHMRUpdate, defineStore } from "pinia";
import { socket } from "@/socket";

export declare interface EventHandler {
    game_start_handler(): void,
    game_end_handler(): void,
    begin_programming_handler(): void,

}

class PendingResponse<T> {
    public complete: boolean
    public response: T|undefined

    constructor() {
        this.complete = false
        this.response = undefined
    } 
}

export const useConnectionStore = defineStore({
    id: 'connection',
    state() {
        return {
            // could we change this to a player object and let it hold the connection, or will that just create different issues?
            join_req: new PendingResponse<string>(),
            handlers: {}
        }
    },
    actions: {
        bindEvents() {},
        game_start_handler () {},
        begin_programming_handler() {},
        
        /**
         * join a room and switch to a tcp connection
         * @param player_name name of the player joining
         * @param room_code the code which designates which room to join
         * @return any error message encountered, or undefined if there wasn't one
         */
        async join(player_name: string, callback: () => void): Promise<void> {
            // toggle to req not ok
            this.join_req.complete = false

            // make the "request"
            socket.emit('join', player_name, (resp: string) => {
                // once we get a response, 
                this.join_req.response = resp
                this.join_req.complete = true

                callback()
            })
        }
    }
})

// add this bit for hot reloading in dev mode
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useConnectionStore, import.meta.hot))
}