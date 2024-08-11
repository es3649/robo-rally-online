/**
 * the orientation of an object on the board, or board element
 */
export namespace Orientation {
    export const N = "N"  // upright
    export const E = "E"  // rotated 90-degrees CW
    export const S = "S"  // rotated 180 degrees
    export const W = "W"   // rotated 90-degrees CCW
    export function rotate(o:Orientation, dir: RotationDirection): Orientation {
        if (dir == RotationDirection.CW) {
            switch (o) {
                case N:
                    return E
                case E:
                    return S
                case S:
                    return W
                case W:
                    return N
            }
        } /* else RotationDirection == CCW */
        switch (o) {
            case N:
                return W
            case E:
                return N
            case S:
                return E
            case W:
                return S
        }
    }
}
export type Orientation = "N" | "E" | "S" | "W"

export type BoardPosition = {
    x: number,
    y: number
}

/**
 * the position of a robot on the board, with its orientation data
 */
export type RobotPosition = {
    pos: BoardPosition
    orientation: Orientation
}

/**
 * the directions in which one can rotate
 */
export enum RotationDirection {
    CW,
    CCW
}

/**
 * specifies a rotation. It requires a direction, and a number of units, that is the number of times
 * to rotate 90 degrees in that direction
 */
export class Rotation {
    public direction: RotationDirection
    public units: number

    constructor(direction: RotationDirection, units: number) {
        this.direction = direction
        this.units = units
    }

    reduce(): void {
        const tmp = Rotation.reduce(this)
        this.direction = tmp.direction
        this.units = tmp.units
    }

    equals(other: Rotation): boolean {
        return Rotation.equals(this, other)
    }
}

export namespace Rotation {
    export function fromOrientation(o: Orientation): Rotation {
        switch (o) {
            case Orientation.N:
                return new Rotation(RotationDirection.CW, 0)
            case Orientation.E:
                return new Rotation(RotationDirection.CW, 1)
            case Orientation.S:
                return new Rotation(RotationDirection.CW, 2)
            case Orientation.W:
                return new Rotation(RotationDirection.CCW, 1)
        }
    }
    
    export function reduce(r: Rotation): Rotation {
        let units = r.units % 4
        let dir = r.direction
        if (units > 2) {
            // swap the rotation direction
            units = 4 - units
            dir = dir === RotationDirection.CW ? RotationDirection.CCW : RotationDirection.CW
        }
        // return
        return new Rotation(units, dir)
    }

    export function equals(r1: Rotation, r2: Rotation): boolean {
        const r1r = reduce(r1)
        const r2r = reduce(r2)
        if (r1r.units === r2r.units) {
            // if they are a 0 or 180 degrees, then they are the same regardless of direction
            if (r1r.units % 2 === 0) return true
            // then units == 1, check direction
            return r1r.direction == r2r.direction

        }
        // units will be in {0, 1, 2}
        return false
    }
}

/**
 * the directions a movement can be in
 */
export enum MovementDirection {
    Forward,
    Right,
    Left,
    Back
}

/**
 * a movement of a robot relative to its orientation
 */
export type RelativeMovement = {
    direction: MovementDirection,
    distance: number
}

/**
 * a movement of a robot relative to the board (usually when forcibly moved)
 */
export type AbsoluteMovement = {
    direction: Orientation,
    distance: number
}

/**
 * defines a list of movements or rotations to be taken sequentially
 */
export type MotionArray = (RelativeMovement | AbsoluteMovement | Rotation)[]