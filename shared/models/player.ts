export namespace Color {
    export type Set = {
        fill_color: string,
        border_color: string
    }

    export const RED: Set = { fill_color: "#faa", border_color: "#a55"}
    export const ORANGE: Set = { fill_color: "#fca", border_color: "#a75"}
    export const YELLOW: Set = { fill_color: "#ffa", border_color: "#aa5"}
    export const GREEN: Set = { fill_color: "#afa", border_color: "#5a5"}
    export const BLUE: Set = { fill_color: "#aaf", border_color: "#55a"}
    export const PURPLE: Set = { fill_color: "#faf", border_color: "#a5a"}
    export const WHITE: Set = { fill_color: "#eee", border_color: "#999"}
    export const GRAY: Set = { fill_color: "#999", border_color: "#444"}
    export const BLACK: Set = { fill_color: "#444", border_color: "#000"}
    export const PINK: Set = { fill_color: "#fcc", border_color: "#a77"}
    // export const BROWN: Set = { fill_color: ""}
    
    export function by_number(num:number): Set {
        switch (num){
            case 0:
                return RED
            case 1: 
                return ORANGE
            case 2:
                return YELLOW
            case 3:
                return GREEN
            case 4:
                return BLUE
            case 5:
                return PURPLE
            default:
                return WHITE
        }
    }
}

export declare type CharacterID = string

export type Character = {
    readonly name: string,
    readonly id: CharacterID,
    readonly sprite_small: string,
    readonly sprite_large: string,
    readonly color: Color.Set
    readonly bluetooth_id: string
}

export declare type PlayerName = string
export declare type PlayerID = string

export type PartialPlayer = {
    name: PlayerName,
    id: PlayerID,
    character?: Character,
}
export type Player = Required<PartialPlayer>

export type PlayerStateData = {
    priority: number
    name: PlayerName
    checkpoints: number
    active: boolean
    energy: number
}

export class PlayerState implements PlayerStateData {
    priority: number
    readonly name: PlayerName
    energy: number
    checkpoints: number
    active: boolean
    static readonly MAX_ENERGY: number = 10
    static readonly STARTING_ENERGY: number = 3

    constructor (name: PlayerName, priority: number) {
        this.name = name
        this.priority = priority

        // fill in defaults
        this.energy = PlayerState.STARTING_ENERGY
        this.checkpoints = 0
        this.active = true
    }

    gainEnergy(count: number): void {
        this.energy = Math.min(this.energy + count, PlayerState.MAX_ENERGY)
    }

    spendEnergy(count:number): void {
        this.energy = Math.max(this.energy - count, 0)
    }

    /**
     * prepares a data-only copy of the PlayerState 
     * @returns the data-only copy
     */
    asData(): PlayerStateData {
        return {
            priority: this.priority,
            name: this.name,
            checkpoints: this.checkpoints,
            active: this.active,
            energy: this.energy
        }
    }
}

export type WinnerData = {
    name: PlayerName,
    character: Character
}
