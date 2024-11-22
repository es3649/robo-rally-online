import { Bluez } from "blauzahn";
import type { Movement, MovementArray } from "./models/movement";
import type { CharacterID } from "./models/player"

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

/**
 * We need to store the actions which will be sent over bluetooth, but they need to be
 * synchronized in a specific way. We need to be able to send a SINGLE movement (one rotation
 * or one step of movement), and these all need to be activated simultaneously. If one bot is 
 * not sent an action, or if a collection of actions are sent at once for one actor, we need
 * to reconcile the action frames to make sure that the synchronization of the movements is
 * correct and sensical
 */
export type ActionFrame = {
    movement: Movement,
    action: BotAction 
}

const connections = new Map<CharacterID, any>()

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
export function setMovement(botID: CharacterID, movement: MovementArray): void {
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
