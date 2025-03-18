import { newStandardDeck, ProgrammingCard, PROGRAMMING_HAND_SIZE, type ProgrammingCardSlot, type RegisterArray } from "../../shared/models/game_data";

export class DeckManager {
    private hand = [] as ProgrammingCardSlot[]
    private deck = [] as ProgrammingCard[]
    private discard_pile = [] as ProgrammingCard[]

    constructor(deck?: ProgrammingCard[]) {
        if (deck === undefined) {
            this.deck = newStandardDeck()
        } else {
            this.deck = deck
        }
        this.shuffleDeck()
    }

    /**
     * performs an in-place shuffle of the deck.
     */
    shuffleDeck(): void {
        // do a Fisher-Yates (Knuth) shuffle
        let cur: number = this.deck.length

        // the shuffle algo
        while (cur != 0 ) {
            const random_idx: number = Math.floor(Math.random() * cur)
            cur--

            // swap
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
        // shuffle the discard into the deck
        if (this.deck.length == 0) {
            this.deck = this.discard_pile
            this.discard_pile = []
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
            this.discard_pile.push(card)
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

    getHand(): ProgrammingCardSlot[] {
        return this.hand
    }

    /**
     * clears damage cards programmed in this program
     * TODO: this cannot be used to discard cards from the program. It will cause card duplication. It should
     * be used to clear damage cards from the hand
     * @param program the program to clear
     * @return damager cards that need to be discarded
     */
    clearProgram(program: RegisterArray): ProgrammingCard[] {
        const damage_cards: ProgrammingCard[] = []
        program.forEach((register: ProgrammingCard[]) => {
            // programmed spam and haywire are discarded
            if (register.length == 0) {
                return
            } else if (register[0].action == ProgrammingCard.spam || ProgrammingCard.isHaywire(register[0].action)) {
                // return the damage to the damage deck
                damage_cards.push(register[0])
            }
            // otherwise discard the card(s)
            register.forEach((card: ProgrammingCard) => {
                this.discard_pile.push(card)
            })
        })

        return damage_cards
    }

    discard(card: ProgrammingCard): void {
        this.discard_pile.push(card)
    }
}