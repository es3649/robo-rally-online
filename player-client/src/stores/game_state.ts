import { acceptHMRUpdate, defineStore } from "pinia";
import { GamePhase, ProgrammingCard, STANDARD_DECK } from "@/models/game_data";
import type { RegisterArray, UpgradeCard, GameAction, ProgrammingCardSlot } from "@/models/game_data";
import type { PlayerState } from "@/models/player";

const EMPTY_REGISTERS: RegisterArray = [undefined, undefined, undefined, undefined, undefined]
const PROGRAMMING_HAND_SIZE: number = 9

export const useGameStateStore = defineStore({
    id: "gameState",
    state() {
        return {
            // the programming cards in our hand
            programming_hand: [] as ProgrammingCardSlot[],
            programming_deck: STANDARD_DECK as ProgrammingCard[],
            programming_discard: [] as ProgrammingCard[],
            in_play: [] as ProgrammingCardSlot[],

            // the cards we have programmed
            registers: EMPTY_REGISTERS,
            next_registers: EMPTY_REGISTERS,
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
            // log messages
            log: [] as string[],
            // current action
            action: undefined as GameAction|undefined,
            // the basic states of the opponents
            opponent_states: [{
                name: "Channing", energy: 7, checkpoints: 0, priority: 1, active: true,
            },{
                name: "Michael", energy: 0, checkpoints: 1, priority: 2, active: true,
            },{
                name: "Jamison", energy: 3, checkpoints: 0, priority: 3, active: false,
            }] as PlayerState[]
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
            if (ProgrammingCard.is_haywire(cur.action)) {
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
                    this.shuffleProgrammingDeck()
                case GamePhase.Activation:
                    // go to the upgrade phase
                    this.phase = GamePhase.Upgrade
                    // move any placed haywire into the current registers
                    // then clear the previous registers
                    this.clearRegisters()
                    this.registers = this.next_registers
                    this.next_registers = EMPTY_REGISTERS
                    break
                case GamePhase.Upgrade:
                    this.phase = GamePhase.Programming
                    // draw a new hand
                    this.drawProgrammingHand()
                    break
                case GamePhase.Programming:
                    this.phase = GamePhase.Activation
                    // clear the hand
                    this.clearProgrammingHand()
                    break
            }
        },
        /**
         * draws a new hand of cards, pulling from the programming deck, then the discard if
         * the deck is empty
         */
        drawProgrammingHand(): void {
            // Nothing but spam should be in the hand going into this.
            this.programming_hand = this.programming_hand.filter((card:ProgrammingCardSlot) => {
                return card != undefined && card.action == ProgrammingCard.spam
            })
            // draw up to 9
            while (this.programming_hand.length < PROGRAMMING_HAND_SIZE) {
                // make sure
                if (this.programming_deck.length == 0) {
                                // make the assignment so tht the shuffled discard is now the deck
                    this.programming_deck = this.programming_discard
                    this.programming_discard = []
                    this.shuffleProgrammingDeck()
                }
                const card = this.programming_deck.pop()
                // card should not be undefined
                this.programming_hand.push(card as ProgrammingCard)
            }
            this.programming_hand.sort((a: ProgrammingCardSlot, b:ProgrammingCardSlot): number => {
                if (a === undefined) return -1
                if (b === undefined) return 1
                return a.action < b.action ? -1 : 1
            })
        },
        clearProgrammingHand(): void {
            this.programming_hand.forEach((card:ProgrammingCardSlot, idx:number) => {
                // ignore undefined and spam
                // spam stays, undefined will be filtered later
                if (card === undefined || card.action == ProgrammingCard.spam) {
                    return
                }
                // discard the card
                this.programming_discard.push(card)
                this.programming_hand[idx] = undefined
            })
        },
        /**
         * clear the registers
         */
        clearRegisters(): void {
            this.registers.forEach((card:ProgrammingCardSlot) => {
                // programmed spam and haywire are discarded
                if (card === undefined || card.action == ProgrammingCard.spam || ProgrammingCard.is_haywire(card.action)) {
                    return
                }
                // otherwise discard the card
                this.programming_discard.push(card)
            })
        },
        /** 
         * randomly reorders the programming discard pile, then assigns it as the programming deck
         */
        shuffleProgrammingDeck(): void {
            // do a Fisher-Yates (Knuth) shuffle
            let cur: number = this.programming_deck.length

            // the shuffle algo
            while (cur != 0 ) {
                const random_idx: number = Math.floor(Math.random() * cur)
                cur--

                const tmp = this.programming_deck[cur]
                this.programming_deck[cur] = this.programming_deck[random_idx]
                this.programming_deck[random_idx] = tmp
            }
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

            this.action = {
                action: STANDARD_DECK[Math.floor(Math.random() * STANDARD_DECK.length)],
                actor: {
                    name: 'Jamison',
                    colors: {
                        fill_color: lite,
                        card_color: lite,
                        border_color: dark,
                    }
                }
            }
        }
    }
})

// add this for hot reloading
if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useGameStateStore, import.meta.hot))
}