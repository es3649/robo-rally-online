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
    export function is_haywire(card:string | Haywire): card is Haywire {
        const h = card as Haywire
        return h.id != undefined && h.text != undefined
    }
    export function get_text(card: ProgrammingCard): string {
        if (is_haywire(card)) {
            return card.text
        }
        switch (card) {
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

export declare interface UpgradeCard {
    name: string,
    cost: number,
    // to implement these, gameplay should probably have hooks, that the upgrades attach to
    // when the hook is reached, we sequentially activate all the upgrades on that hook
    effect_hook: any
    // what the thing actually does
    effect: (game_state:any) => void
}

export declare type ProgrammingCard = "left" | "right" | "u_turn" | "forward1" | "forward2" | "forward3" | "back" | "again" | "power_up" | "spam" | ProgrammingCard.Haywire

export declare type RegisterArray = [ProgrammingCard|undefined, ProgrammingCard|undefined, ProgrammingCard|undefined, ProgrammingCard|undefined, ProgrammingCard|undefined]
export declare type ProgrammingHand = ProgrammingCard[]