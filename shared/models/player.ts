import type { ConnectionDetails } from "./connection"

export declare type Character = {
    name: string,
    sprite_small: string,
    sprite_large: string,
}

export declare type Player = {
    name: string,
    character?: Character,
    conn?: undefined
    conn_details?: ConnectionDetails
}