import { isRotation, Orientation, RotationDirection } from "../models/movement";
import type { PlayerID } from "../models/player";
import type { MovementFrame } from "./move_processors";

export namespace BotState {
    export const FIRE_LASER = 1
    export const DEFAULT = 2
    export const SHUTDOWN = 3
    export const GET_POSITION = 4
}
export type BotState = typeof BotState.FIRE_LASER |
    typeof BotState.DEFAULT |
    typeof BotState.SHUTDOWN |
    typeof BotState.GET_POSITION

export namespace BotMovement {
    export const NONE = 0
    export const MOVE_FORWARD = 1
    export const MOVE_BACK = 2
    export const MOVE_LEFT = 3
    export const MOVE_RIGHT = 4
    export const TURN_LEFT = 5
    export const TURN_RIGHT = 6

    /**
     * Converts a movement frame to a BotMovement. BotMovements are relative movements, and
     * MovementFrames may be absolute movements, so we require a reference orientation to
     * decode an absolute back into a relative
     * @param frame the action frame to convert
     * @param actor_orientation the orientation of the actor which will be performing the movement
     * @returns the BotMovement value which corresponds to the action of this movement
     */
    export function fromFrame(frame: MovementFrame, actor_orientation: Orientation): BotMovement {
        if (frame === undefined) {
            return NONE
        }

        // if it's a rotation, handle that
        if (isRotation(frame)) {
            // empty rotation is no movement
            if (frame.units === 0) {
                return NONE
            }

            // a CCW rotation is a left turn, otherwise it's a right turn
            return frame.direction === RotationDirection.CCW ? TURN_LEFT : TURN_RIGHT
 
        }

        // it's an AbsoluteMovement
        let working = actor_orientation
        // rotate the working direction around, and when we find a match, return a movement in that
        // direction
        if (working === frame.direction) {
            return MOVE_FORWARD
        }
        working = Orientation.rotate(working, RotationDirection.CW)
        if (working === frame.direction) {
            return MOVE_RIGHT
        }
        working = Orientation.rotate(working, RotationDirection.CW)
        if (working === frame.direction) {
            return MOVE_BACK
        }
        // this is the only available option now
        return MOVE_LEFT
    }
}
export type BotMovement = typeof BotMovement.NONE |
    typeof BotMovement.MOVE_FORWARD |
    typeof BotMovement.MOVE_BACK |
    typeof BotMovement.MOVE_LEFT |
    typeof BotMovement.MOVE_RIGHT |
    typeof BotMovement.TURN_LEFT |
    typeof BotMovement.TURN_RIGHT

export interface ActionFrame {
    pre_action?: any
    movement?: BotMovement,
    end_state?: BotState
}

export namespace ActionFrame {
    export function isEmpty(frame: ActionFrame): boolean {
        return frame.pre_action === undefined &&
            frame.movement === undefined &&
            frame.end_state === undefined
    }
}

export interface MovementExecutor {
    setAction: (player_id: PlayerID, action: ActionFrame) => void|Promise<void>
    unlatchActions: () => void|Promise<void>
    setMode: (player_id: PlayerID, mode: BotState) => void|Promise<void>
    getPosition: (player_id: PlayerID, callback: (position_id: string) => void) => void|Promise<void>
    positionSet: (player_id: PlayerID) => void|Promise<void>
}