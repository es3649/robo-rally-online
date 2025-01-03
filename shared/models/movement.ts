/**
 * the orientation of an object on the board, or board element
 */
export namespace Orientation {
    export const N = "N"  // upright
    export const E = "E"  // rotated 90-degrees CW
    export const S = "S"  // rotated 180 degrees
    export const W = "W"   // rotated 90-degrees CCW
    /**
     * rotates the given orientation exactly 90 degrees in the given direction
     * @param o the starting orientation
     * @param dir the direction of rotation
     * @returns the rotation of the given orientation in the given direction
     */
    function _rotate(o:Orientation, dir: RotationDirection): Orientation {
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

    export function flip(o: Orientation): Orientation {
        switch (o) {
            case N:
                return S
            case E:
                return W
            case S:
                return N
            case W:
                return E
        }
    }
    /**
     * rotates an orientation in the given direction by units (default 1) multiples of 90-degrees
     * @param o the starting orientation
     * @param dir the direction of rotation
     * @param units the number of times to perform the rotation (default 1)
     * @returns the resulting orientation
     */
    export function rotate(o: Orientation, dir: RotationDirection, units:number=1): Orientation {
        switch (((units % 4) + 4) % 4) {
            case 0:
                // 0 rotations, no-op
                return o
            case 1:
                // rotate once
                return _rotate(o, dir)
            case 2:
                // 2 rotations is flip
                return flip(o)
            case 3:
                // 3 rotations is one rotation the other way
                return _rotate(o, dir == RotationDirection.CW ? RotationDirection.CCW : RotationDirection.CW)
            default:
                // if this ever happens, we have bigger problem to worry about
                throw new Error(`BREAKING NEWS: This just in, apparently ${units} % 4 is greater than 3! The entire meaning of the modulo operator has come into question. Experts believe that...[Continue reading]`)
        }
    }
    /**
     * gets a pseudorandom orientation
     * @returns a random orientation
     */
    export function random(): Orientation {
        switch (Math.floor(Math.random()*4)) {
            case 0:
                return N
            case 1:
                return E
            case 2:
                return S
            default:
                return W
        }
    }
}
export type Orientation = "N" | "E" | "S" | "W"

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

    /**
     * 
     */
    reduce(): void {
        const tmp = Rotation.reduce(this)
        this.direction = tmp.direction
        this.units = tmp.units
    }

    /**
     * Checks if the results of this and the other rotation are equal
     * @param other a different rotation object
     * @returns true if the result of both rotations is the same
     */
    equals(other: Rotation): boolean {
        return Rotation.equals(this, other)
    }

    /**
     * creates a new rotation describing the rotation from North to the given orientation.
     * @param o the orientation to turn to
     * @returns the new rotation
     */
    static fromOrientation(o: Orientation): Rotation {
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
    
    /**
     * reduce an orientation to a canonical format where units <= 2.
     * If units % 2 == 0 the initial direction is used, so it's not *completely* canonical, but direction
     * isn't important for these rotations anyway
     * @param r the rotation object to reduce
     * @returns the reduced rotation
     */
    static reduce(r: Rotation): Rotation {
        let units = ((r.units % 4) + 4) % 4 // js has a bug with mods of negative numbers
        let dir: RotationDirection = r.direction
        if (units > 2) {
            // swap the rotation direction
            units = 4 - units
            dir = dir === RotationDirection.CW ? RotationDirection.CCW : RotationDirection.CW
        }
        // return
        return new Rotation(dir, units)
    }

    /**
     * checks if the resulting rotations by r1 and r2 are equivalent
     * @param r1 the first Rotation
     * @param r2 the second Rotation
     * @returns true of the two rotations are effectively equal
     */
    static equals(r1: Rotation, r2: Rotation): boolean {
        const r1r = Rotation.reduce(r1)
        const r2r = Rotation.reduce(r2)
        // units will be in {0, 1, 2} post-reduction
        if (r1r.units === r2r.units) {
            // if they are a 0 or 180 degrees, then they are the same regardless of direction
            if (r1r.units % 2 === 0) return true
            // then units == 1, check direction
            return r1r.direction == r2r.direction

        }
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
export interface RelativeMovement {
    direction: MovementDirection,
    distance: number
}

/**
 * a movement of a robot relative to the board (usually when forcibly moved)
 * these movements are orientation agnostic
 */
export interface AbsoluteMovement {
    direction: Orientation,
    distance: number
}

/**
 * defines a list of movements or rotations to be taken sequentially
 */
export type Movement = (RelativeMovement | AbsoluteMovement | Rotation)

/**
 * Test if an object is an AbsoluteMovement
 * @param mv the object to test
 * @returns is the object an AbsoluteMovement
 */
export function isAbsoluteMovement(mv: any): mv is AbsoluteMovement {
    if (mv !== undefined &&
        mv.direction !== undefined &&
        [Orientation.N, Orientation.E, Orientation.S, Orientation.W].includes(mv.direction) &&
        mv.distance !== undefined
    ) {
        return true
    }
    return false
}

/**
 * Test if an object is a RelativeMovement
 * @param mv the object to test
 * @returns is the object a RelativeMovement
 */
export function isRelativeMovement(mv: any): mv is RelativeMovement {
    if (mv !== undefined &&
        mv.direction !== undefined &&
        mv.direction in [MovementDirection.Back, MovementDirection.Forward, MovementDirection.Left, MovementDirection.Right]
        && mv.units === undefined
    ) {
        return true
    }
    return false
}

/**
 * Test if an object is a Rotation
 * @param mv the object to test
 * @returns is the object a Rotation
 */
export function isRotation(mv: any): mv is Rotation {
    if (mv !== undefined &&
        mv.direction !== undefined &&
        mv.direction in [RotationDirection.CW, RotationDirection.CCW] &&
        mv.units !== undefined
    ) {
        return true
    }
    return false
}

/**
 * checks whether the movement is an effective no-op, meaning a 0-degree rotation, or a movement
 * of 0 units
 * @param mv the movement to check
 * @returns whether or not the movement is a no-op
 */
export function isNoOp(mv: Movement|undefined): boolean {
    return (
        (mv === undefined) ||
        (isRotation(mv) && (mv.units % 4) == 0) ||
        (!isRotation(mv) && mv.distance == 0)
    )
}
