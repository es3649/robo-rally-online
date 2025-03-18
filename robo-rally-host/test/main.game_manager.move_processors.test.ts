import { applyAbsoluteMovement, applyOrientationStep, applyRotation, BoardPosition, MovementArrayResultsBuilder, MovementArrayWithResults, MovementFrame, MovementMapBuilder, MovementResult, MovementStatus, OrientedPosition, Turn, type AbsoluteStep } from "../src/main/game_manager/move_processors"
import { AbsoluteMovement, isAbsoluteMovement, isRotation, MovementDirection, Orientation, RelativeMovement, Rotation, RotationDirection } from "../src/shared/models/movement"
import { expect, test } from '@jest/globals'

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

test('applyRotation', () => {
    const pos: OrientedPosition = {x:0, y:0, orientation: Orientation.N}
    const pos2: OrientedPosition = {x:3, y:-3, orientation: Orientation.S}
    
    const rotation1 = new Rotation(RotationDirection.CCW, 2)
    const res1 = applyRotation(pos, rotation1)
    expect(res1.x).toBe(0)
    expect(res1.y).toBe(0)
    expect(res1.orientation).toBe(Orientation.S)
    
    const rotation2 = new Rotation(RotationDirection.CW, 1)
    const res2 = applyRotation(pos, rotation2)
    expect(res2.x).toBe(0)
    expect(res2.y).toBe(0)
    expect(res2.orientation).toBe(Orientation.E)
    
    const rotation3 = new Rotation(RotationDirection.CW, 0)
    const res3 = applyRotation(pos, rotation3)
    expect(res3.x).toBe(0)
    expect(res3.y).toBe(0)
    expect(res3.orientation).toBe(Orientation.N)
    
    const turn1 = new Turn(RotationDirection.CCW)
    const res4 = applyRotation(pos2, turn1)
    expect(res4.x).toBe(3)
    expect(res4.y).toBe(-3)
    expect(res4.orientation).toBe(Orientation.E)
})

test('MovementFrame.fromMovement', () => {
    // convert a single rotation
    const rotation = new Rotation(RotationDirection.CW, 2)
    const rotation_res = MovementFrame.fromMovement(rotation, Orientation.N)
    expect(rotation_res.length).toBeDefined()
    expect(rotation_res.length).toBe(2)
    expect(rotation_res[0]).toBeInstanceOf(Turn)
    expect(rotation_res[0].direction).toBe(RotationDirection.CW)
    expect(rotation_res[1]).toBeInstanceOf(Turn)
    expect(rotation_res[1].direction).toBe(RotationDirection.CW)
    
    // convert a relative movement
    const relative: RelativeMovement = {
        direction: MovementDirection.Left,
        distance: 2
    }
    const relative_res = MovementFrame.fromMovement(relative, Orientation.N)
    expect(relative_res.length).toBeDefined()
    expect(relative_res.length).toBe(2)
    expect(isAbsoluteMovement(relative_res[0])).toBeTruthy()
    expect(relative_res[0].direction).toBe(Orientation.W)
    expect((relative_res[0] as AbsoluteMovement).distance).toBe(1)
    expect(isAbsoluteMovement(relative_res[1])).toBeTruthy()
    expect(relative_res[1].direction).toBe(Orientation.W)
    expect((relative_res[1] as AbsoluteMovement).distance).toBe(1)

    const relative_2: RelativeMovement = {
        direction: MovementDirection.Back,
        distance: 1
    }
    const relative_2_res = MovementFrame.fromMovement(relative_2, Orientation.E)
    expect(relative_2_res.length).toBeDefined()
    expect(relative_2_res.length).toBe(1)
    expect(isAbsoluteMovement(relative_2_res[0])).toBeTruthy()
    expect(relative_2_res[0].direction).toBe(Orientation.W)
    expect((relative_2_res[0] as AbsoluteMovement).distance).toBe(1)

    // convert an absolute movement
    const absolute: AbsoluteMovement = {
        direction: Orientation.S,
        distance: 3
    }
    const absolute_res = MovementFrame.fromMovement(absolute, Orientation.N)
    expect(absolute_res.length).toBeDefined()
    expect(absolute_res.length).toBe(3)
    expect(isAbsoluteMovement(absolute_res[0])).toBeTruthy()
    expect(absolute_res[0].direction).toBe(Orientation.S)
    expect((absolute_res[0] as AbsoluteMovement).distance).toBe(1)
    expect(isAbsoluteMovement(absolute_res[1])).toBeTruthy()
    expect(absolute_res[1].direction).toBe(Orientation.S)
    expect((absolute_res[1] as AbsoluteMovement).distance).toBe(1)
    expect(isAbsoluteMovement(absolute_res[2])).toBeTruthy()
    expect(absolute_res[2].direction).toBe(Orientation.S)
    expect((absolute_res[2] as AbsoluteMovement).distance).toBe(1)
})

