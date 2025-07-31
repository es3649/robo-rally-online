import { Color, type Character, type CharacterID } from '../models/player'

/**
 * The bluetooth IDs here need to be filled in with bluetooth device IDs pulled
 * from the individual Arduino Nano 33 BLE Rev 2 devices
 */

/**
{"name":"Sample","id":"test123","sprite_small":"#","sprite_large":"#","color":{"border_color":"#a55","fill_color":"#faa"},"bluetooth_id":"blootoototoototooto"}
 */

export namespace Robots {
    export const Twonky: Character = {
        name: "Twonky",
        id: "54d22876-a38f-2344-a235-placeholder",
        sprite_small: "res://bots/twonky_sm.svg",
        sprite_large: "#",
        color: Color.ORANGE,
        bluetooth_id: "54d22876-a38f-2344-a235-placeholder"
    }

    export const PanzerX90: Character = {
        name: "Panzer-X90",
        id: "6f4a8a84-46a4-4d08-bf55-placeholder",
        sprite_small: "res://bots/panzer-x90_sm.svg",
        sprite_large: "#",
        color: Color.RED,
        // this is the MAC address of my blue board
        bluetooth_id: "3e:da:6a:9f:e9:89"
    }
    
    export const Bladestorm: Character = {
        name: "Bladestorm",
        id: "b0558c89-dfec-475f-b321-placeholder",
        sprite_small: "res://bots/bladestorm_sm.svg",
        sprite_large: "#",
        color: Color.BLUE,
        bluetooth_id: "b0558c89-dfec-475f-b321-placeholder"
    }
    
    export const ZephyrM2: Character = {
        name: "Zephyr (Mark II)",
        id: "987d24f3-27cf-4efd-b21b-placeholder",
        sprite_small: "res://bots/zephyr-mII_sm.svg",
        sprite_large: "#",
        color: Color.WHITE,
        bluetooth_id: "987d24f3-27cf-4efd-b21b-placeholder"
    }
    
    export const AxelV8: Character = {
        name: "Axel-V8",
        id: "fb7520b5-f44a-4d29-9099-placeholder",
        sprite_small: "res://bots/axel-v8_sm.svg",
        sprite_large: "#",
        color: Color.GREEN,
        // this is the MAC address of my teal board
        bluetooth_id: "51:6c:07:a1:69:b1"
    }
    
    export const Thor: Character = {
        name: "Thor",
        id: "b2719258-7425-4f76-9b0a-placeholder",
        sprite_small: "res://bots/thor_sm.svg",
        sprite_large: "#",
        color: Color.YELLOW,
        bluetooth_id: "b2719258-7425-4f76-9b0a-placeholder"
    }
}

export const BOTS: Character[] = [Robots.Twonky, Robots.PanzerX90, Robots.AxelV8, Robots.Bladestorm, Robots.ZephyrM2, Robots.Thor]

// create and populate a BOTS ma
export const BOTS_MAP = new Map<CharacterID, Character>()
BOTS.forEach((character: Character) => {
    BOTS_MAP.set(character.id, character)
})
