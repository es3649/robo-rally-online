import type { BotAction } from "../bluetooth";
import type { MovementFrame } from "../game_manager/move_processors";
import type { CharacterID } from "../models/player";

export type MoveBotCall = {
    botID: CharacterID,
    movement: MovementFrame
}

export type BotActionCall = {
    botID: CharacterID,
    action: BotAction
}

export const moveBot_calls: MoveBotCall[] = []
export const connectRobot_calls: string[] = []
export const botAction_calls: BotActionCall[] = []

export let connectRobot_return = true

export function connectRobot(name: string): boolean {
    connectRobot_calls.push(name)
    return connectRobot_return
}

export function moveBot(botID: CharacterID, movement: MovementFrame): void {
    moveBot_calls.push({
        botID: botID,
        movement: movement
    })
}

export function botAction(botID: CharacterID, action: BotAction): void {
    botAction_calls.push({
        botID: botID,
        action: action
    })
}