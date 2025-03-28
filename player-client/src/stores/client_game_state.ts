import { acceptHMRUpdate, defineStore } from "pinia";
import { GamePhase, ProgrammingCard, newStandardDeck, newRegisterArray, PROGRAMMING_HAND_SIZE } from "@/shared/models/game_data";
import type { UpgradeCard, GameAction, ProgrammingCardSlot } from "@/shared/models/game_data";
import type { CharacterID, Character, PlayerStateData, PlayerID } from "@/shared/models/player";
import { socket, TIMEOUT } from "@/socket"
import { Client2Server, Server2Client } from "@/shared/models/events";
import type { BotAvailabilityUpdate, ProgrammingData } from "@/shared/models/connection";
import { useConnectionStore } from "./client_connection";

export enum GameWindows {
    DEFAULT,
    UPGRADE,
    PLAYER_INFO,
    SETTINGS
}

export const useGameStateStore = defineStore({
    id: "client_game_state",
    state() { // TODO should opponent states and game actions be moved into a different store for non-game-pertinent data?
        return {
            // the programming cards in our hand
            programming_hand: [
                {action: ProgrammingCard.forward1, id: 0},
                {action: ProgrammingCard.right, id: 1},
                {action: ProgrammingCard.left, id: 2},
                {action: ProgrammingCard.forward2, id: 3},
                {action: ProgrammingCard.forward3, id: 4},
                {action: ProgrammingCard.back, id: 5},
                {action: ProgrammingCard.u_turn, id: 6},
                {action: ProgrammingCard.again, id: 7},
                {action: ProgrammingCard.power_up, id: 8}
            ] as ProgrammingCardSlot[],
            // in_play: [] as ProgrammingCardSlot[],

            // the cards we have programmed
            registers: newRegisterArray(),
            // the energy we have
            energy: 3,
            // the checkpoints we have
            checkpoints: 0,
            total_checkpoints: 3,
            // is our robot currently active (as opposed to dead/shutdown)
            active: false,
            // Our status in the priority ordering
            _priority: 0,
            // the upgrade cards we have in hand
            upgrade_hand: [] as UpgradeCard[],
            // the upgrades we have equipped
            upgrades: [] as UpgradeCard[],
            // the number of the current register
            _register: -1,
            // the current phase of the game
            phase: -1 as GamePhase,
            // whether programming is allowed, so we can lock registers after program submit
            programming_enabled: false,
            // log messages
            log: [] as GameAction[],
            // current action
            action: undefined as GameAction|undefined,
            // the basic states of the opponents
            opponent_states: [{
                name: "Mara", energy: 7, checkpoints: 0, priority: 1, active: true,
            },{
                name: "Manuel", energy: 0, checkpoints: 1, priority: 2, active: true,
            },{
                name: "Michelangelo", energy: 3, checkpoints: 0, priority: 3, active: false,
            }] as PlayerStateData[],

            // the characters which are not available for selection
            all_characters: [] as Character[],
            character: undefined as Character|undefined, 
            available_characters: new Set<CharacterID>(),

            game_display: GameWindows.DEFAULT
        }
    },
    getters: {
        /**
         * Add 1 to the current register to get it as a 1-indexed value
         * @returns the 1-indexed number of the current register
         */
        register(): number {
            return this._register + 1
        },
        priority(): number {
            return this._priority + 1
        },
        /**
         * formats the checkpoints as a boolean array for UI work
         * @returns an array of booleans indicating whether the checkpoint has been reached
         */
        checkpoint_array(): boolean[] {
            let ret = [] as boolean[]
            // if we have more than i checkpoints, then we have checkpoint i
            for (let i = 0; i < this.total_checkpoints; i++) {
                ret.push(this.checkpoints > i)
            }
            return ret
        },
    },
    actions: {
        /**
         * Moved the card at idx in the programming hand to the numbered register
         * @param idx the index of the card in the hand which is being programmed
         * @param register the register in which the gard is being programmed
         * @returns true if the card was able to be programmed (i.e. can't program over Haywire)
         */
        // program(idx:number, register:number):boolean {
        //     // the register is currently empty
        //     const cur = this.registers[register][0]
        //     if (cur == undefined) {
        //         // program the card
        //         this.registers[register] = [this.programming_hand[idx]]
        //         // remove the card from the hand
        //         this.programming_hand[idx]
        //         return true
        //     }
        //     if (ProgrammingCard.is_haywire(cur.action)) {
        //         // we can't program over a haywire
        //         return false
        //     }

        //     // there is already a card in that slot, swap them
        //     this.registers[register] = this.programming_hand[idx]
        //     this.programming_hand[idx] = cur
        //     return true
        // },
        next_phase() {
            switch(this.phase) {
                case GamePhase.Lobby:
                    break
                case GamePhase.Upgrade:
                    break
                case GamePhase.Programming:
                    this.programming_enabled = true
                    // draw a new hand
                    this.drawProgrammingHand()
                    break
                case GamePhase.Activation:
                    this.programming_enabled = false
                    this.clearProgrammingHand()
                    break
            }
        },
        /**
         * polls the server for the new hand of cards and new registers
         */
        drawProgrammingHand(): void {
            // request the data from the server
            socket.emit(Client2Server.GET_PROGRAMMING_DATA, (data:ProgrammingData) => {
                if (data.hand.length === 0) {
                    console.warn("We may have received an error response")
                }
                this.registers = data.new_registers
                this.programming_hand = data.hand
                this.programming_hand.sort((a: ProgrammingCardSlot, b:ProgrammingCardSlot): number => {
                    if (a === undefined) return -1
                    if (b === undefined) return 1
                    return a.action < b.action ? -1 : 1
                })
            })
            
            
        },
        clearProgrammingHand(): void {
            this.programming_hand = []
        },
        /**
         * Submit the current program for execution
         */
        submitProgram(shutdown: boolean) {
            // emit the program
            socket.emit(Client2Server.PROGRAM_SUBMIT, {
                registers: this.registers,
                shutdown: shutdown
            })
        },
        new_action(action:GameAction|undefined=undefined) {
            if (action != undefined) {
                this.action = action
                return
            }

            const r = Math.floor(Math.random()*205)
            const g = Math.floor(Math.random()*205)
            const b = Math.floor(Math.random()*205)
            const dark = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`
            const lite = `#${(r+50).toString(16).padStart(2,)}${(g+50).toString(16)}${(b+50).toString(16)}`

            const DECK = newStandardDeck()

            this.action = {
                action: DECK[Math.floor(Math.random() * DECK.length)],
                actor: {
                    name: 'Jamison',
                    id: "abcd-efgh-123456789012",
                    character: {
                        name: "Thor",
                        id: "hems1234",
                        sprite_large: "",
                        sprite_small: "",
                        color: {
                            fill_color: lite,
                            border_color: dark,
                        },
                        bluetooth_id: "12:34:56:78:90:AB"
                    }
                }
            }
        },
        draw_upgrade(): void {
            console.log("drawing upgrade")
            if (this.energy < 1) {
                return
            }
            // pull an upgrade card
            this.energy -= 1
        },
        processPlayerStates(states: Map<PlayerID, PlayerStateData>) {
            const c_cs = useConnectionStore()
            const self = states.get(c_cs.id)
            if (self === undefined) {
                console.warn("our ID was not included in player data update")
            } else {
                this.energy = self.energy
                this.active = self.active
                this.checkpoints = self.checkpoints
                // name shouldn't change
                this._priority = self.priority
                states.delete(c_cs.id)
            }
            this.opponent_states = Array.from(states.values())
        },
        getPlayerStates() {
            socket.timeout(TIMEOUT).emit(Client2Server.GET_PLAYER_STATES, (err: Error, states: Map<PlayerID, PlayerStateData>) => {
                if (err) {
                    console.error("Error while fetching player states:", err)
                    return
                }
                this.processPlayerStates(states)
            })
        },
        bindEvents() {
            socket.on(Server2Client.PHASE_UPDATE, (phase: GamePhase) => {
                this.phase = phase
                this.next_phase()
            })

            socket.on(Server2Client.GAME_ACTION, (action:GameAction) => {
                this.action = action
            })

            socket.on(Server2Client.BOT_SELECTED, (update: BotAvailabilityUpdate) => {
                console.log("Recv'd bot availability update", update)
                for (const available of update.newly_available) {
                    this.available_characters.add(available)
                }
                for (const unavailable of update.newly_unavailable) {
                    if (this.available_characters.has(unavailable)) {
                        this.available_characters.delete(unavailable)
                    }
                }            
            })

            socket.on(Server2Client.RESET, () => {
                console.log('reset')
            })

            socket.on(Server2Client.UPDATE_PLAYER_STATES, (states: Map<PlayerID, PlayerStateData>) => {
                this.processPlayerStates(states)
            })

            socket.on(Server2Client.GAME_ACTION, (action: GameAction) => {
                this.log.push(action)
            })

            socket.on(Server2Client.REQUEST_INPUT, (request: ProgrammingCard.ActionChoiceData) => {
                console.log("received input request:", request)
            })
        }
    }
})

// add this for hot reloading
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useGameStateStore, import.meta.hot))
}