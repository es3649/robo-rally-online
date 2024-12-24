import { Bluez } from "blauzahn";
import type { CharacterID } from "./models/player"
import type { MovementFrame } from "./game_manager/move_processors";

export namespace BotAction {
    export const FIRE_LASER = "laser"
    export const ERROR_SOUND = "error"
    export const SHUTDOWN = "shutdown"
    export const POWER_UP = "powerup"
}
export type BotAction = typeof BotAction.FIRE_LASER |
    typeof BotAction.ERROR_SOUND |
    typeof BotAction.SHUTDOWN |
    typeof BotAction.POWER_UP

const connections = new Map<CharacterID, any>()

export interface ActionFrame {
    movement: MovementFrame,
    action: BotAction
}

/**
 * initiate or validate bluetooth connection to a robot
 * @param name the name/ID of the bot to connect to
 * @returns true if the bot is connected
 */
export function connectRobot(name: string): boolean {
    console.log(`Attempting bluetooth connection to ${name}`)
    console.warn('NOT IMPLEMENTED')
    return true
}

/**
 * move the identified bot by performing the given movements
 * @param botID the id of the bot to send the command to
 * @param movement the movements the bot should perform
 */
export function setMovement(botID: CharacterID, movement: MovementFrame[]): void {
    console.log(`sending ${movement.length} movements to ${botID}`)
    console.warn('NOT IMPLEMENTED')
}

export function unlatchMovements(): void {
    console.log('unlatching movements')
    console.warn('NOT IMPLEMENTED')
}

export function botAction(botID: CharacterID, action: BotAction): void {
    console.log(`sending ${action} to ${botID}`)
    console.warn('NOT IMPLEMENTED')
}
