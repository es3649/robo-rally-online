import { newStandardDeck, ProgrammingCard, type ProgrammingCardSlot, type RegisterArray } from "../models/game_data";

const PROGRAMMING_HAND_SIZE: number = 9

export class DeckManager {
    private hand = [] as ProgrammingCardSlot[]
    private deck = [] as ProgrammingCard[]
    private discard = [] as ProgrammingCard[]

    constructor() {
        this.deck = newStandardDeck()
        this.shuffleDeck()
    }

    shuffleDeck(): void {
        // do a Fisher-Yates (Knuth) shuffle
        let cur: number = this.deck.length

        // the shuffle algo
        while (cur != 0 ) {
            const random_idx: number = Math.floor(Math.random() * cur)
            cur--

            const tmp = this.deck[cur]
            this.deck[cur] = this.deck[random_idx]
            this.deck[random_idx] = tmp
        }
    }

    /**
     * draws a single card from the programming deck, making sure to shuffle the discard into the
     * deck if the deck is empty. This is the only way the deck should be accessed
     * @returns the top card from the programming deck
     */
    drawCard(): ProgrammingCard {
        // shuffle the discard into the 
        if (this.deck.length == 0) {
            this.deck = this.discard
            this.discard = []
            this.shuffleDeck()
        }
        // this should never be undefined
        return (this.deck.pop() as ProgrammingCard)
    }

    /**
     * draws a new hand, storing it in this.hand
     * clearHand should be called first to be sure that cards are preserved
     */
    drawHand(): void {
        this.hand.forEach((card: ProgrammingCardSlot, idx: number) => {
            // leave undefined cards and spam
            if (card === undefined || card.action == ProgrammingCard.spam) {
                return
            }
            // discard the card and remove from hand
            this.discard.push(card)
            this.hand[idx] = undefined
        })

        // remove all undefined and non-spam cards from the hand
        this.hand = this.hand.filter((card: ProgrammingCardSlot) => {
            return card != undefined && card.action == ProgrammingCard.spam
        })

        // draw up to 9
        while (this.hand.length < PROGRAMMING_HAND_SIZE) {
            this.hand.push(this.drawCard())
        }

        // sort the remaining cards. People like this
        this.hand.sort((a: ProgrammingCardSlot, b: ProgrammingCardSlot): number => {
            if (a === undefined) return -1
            if (b === undefined) return 1
            return a.action < b.action ? -1 : 1
        })
    }

    clearProgram(program: RegisterArray): void {
        program.forEach((register: ProgrammingCard[]) => {
            // programmed spam and haywire are discarded
            if (register.length == 0 || register[0].action == ProgrammingCard.spam || ProgrammingCard.is_haywire(register[0].action)) {
                return
                // TODO, haywire should be returned to the deck, I think
            }
            // otherwise discard the card(s)
            register.forEach((card: ProgrammingCard) => {
                this.discard.push(card)
            })
        })
    }
}