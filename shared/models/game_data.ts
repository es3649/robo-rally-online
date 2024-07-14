import type { Player } from "./player"

export declare type GameAction = {
    action: ProgrammingCard,
    actor: Player
}

export enum GamePhase {
    Lobby = -1,
    Upgrade = 0,
    Programming = 1,
    Activation = 2
}

export namespace ProgrammingCard {
    export const left = "left"
    export const right = "right"
    export const u_turn = "u_turn"
    export const forward1 = "forward1"
    export const forward2 = "forward2"
    export const forward3 = "forward3"
    export const back = "back"
    export const again = "again"
    export const power_up = "power_up"
    export const spam = "spam"
    export declare interface Haywire {
        text: string,
        id: number,
        // to implement this guy, we may need access to a lot of data
        effect: (game_state:any) => void
    }
    export function is_haywire(card:string|undefined|Haywire): card is Haywire {
        const h = card as Haywire
        return h.id != undefined && h.text != undefined
    }
    export function get_text(action: CardAction): string {
        if (is_haywire(action)) {
            return action.text
        }
        switch (action) {
            case left:
                return "Turn Left"
            case right:
                return "Turn Right"
            case u_turn:
                return "U-Turn"
            case forward1:
                return "Move Forward 1"
            case forward2:
                return "Move Forward 2"
            case forward3:
                return "Move Forward 3"
            case back:
                return "Move Back"
            case again:
                return "Again"
            case power_up:
                return "Power Up"
            case spam:
                return "Replace this card with the top card of your programming deck" 
        }
    }
}
export declare type CardAction = "left" | "right" | "u_turn" | "forward1" | "forward2" | "forward3" | "back" | "again" | "power_up" | "spam" | ProgrammingCard.Haywire
export declare type ProgrammingCard = {
    id: number,
    action: CardAction
}

export declare interface UpgradeCard {
    name: string,
    cost: number,
    // to implement these, gameplay should probably have hooks, that the upgrades attach to
    // when the hook is reached, we sequentially activate all the upgrades on that hook
    effect_hook: any
    // what the thing actually does
    effect: (game_state:any) => void
}

// This is annoying, but here's the data for a standard deck
export function newStandardDeck(): ProgrammingCard[] {
    return [
        {
            action: 'left', 
            id: 0
        },{
            action: 'left', 
            id: 1
        },{
            action: 'left', 
            id: 2
        },{
            action: 'left',
            id: 3
        },{
            action: 'right', 
            id: 4
        },{
            action: 'right', 
            id: 5
        },{
            action: 'right', 
            id: 6
        },{
            action: 'right',
            id: 7
        },{
            action: 'forward1', 
            id: 8
        },{
            action: 'forward1',
            id: 9
        },{
            action: 'forward1',
            id: 10
        },{
            action: 'forward1',
            id: 11
        },{
            action: 'forward2', 
            id: 12
        },{
            action: 'forward2',
            id: 13
        },{
            action: 'forward2',
            id: 14
        },{
            action: 'forward3',
            id: 15
        },{
            action: 'back',
            id: 16
        },{
            action: 'u_turn',
            id: 17
        },{
            action: 'again',
            id: 18
        },{
            action: 'power_up',
            id: 19
        }
    ]
}

export declare type ProgrammingHand = ProgrammingCard[]
export declare type ProgrammingCardSlot = ProgrammingCard|undefined
// export declare type RegisterArray = [ProgrammingCardSlot, ProgrammingCardSlot, ProgrammingCardSlot, ProgrammingCardSlot, ProgrammingCardSlot]
export declare type RegisterArray = [ProgrammingCard[], ProgrammingCard[], ProgrammingCard[], ProgrammingCard[], ProgrammingCard[]]

export function newRegisterArray(): RegisterArray {
    return [[], [], [], [], []]
}


/**
 * Check whether a RegisterArray contains any empty slots
 * @param arr an array of ProgrammingCardSlots to check
 * @returns true if any element is undefined
 */
export function anyRegisterEmpty(arr:RegisterArray): boolean {
    /**
     * reduces an array to determine if any element is undefined
     * @param prev the value after the previous iteration
     * @param cur the current array element
     * @param idx the current index
     * @param arr the parent array
     * @returns true if the prev is true or if the current value is undefined
     */
    const anyUndefinedReducer = (prev:boolean, cur:ProgrammingCard[], idx:number, arr:ProgrammingCard[][]): boolean => {
        // return prev || cur === undefined
        return prev || cur.length === 0
    }
    return arr.reduce<boolean>(anyUndefinedReducer, false)
}