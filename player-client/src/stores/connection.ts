import { acceptHMRUpdate, defineStore } from "pinia";
import { socket } from "@/socket";
import { Client2Server, Server2Client } from "@/models/events";
import type { Character, CharacterID, PlayerID } from "@/models/player";
import { useCookie } from "vue-cookie-next";
import type { BotAvailabilityUpdate } from "@/models/connection";

const TIMEOUT = 5000
const PLAYER_ID_COOKIE = 'player-id'

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
            handlers: {},
            connected: false,
            id: "" as PlayerID
        }
    },
    actions: {
        bindEvents() {
            socket.on('connect', () => {
                this.connected = true
                console.log('socket connected')
            })

            socket.on('disconnect', () => {
                this.connected = false
                console.log('socket disconnected')
            })

            // socket.on('foo', (...args:any) => {
            //     this.fooEvents.push(args)
            // })

            // it's possible that the socket connected before the connect event was registered
            // get the true connection status
            this.connected = socket.connected
        },
        connect() {
            console.log("trying to (re)connect")
            socket.connect()
        },
        disconnect() {
            console.log('disconnecting')
            socket.disconnect()
        },
        reconnect() {
            this.disconnect()
            this.connect()
        },
        gameStartHandler () {},
        beginProgrammingHandler() {},
        useID(id: PlayerID) {
            socket.timeout(TIMEOUT).emit(Client2Server.USE_ID, id, (err: Error, ok: boolean) => {
                if (err) {
                    console.error(err) 
                }
                if (!ok) {
                    // if we aren't allowed to use the id we sent, then delete the cookie (so this
                    // branch isn't executed again, and try the ID fetch again)
                    console.log('ID use request was rejected')
                    const cookie = useCookie()
                    cookie.removeCookie(PLAYER_ID_COOKIE)
                    this.getPlayerID()
                }
            })
        },
        /**
         * This should be called early in the page's lifetime.
         * If there is a living cookie containing a player ID, then pull that ID into here, and request
         * we use it. If that ID is denied, request the current ID from the server, set it on the class
         * and in the cookie
         */
        getPlayerID() {
            // check for a cookie
            const cookie = useCookie()
            if (cookie.isCookieAvailable(PLAYER_ID_COOKIE)) {
                const stored_id = cookie.getCookie(PLAYER_ID_COOKIE)
                if (stored_id) {
                    console.log(`Requesting use of ID from cookie: ${stored_id}`)
                    this.id = stored_id
                    this.useID(this.id)
                    return
                }
            }
            // request the ID from the server
            socket.timeout(TIMEOUT).emit(Client2Server.GET_ID, (err: Error, id: string) => {
                if (err) {
                    console.error(err)
                } else {
                    console.log(`got ID from server ${id}`)
                    this.id = id
                }
            })
        },
        /**
         * join a room and switch to a tcp connection
         * @param player_name name of the player joining
         * @param room_code the code which designates which room to join
         * @return any error message encountered, or undefined if there wasn't one
         */
        join(player_name: string, callback: (message?: string) => void): void {
            console.log('Requesting to join game')
            // toggle to req not ok
            this.join_req.complete = false


            // make the "request"
            socket.timeout(TIMEOUT).emit(Client2Server.JOIN_GAME, player_name, (err: Error, ok: boolean) => {
                if (err) {
                    console.error("Join request failed", err)
                    this.join_req.complete = ok
                    callback(err.message)
                    return
                }
                // once we get a response, 
                // this.join_req.response = resp
                this.join_req.complete = true
                callback()
            })
        },
        getCharacters(callback:(characters: Character[], unavailable: CharacterID[]) => void) {
            // request the character data
            socket.timeout(TIMEOUT).emit(Client2Server.LIST_BOTS, (err: Error, characters: Character[], unavailable: CharacterID[]) => {
                if (err) {
                    console.log(err)
                    return
                }
                callback(characters, unavailable)
            })
        },
        selectCharacter(id: CharacterID, callback:(message?:string) => void) {
            socket.timeout(TIMEOUT).emit(Client2Server.SELECT_BOT, id, (err: Error, ok: boolean) => {
                if (err) {
                    console.error(err)
                    callback(err.message)
                    return
                }
                callback()
            })
        }
    }
})

// add this bit for hot reloading in dev mode
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useConnectionStore, import.meta.hot))
}