import { acceptHMRUpdate, defineStore } from "pinia";
import { socket, TIMEOUT } from "@/socket";
import { Client2Server } from "@/models/events";
import type { Character, CharacterID, PlayerID } from "@/models/player";

export const PLAYER_ID_COOKIE = 'player-id'

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
    id: 'client_connection',
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
        useID(id: PlayerID, callback: (err: Error, ok: boolean) => void) {
            console.log("Requesting ID:", id)
            socket.timeout(TIMEOUT).emit(Client2Server.USE_ID, id, callback)
        },
        /**
         * This should be called early in the page's lifetime.
         * If there is a living cookie containing a player ID, then pull that ID into here, and request
         * we use it. If that ID is denied, request the current ID from the server, set it on the class
         * and in the cookie
         */
        getPlayerID(callback?: (id: string) => void) {
            console.log("Looking for existing player ID")
            socket.timeout(TIMEOUT).emit(Client2Server.GET_ID, (err: Error, id: string) => {
                if (err) {
                    console.error(err)
                } else {
                    console.log(`got ID from server ${id}`)
                    this.id = id
                    // if there's a callback, call back
                    if (callback !== undefined) {
                        callback(id)
                    }
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