test('MovementFrame.fromNonRelativeMovement', () => {
    // convert a single rotation
    const rotation = new Rotation(RotationDirection.CW, 2)
    const rotation_res = MovementFrame.fromNonRelativeMovement(rotation)
    expect(rotation_res.length).toBeDefined()
    expect(rotation_res.length).toBe(2)
    expect(rotation_res[0]).toBeInstanceOf(Turn)
    expect(rotation_res[0].direction).toBe(RotationDirection.CW)
    expect(rotation_res[1]).toBeInstanceOf(Turn)
    expect(rotation_res[1].direction).toBe(RotationDirection.CW)

    // convert an absolute movement
    const absolute: AbsoluteMovement = {
        direction: Orientation.S,
        distance: 3
    }
    const absolute_res = MovementFrame.fromNonRelativeMovement(absolute)
    expect(absolute_res.length).toBeDefined()
    expect(absolute_res.length).toBe(3)
    expect(isAbsoluteMovement(absolute_res[0])).toBeTruthy()
    expect(absolute_res[0].direction).toBe(Orientation.S)
    expect((absolute_res[0] as AbsoluteMovement).distance).toBe(1)
    expect(isAbsoluteMovement(absolute_res[1])).toBeTruthy()
    expect(absolute_res[1].direction).toBe(Orientation.S)
    expect((absolute_res[1] as AbsoluteMovement).distance).toBe(1)
    expect(isAbsoluteMovement(absolute_res[2])).toBeTruthy()
    expect(absolute_res[2].direction).toBe(Orientation.S)
    expect((absolute_res[2] as AbsoluteMovement).distance).toBe(1)
}) 

test('MovementArrayWithResults.fromSingleFrame', () => {
    // check default behavior as well
    const undef = MovementArrayWithResults.fromSingleFrame(undefined)
    expect(undef.frames.length).toBe(1)
    expect(undef.frames[0]).toBeUndefined()
    expect(undef.movement_boundaries.length).toBe(1)
    expect(undef.movement_boundaries[0].start).toBe(0)
    expect(undef.movement_boundaries[0].end).toBe(1)
    expect(undef.pushed.length).toBe(1)
    expect(undef.pushed[0]).toBeFalsy()

    const rotation = MovementArrayWithResults.fromSingleFrame(new Turn(RotationDirection.CW))
    expect(rotation.frames.length).toBe(1)
    expect(isRotation(rotation.frames[0])).toBeTruthy()
    expect(rotation.frames[0].direction).toBe(RotationDirection.CW)
    expect(rotation.movement_boundaries.length).toBe(1)
    expect(rotation.movement_boundaries[0].start).toBe(0)
    expect(rotation.movement_boundaries[0].end).toBe(1)
    expect(rotation.pushed.length).toBe(1)
    expect(rotation.pushed[0]).toBeFalsy()

    const step = MovementArrayWithResults.fromSingleFrame({direction: Orientation.S, distance: 1})
    expect(step.frames.length).toBe(1)
    expect(isAbsoluteMovement(step.frames[0])).toBeTruthy()
    expect(step.frames[0].direction).toBe(Orientation.S)
    expect(step.movement_boundaries.length).toBe(1)
    expect(step.movement_boundaries[0].start).toBe(0)
    expect(step.movement_boundaries[0].end).toBe(1)
    expect(step.pushed.length).toBe(1)
    expect(step.pushed[0]).toBeFalsy()
})

test('MovementArrayWithResults.constructor', () => {
    const turn = new Turn(RotationDirection.CCW)
    const step: AbsoluteStep = {direction: Orientation.S, distance: 1}
    const frames = [turn, step]
    const arr = new MovementArrayWithResults(frames, [{
        start: 0,
        end: 1
    },{
        start: 1,
        end:2
    }], [MovementStatus.OK, MovementStatus.PIT], [false, true])

    expect(arr).toBeDefined()
    expect(arr.frames).toEqual(frames)

    expect(arr.movement_boundaries.length).toBeDefined()
    expect(arr.movement_boundaries[0].start).toBe(0)
    expect(arr.movement_boundaries[0].end).toBe(1)
    expect(arr.movement_boundaries[1].start).toBe(1)
    expect(arr.movement_boundaries[1].end).toBe(2)

    expect(arr.results.length).toBeDefined()
    expect(arr.results.length).toBe(2)
    expect(arr.results[0]).toBe(MovementStatus.OK)
    expect(arr.results[1]).toBe(MovementStatus.PIT)

    expect(arr.pushed.length).toBeDefined()
    expect(arr.pushed.length).toBe(2)
    expect(arr.pushed[0]).toBeFalsy()
    expect(arr.pushed[1]).toBeTruthy()
})

