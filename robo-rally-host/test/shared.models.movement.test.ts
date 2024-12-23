import { Orientation, Rotation, isAbsoluteMovement, MovementDirection, RotationDirection, isRelativeMovement, isRotation } from "../src/main/models/movement";
import type { AbsoluteMovement, RelativeMovement } from "../src/main/models/movement"
import { expect, test } from '@jest/globals'

test('isAbsoluteMovement/isRelativeMovement/isRotation', () => {
    const absolute: AbsoluteMovement = {
        direction: Orientation.N,
        distance: 1
    }
    const relative: RelativeMovement = {
        direction: MovementDirection.Back,
        distance: 1
    }
    const rotation = new Rotation(RotationDirection.CCW, 1)

    expect(isAbsoluteMovement(undefined)).toBeFalsy()
    expect(isAbsoluteMovement(absolute)).toBeTruthy()
    expect(isAbsoluteMovement(relative)).toBeFalsy()
    expect(isAbsoluteMovement(rotation)).toBeFalsy()
    
    expect(isRelativeMovement(undefined)).toBeFalsy()
    expect(isRelativeMovement(absolute)).toBeFalsy()
    expect(isRelativeMovement(relative)).toBeTruthy()
    expect(isRelativeMovement(rotation)).toBeFalsy()
    
    expect(isRotation(undefined)).toBeFalsy()
    expect(isRotation(absolute)).toBeFalsy()
    expect(isRotation(relative)).toBeFalsy()
    expect(isRotation(rotation)).toBeTruthy()
})

test('Orientation.flip', () => {
    // just do an exhaustive test
    expect(Orientation.flip(Orientation.N)).toBe(Orientation.S)
    expect(Orientation.flip(Orientation.E)).toBe(Orientation.W)
    expect(Orientation.flip(Orientation.S)).toBe(Orientation.N)
    expect(Orientation.flip(Orientation.W)).toBe(Orientation.E)
})

test('Orientation.rotate', () => {
    // units = 0 should be invariant
    expect(Orientation.rotate(Orientation.N, RotationDirection.CCW, 0)).toBe(Orientation.N)
    expect(Orientation.rotate(Orientation.N, RotationDirection.CW, 0)).toBe(Orientation.N)

    // 1 unit
    expect(Orientation.rotate(Orientation.E, RotationDirection.CCW, 1)).toBe(Orientation.N)
    expect(Orientation.rotate(Orientation.E, RotationDirection.CW, 1)).toBe(Orientation.S)

    // 2 should be flip, regardless of direction
    expect(Orientation.rotate(Orientation.W, RotationDirection.CCW, 2)).toBe(Orientation.E)
    expect(Orientation.rotate(Orientation.W, RotationDirection.CW, 2)).toBe(Orientation.E)

    // 3 units and -1 should be the same
    expect(Orientation.rotate(Orientation.W, RotationDirection.CCW, 3)).toBe(Orientation.N)
    expect(Orientation.rotate(Orientation.W, RotationDirection.CCW, -1)).toBe(Orientation.N)
    expect(Orientation.rotate(Orientation.E, RotationDirection.CW, 3)).toBe(Orientation.N)
    expect(Orientation.rotate(Orientation.E, RotationDirection.CW, -1)).toBe(Orientation.N)
})

test('Rotation.equals', () => {
    // reduce should be invariant on "reduced" rotations
    const reduced = new Rotation(RotationDirection.CCW, 1)
    const cw = new Rotation(RotationDirection.CW, 3)

    // static
    expect(Rotation.equals(reduced, reduced)).toBeTruthy()
    expect(Rotation.equals(reduced, cw)).toBeTruthy()
    // member
    expect(reduced.equals(reduced)).toBeTruthy()
    expect(reduced.equals(cw)).toBeTruthy()
    // symmetry
    expect(Rotation.equals(cw, reduced)).toBeTruthy()
    expect(cw.equals(reduced)).toBeTruthy()

    // flips
    const ccw_flip = new Rotation(RotationDirection.CCW, 2)
    const cw_flip = new Rotation(RotationDirection.CW, 2)

    expect(Rotation.equals(ccw_flip, cw_flip)).toBeTruthy()
    expect(ccw_flip.equals(cw_flip)).toBeTruthy()
    
    // invariants
    const none = new Rotation(RotationDirection.CCW, 0)
    const none2 = new Rotation(RotationDirection.CW, 4)

    expect(Rotation.equals(none, none2)).toBeTruthy()
    expect(none.equals(none2)).toBeTruthy()

    // things that should not be equal
    // static
    expect(Rotation.equals(reduced, none)).toBeFalsy()
    expect(Rotation.equals(ccw_flip, none)).toBeFalsy()
    expect(Rotation.equals(ccw_flip, cw)).toBeFalsy()
    // member
    expect(reduced.equals(none)).toBeFalsy()
    expect(ccw_flip.equals(none)).toBeFalsy()
    expect(ccw_flip.equals(cw)).toBeFalsy()
})

test('Rotation.fromOrientation', () => {
    const fromN = Rotation.fromOrientation(Orientation.N)
    const fromW = Rotation.fromOrientation(Orientation.W)
    const fromS = Rotation.fromOrientation(Orientation.S)
    const fromE = Rotation.fromOrientation(Orientation.E)

    expect(fromN.units).toBe(0)
    expect(fromS.units).toBe(2)
    expect(fromE.units).toBe(1)
    expect(fromE.direction).toBe(RotationDirection.CW)
    expect(fromW.units).toBe(1)
    expect(fromW.direction).toBe(RotationDirection.CCW)
})

test('Rotation.reduce', () => {
    const three_step = new Rotation(RotationDirection.CCW, 3)
    
    // 3 units should drop to other direction and 1 unit
    // static
    const ts_reduced = Rotation.reduce(three_step)
    expect(ts_reduced.units).toBe(1)
    expect(ts_reduced.direction).toBe(RotationDirection.CW)    
    // same behavior on member function
    three_step.reduce()
    expect(three_step.units).toBe(1)
    expect(three_step.direction).toBe(RotationDirection.CW)

    // >4 steps should be reduced to 1 step
    const many_steps = new Rotation(RotationDirection.CW, 5)

    // static
    const ms_reduced = Rotation.reduce(many_steps)
    expect(ms_reduced.units).toBe(1)
    expect(ms_reduced.direction).toBe(RotationDirection.CW)

    // member
    many_steps.reduce()
    expect(many_steps.units).toBe(1)
    expect(many_steps.direction).toBe(RotationDirection.CW)

    // one step shouldn't change
    const small_step = new Rotation(RotationDirection.CW, 1)
    const ss_reduced = Rotation.reduce(small_step)

    // static
    expect(ss_reduced.units).toBe(1)
    expect(ss_reduced.direction).toBe(RotationDirection.CW)
    // member
    small_step.reduce()
    expect(small_step.units).toBe(1)
    expect(small_step.direction).toBe(RotationDirection.CW)
})
