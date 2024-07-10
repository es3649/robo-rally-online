import { acceptHMRUpdate, defineStore } from "pinia";
import { GamePhase, ProgrammingCard } from "@/models/game_data";
import type { RegisterArray, UpgradeCard, GameAction } from "@/models/game_data";

export const useGameStateStore = defineStore({
    id: "gameState",
    state() {
        return {
            // the programming cards in our hand
            programming_hand: ['right', 'left', 'forward1', 'forward2', 'forward3', 'back', 'power_up', 'again', 'u_turn'] as ProgrammingCard[],
            // the cards we have programmed
            registers: [undefined, undefined, undefined, undefined, undefined] as RegisterArray,
            // the energy we have
            energy: 3,
            // the checkpoints we have
            checkpoints: 0,
            total_checkpoints: 3,
            // is our robot currently active (as opposed to dead/shutdown)
            active: false,
            // the upgrade cards we have in hand
            upgrade_hand: [] as UpgradeCard[],
            // the upgrades we have equipped
            upgrades: [] as UpgradeCard[],
            // the number of the current register
            _register: -1,
            // the current phase of the game
            phase: -1 as GamePhase,
            // log messages
            log: [] as string[],
            // current action
            action: undefined as GameAction|undefined
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
        }
    },
    actions: {
        /**
         * Moved the card at idx in the programming hand to the numbered register
         * @param idx the index of the card in the hand which is being programmed
         * @param register the register in which the gard is being programmed
         * @returns true if the card was able to be programmed (i.e. can't program over Haywire)
         */
        program(idx:number, register:number):boolean {
            // the register is currently empty
            const cur = this.registers[register]
            if (cur == undefined) {
                // program the card
                this.registers[register] = this.programming_hand[idx]
                // remove the card from the hand
                this.programming_hand[idx]
                return true
            }
            if (ProgrammingCard.is_haywire(cur)) {
                // we can't program over a haywire
                return false
            }

            // there is already a card in that slot, swap them
            this.registers[register] = this.programming_hand[idx]
            this.programming_hand[idx] = cur
            return true
        },
        next_phase() {
            switch(this.phase) {
                case GamePhase.Lobby:
                case GamePhase.Activation:
                    this.phase = GamePhase.Upgrade
                    break
                case GamePhase.Upgrade:
                    this.phase = GamePhase.Programming
                    break
                case GamePhase.Programming:
                    this.phase = GamePhase.Activation
                    break
            }
        }
    }
})

// add this for hot reloading
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useGameStateStore, import.meta.hot))
}