import { ref, computed } from "vue";
import { acceptHMRUpdate, defineStore } from "pinia";
import axios, { AxiosError, type AxiosResponse, type AxiosStatic } from "axios";
import type { join_POST_req } from "@/models/api_models";
import type { ConnectionDetails } from "@/models/connection";
import { io } from "socket.io-client"

export declare interface EventHandler {
    game_start_handler(): void,
    game_end_handler(): void,
    begin_programming_handler(): void,

}

export const useConnectionStore = defineStore({
    id: 'connection',
    state() {
        return {
            // could we change this to a plyer object and let it hold the connection, or will that just create different issues?
            sock: io(),
            sock_connected: false,
            req_ok: ref(false),
            handlers: {}
        }
    },
    actions: {
        game_start_handler () {},
        begin_programming_handler() {},
        connect(details: ConnectionDetails): void {
            this.sock = io(`https://${details.host}:${details.port}`)

            // connection handler
            this.sock.on("connect", () => {
                this.sock_connected = true
            })

            // disconnect handler
            this.sock.on("disconnect", () => {
                this.sock_connected = false
            })

            // 
            this.sock.on("game_start", this.game_start_handler)
            this.sock.on("programming_phase", this.begin_programming_handler)
        },
        /**
         * join a room and switch to a tcp connection
         * @param player_name name of the player joining
         * @param room_code the code which designates which room to join
         * @return any error message encountered, or undefined if there wasn't one
         */
        async join(player_name: string, room_code: string, host_code:string = ""): Promise<string|undefined> {
            // toggle to req not okf
            this.req_ok = false
            // construct the request
            let req: join_POST_req = {
                player_name: player_name,
                room_code: room_code
            }

            // add this if we have it
            if (host_code != "") {
                req.host_key = host_code
            }

            var response: AxiosResponse
            try {
                console.log(req)
                // make the request
                response = await axios.post('http://localhost/API/join', req)
            } catch (error: any) {
                // log error
                console.error('Failed to join room')
                console.log(error)
                try {
                    const e = error as AxiosError
                    return e.response?.data as string
                } catch {
                    return "Request Failed"
                }
            }

            var connection_details: ConnectionDetails
            try {
                connection_details = response.data
                console.log(connection_details)
            } catch (error) {
                console.error("Failed to read response data")
                console.log(error)
                return "Bad response"
            }

            this.req_ok = true
            // begin the TCP connection
            this.connect(connection_details)
            // return undefined, lol
        }
    }
})

// add this bit for hot reloading in dev mode
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useConnectionStore, import.meta.hot))
}