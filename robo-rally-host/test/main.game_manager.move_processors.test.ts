import { applyAbsoluteMovement, applyOrientationStep, BoardPosition, OrientedPosition } from "src/main/game_manager/move_processors"
import { AbsoluteMovement, MovementDirection, Orientation, RelativeMovement, Rotation, RotationDirection } from "src/main/models/movement"
import { expect, jest, test } from '@jest/globals'

test('applyOrientationStep', () => {
    const init: BoardPosition = {x: 0, y: 0}

    // exhaustive test on one input isn't too bad
    const step_N = applyOrientationStep(init, Orientation.N)
    expect(step_N.x).toBe(0)
    expect(step_N.y).toBe(1)
    const step_E = applyOrientationStep(init, Orientation.E)
    expect(step_E.x).toBe(1)
    expect(step_E.y).toBe(0)
    const step_S = applyOrientationStep(init, Orientation.S)
    expect(step_S.x).toBe(0)
    expect(step_S.y).toBe(-1)
    const step_W = applyOrientationStep(init, Orientation.W)
    expect(step_W.x).toBe(-1)
    expect(step_W.y).toBe(0)
})

test('applyAbsoluteMovement', () => {
    const init: BoardPosition = {x: 0, y: 0}

    // test boundary distances
    const step_N0 = applyAbsoluteMovement(init, { direction: Orientation.N, distance: 0})
    expect(step_N0.x).toBe(0)
    expect(step_N0.y).toBe(0)
    const step_negN = applyAbsoluteMovement(init, { direction: Orientation.N, distance: -1})
    expect(step_negN.x).toBe(0)
    expect(step_negN.y).toBe(-1)

    // test each direction
    const step_N = applyAbsoluteMovement(init, { direction: Orientation.N, distance: 1})
    expect(step_N.x).toBe(0)
    expect(step_N.y).toBe(1)
    const step_E = applyAbsoluteMovement(init, { direction: Orientation.E, distance: 1})
    expect(step_E.x).toBe(1)
    expect(step_E.y).toBe(0)
    const step_S = applyAbsoluteMovement(init, { direction: Orientation.S, distance: 1})
    expect(step_S.x).toBe(0)
    expect(step_S.y).toBe(-1)
    const step_W = applyAbsoluteMovement(init, { direction: Orientation.W, distance: 1})
    expect(step_W.x).toBe(-1)
    expect(step_W.y).toBe(0)
})

// test('OrientedPosition.applyMovement', () => {
//     const init: OrientedPosition = {x: 0, y: 0, orientation: Orientation.N}

//     const trueHook = jest.fn((pos: OrientedPosition) => {
//         return true
//     })

//     const abs: AbsoluteMovement = {
//         direction: Orientation.N,
//         distance: 2
//     }
//     const rot: Rotation = new Rotation(RotationDirection.CCW, 2)
//     const rel: RelativeMovement = {
//         direction: MovementDirection.Right,
//         distance: 3
//     }

//     const one = OrientedPosition.applyMovement(init, abs, trueHook)

//     // moved two steps north, facing not changed
//     expect(one.x).toBe(0)
//     expect(one.y).toBe(2)
//     expect(one.orientation).toBe(Orientation.N)

//     const two = OrientedPosition.applyMovement(one, rot, trueHook)

//     // should have turned about
//     expect(two.x).toBe(0)
//     expect(two.y).toBe(2)
//     expect(two.orientation).toBe(Orientation.S)
    
//     const three = OrientedPosition.applyMovement(two, rel, trueHook)
    
//     // should have moved 3 spaces to -x without changing facing
//     expect(three.x).toBe(-3)
//     expect(three.y).toBe(2)
//     expect(three.orientation).toBe(Orientation.S)

//     expect(trueHook).toBeCalledTimes(5)
// })

// test('OrientedPosition.applyMovement (hook-halt)', () => {
//     const init: OrientedPosition = {x: 0, y: 0, orientation: Orientation.N}

//     const falseHook = jest.fn((pos: OrientedPosition) => {
//         return false
//     })

//     const abs: AbsoluteMovement = {
//         direction: Orientation.N,
//         distance: 2
//     }
//     const rot: Rotation = new Rotation(RotationDirection.CCW, 2)
//     const rel: RelativeMovement = {
//         direction: MovementDirection.Right,
//         distance: 3
//     }

//     const one = OrientedPosition.applyMovement(init, abs, falseHook)

//     // moved two steps north, facing not changed
//     expect(one.x).toBe(0)
//     expect(one.y).toBe(1)
//     expect(one.orientation).toBe(Orientation.N)

//     const two = OrientedPosition.applyMovement(one, rot, falseHook)

//     // should have turned about
//     expect(two.x).toBe(0)
//     expect(two.y).toBe(1)
//     expect(two.orientation).toBe(Orientation.S)
    
//     const three = OrientedPosition.applyMovement(two, rel, falseHook)
    
//     // should have moved 3 spaces to -x without changing facing
//     expect(three.x).toBe(-1)
//     expect(three.y).toBe(1)
//     expect(three.orientation).toBe(Orientation.S)

//     expect(falseHook).toBeCalledTimes(2)
// })

// test('OrientedPosition.applyMovements', () => {
//     const init: OrientedPosition = {x: 0, y: 0, orientation: Orientation.N}

//     const trueHook = jest.fn((pos: OrientedPosition) => {
//         return true
//     })

//     // define movements to take
//     const abs: AbsoluteMovement = {
//         direction: Orientation.N,
//         distance: 2
//     }
//     const rot: Rotation = new Rotation(RotationDirection.CCW, 2)
//     const rel: RelativeMovement = {
//         direction: MovementDirection.Right,
//         distance: 3
//     }

//     const movements = [abs, rot, rel]

//     const result = OrientedPosition.applyMovements(init, movements, trueHook)
//     expect(result.x).toBe(-3)
//     expect(result.y).toBe(2)
//     expect(result.orientation).toBe(Orientation.S)

//     // once for each step taken
//     expect(trueHook).toBeCalledTimes(5)
// })