test('MovementArrayWithResults.length', () => {
    const empty = new MovementArrayWithResults([], [], [], [])
    expect(empty.frames.length).toBe(0)
    expect(empty.length).toBe(0)

    const single = MovementArrayWithResults.fromSingleFrame(new Turn(RotationDirection.CCW))
    expect(single.frames.length).toBe(1)
    expect(single.length).toBe(1)

    const builder = new MovementArrayResultsBuilder()
    builder.padMovementToLength(10)
    const ten_len = builder.finish()
    expect(ten_len.frames.length).toBe(10)
    expect(ten_len.length).toBe(10)
})

test('MovementArrayResultsBuilder.addFrame', () => {
    const builder = new MovementArrayResultsBuilder()

    const turn = new Turn(RotationDirection.CCW)
    const step: AbsoluteStep = {direction: Orientation.W, distance: 1}

    builder.addFrame(turn, MovementStatus.OK, false)
    builder.addFrame(step, MovementStatus.WALL, true)
    builder.addFrame(step, MovementStatus.WALL, false)
    builder.addFrame(step, MovementStatus.PIT, true)

    const arr = builder.finish()
    expect(arr).toBeDefined()
    expect(arr.frames).toBeDefined()
    expect(arr.frames.length).toBeDefined()
    expect(arr.frames.length).toBe(4)
    expect(arr.frames[0]).toEqual(turn)
    expect(arr.frames[1]).toEqual(step)
    expect(arr.frames[2]).toEqual(step)
    expect(arr.frames[3]).toEqual(step)

    // more on this in later tests
    expect(arr.movement_boundaries).toBeDefined()

    expect(arr.results).toBeDefined()
    expect(arr.results.length).toBeDefined()
    expect(arr.results.length).toBe(4)
    expect(arr.results[0]).toBe(MovementStatus.OK)
    expect(arr.results[1]).toBe(MovementStatus.WALL)
    expect(arr.results[2]).toBe(MovementStatus.WALL)
    expect(arr.results[3]).toBe(MovementStatus.PIT)

    expect(arr.pushed).toBeDefined()
    expect(arr.pushed.length).toBeDefined()
    expect(arr.pushed.length).toBe(4)
    expect(arr.pushed[0]).toBeFalsy()
    expect(arr.pushed[1]).toBeTruthy()
    expect(arr.pushed[2]).toBeFalsy()
    expect(arr.pushed[3]).toBeTruthy()
})

test('MovementArrayResultsBuilder.endMovement', () => {
    const builder = new MovementArrayResultsBuilder()

    const turn = new Turn(RotationDirection.CCW)
    const step: AbsoluteStep = {direction: Orientation.W, distance: 1}

    builder.addFrame(turn, MovementStatus.OK, false)
    builder.endMovement()
    builder.addFrame(step, MovementStatus.WALL, true)
    builder.addFrame(step, MovementStatus.WALL, false)
    builder.addFrame(step, MovementStatus.PIT, true)
    builder.endMovement()

    const arr = builder.finish()
    expect(arr).toBeDefined()
    expect(arr.movement_boundaries).toBeDefined()
    expect(arr.movement_boundaries.length).toBeDefined()
    expect(arr.movement_boundaries.length).toBe(2)
    expect(arr.movement_boundaries[0].start).toBe(0)
    expect(arr.movement_boundaries[0].end).toBe(1)
    expect(arr.movement_boundaries[1].start).toBe(1)
    expect(arr.movement_boundaries[1].end).toBe(4)
})

