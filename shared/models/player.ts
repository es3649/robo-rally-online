import type { ConnectionDetails } from "./connection"

export namespace Color {
    export declare type Set = {
        card_color: string,
        fill_color: string,
        border_color: string
    }

    export const RED = {}
    export const ORANGE = {}
    export const YELLOW = {}
    export const GREEN = {}
    export const BLUE = {}
    export const PURPLE = {}
    export const WHITE = {}
    export const GRAY = {}
    export const BLACK = {}
    export const PINK = {}
    export const BROWN = {}
}

export declare type Character = {
    name: string,
    sprite_small: string,
    sprite_large: string,
}

export declare type Player = {
    name: string,
    character?: Character,
    conn?: undefined,
    conn_details?: ConnectionDetails,
    colors?: Color.Set
}