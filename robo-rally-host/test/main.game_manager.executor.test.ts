import { expect, test } from '@jest/globals'
import { ActionFrame, BotMovement, BotState } from '../src/main/game_manager/executor'
import { Turn } from '../src/main/game_manager/move_processors'
import { Orientation, Rotation, RotationDirection } from '../src/main/models/movement'

test('BotMovement.fromFrame', () => {
    expect(BotMovement.fromFrame({direction: Orientation.N, distance: 1}, Orientation.N)).toBe(BotMovement.MOVE_FORWARD)
    expect(BotMovement.fromFrame({direction: Orientation.S, distance: 1}, Orientation.N)).toBe(BotMovement.MOVE_BACK)
    expect(BotMovement.fromFrame({direction: Orientation.W, distance: 1}, Orientation.N)).toBe(BotMovement.MOVE_LEFT)
    expect(BotMovement.fromFrame({direction: Orientation.E, distance: 1}, Orientation.N)).toBe(BotMovement.MOVE_RIGHT)

    expect(BotMovement.fromFrame({direction: Orientation.N, distance: 1}, Orientation.E)).toBe(BotMovement.MOVE_LEFT)
    expect(BotMovement.fromFrame({direction: Orientation.S, distance: 1}, Orientation.E)).toBe(BotMovement.MOVE_RIGHT)
    expect(BotMovement.fromFrame({direction: Orientation.W, distance: 1}, Orientation.E)).toBe(BotMovement.MOVE_BACK)
    expect(BotMovement.fromFrame({direction: Orientation.E, distance: 1}, Orientation.E)).toBe(BotMovement.MOVE_FORWARD)
    
    expect(BotMovement.fromFrame(undefined, Orientation.N)).toBe(BotMovement.NONE)
    
    expect(BotMovement.fromFrame(new Turn(RotationDirection.CCW), Orientation.N)).toBe(BotMovement.TURN_LEFT)
    expect(BotMovement.fromFrame(new Turn(RotationDirection.CW), Orientation.N)).toBe(BotMovement.TURN_RIGHT)
    expect(BotMovement.fromFrame(new Rotation(RotationDirection.CW, 0), Orientation.N)).toBe(BotMovement.NONE)

    expect(BotMovement.fromFrame(new Turn(RotationDirection.CCW), Orientation.W)).toBe(BotMovement.TURN_LEFT)
    expect(BotMovement.fromFrame(new Turn(RotationDirection.CW), Orientation.W)).toBe(BotMovement.TURN_RIGHT)
})

test('ActionFrame.isEmpty', () => {
    expect(ActionFrame.isEmpty({})).toBeTruthy()

    // this is especially important
    expect(ActionFrame.isEmpty({movement: BotMovement.NONE})).toBeFalsy()

    expect(ActionFrame.isEmpty({end_state: BotState.FIRE_LASER})).toBeFalsy()
    expect(ActionFrame.isEmpty({movement: BotMovement.MOVE_LEFT, end_state: BotState.SHUTDOWN})).toBeFalsy()
    // pre_action type/behavior isn't defined yet
    expect(ActionFrame.isEmpty({pre_action: "play_sound"})).toBeFalsy()
})