test('MovementArrayResultsBuilder.padMovementToLength', () => {
    const builder = new MovementArrayResultsBuilder()

    const turn = new Turn(RotationDirection.CCW)

    builder.padMovementToLength(2)
    builder.endMovement()
    builder.addFrame(turn, MovementStatus.OK, false)
    builder.padMovementToLength(2)
    builder.endMovement()

    const arr = builder.finish()

    expect(arr).toBeDefined()
    expect(arr.frames).toBeDefined()
    expect(arr.frames.length).toBeDefined()
    expect(arr.frames.length).toBe(4)
    expect(arr.results).toBeDefined()
    expect(arr.results.length).toBeDefined()
    expect(arr.results.length).toBe(4)
    expect(arr.pushed).toBeDefined()
    expect(arr.pushed.length).toBeDefined()
    expect(arr.pushed.length).toBe(4)

    // check the frame contents
    for (let i = 0; i < 4; i++) {
        expect(arr.results[i]).toBe(MovementStatus.OK)
        expect(arr.pushed[i]).toBeFalsy()

        if (i == 2) {
            expect(arr.frames[i]).toEqual(turn)
        } else {
            expect(arr.frames[i]).toBeUndefined()
        }
    }

    // check the movement boundaries
    expect(arr.movement_boundaries).toBeDefined()
    expect(arr.movement_boundaries.length).toBeDefined()
    expect(arr.movement_boundaries.length).toBe(2)
    expect(arr.movement_boundaries[0].start).toBe(0)
    expect(arr.movement_boundaries[0].end).toBe(2)
    expect(arr.movement_boundaries[1].start).toBe(2)
    expect(arr.movement_boundaries[1].end).toBe(4)
})

test('MovementResultsBuilder.finish', () => {
    // mostly just check that finish ends the current movement correctly
    const builder = new MovementArrayResultsBuilder()

    const turn = new Turn(RotationDirection.CCW)

    builder.padMovementToLength(2)
    builder.endMovement()
    builder.addFrame(turn, MovementStatus.OK, false)
    builder.padMovementToLength(2)
    
    const arr1 = builder.finish()
    expect(arr1).toBeDefined()
    expect(arr1.movement_boundaries).toBeDefined()
    expect(arr1.movement_boundaries.length).toBeDefined()
    expect(arr1.movement_boundaries.length).toBe(2)

    const builder2 = new MovementArrayResultsBuilder()
    builder2.padMovementToLength(2)
    builder2.endMovement()
    builder2.addFrame(turn, MovementStatus.OK, false)
    builder2.padMovementToLength(2)
    builder2.endMovement()
    const arr2 = builder.finish()
    expect(arr2).toBeDefined()
    expect(arr2.movement_boundaries).toBeDefined()
    expect(arr2.movement_boundaries.length).toBeDefined()
    expect(arr2.movement_boundaries.length).toBe(2)

    // equality check
    expect(arr1.movement_boundaries).toEqual(arr2.movement_boundaries)
})

test('MovementMapBuilder', () => {
    const builder = new MovementMapBuilder<string>()

    const movements1 = new Map<string, MovementResult[]>()
    movements1.set('first', [
        {movement: {direction: Orientation.N, distance: 1}, status: MovementStatus.OK}
    ])
    movements1.set('second', [
        {movement: {direction: Orientation.W, distance:1}, status: MovementStatus.OK},
        {movement: new Turn(RotationDirection.CCW), status: MovementStatus.OK},
    ])
    
    const ok1 = builder.appendMovements(movements1)
    expect(ok1).toBeTruthy()
    
    const movements2 = new Map<string, MovementResult[]>()
    movements2.set('first', [])
    movements2.set('third', [
        {movement: new Turn(RotationDirection.CCW), status: MovementStatus.OK},
    ])
    movements2.set('fourth', [])

    const ok2 = builder.appendMovements(movements2)
    expect(ok2).toBeTruthy()

    const movements3 = new Map<string, MovementResult[]>()
    movements3.set('second', [
        {movement: {direction: Orientation.W, distance: 1}, status: MovementStatus.PIT}
    ])
    movements3.set('third', [
        {movement: {direction: Orientation.W, distance:1}, status: MovementStatus.OK}
    ])

    const ok3 = builder.appendMovements(movements3)
    expect(ok3).toBeFalsy()

    const complete = builder.finish()
    expect(complete).toBeDefined()
    expect(complete.size).toBe(3)
    const first = complete.get('first')
    expect(first).toBeDefined()
    expect(first.length).toBe(4)

    const second = complete.get('second')
    expect(second).toBeDefined()
    expect(first.length).toBe(4)

    const third = complete.get('third')
    expect(third).toBeDefined()
    expect(first.length).toBe(4)
    // the fact that the movements and everything are correct should follow from the
    // correctness of MovementArrayResultsBuilder
})

// NOTE we may be able to remove the movement_boundaries concept from the MovementArrays
// I think it's mostly unused, and we are breaking up movements using loops over a literal
// array of movements