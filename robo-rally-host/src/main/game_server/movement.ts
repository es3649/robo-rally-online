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
        switch (units % 4) {
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
                throw new Error(`BREAKING NEWS: This just in, apparently ${units} % 4 is greater than 3! The entire meaning of the modulo operator has come into question. Experts believe that...`)
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

export interface BoardPosition {
    x: number,
    y: number
}

/**
 * an oriented board position: that is, both a position and a facing
 */
export interface OrientedPosition extends BoardPosition {
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
export type RelativeMovement = {
    direction: MovementDirection,
    distance: number
}

/**
 * a movement of a robot relative to the board (usually when forcibly moved)
 * these movements are orientation agnostic
 */
export type AbsoluteMovement = {
    direction: Orientation,
    distance: number
}

/**
 * defines a list of movements or rotations to be taken sequentially
 */
export type Movement = (RelativeMovement | AbsoluteMovement | Rotation)
export type MovementArray = Movement[]

/**
 * Test if an object is an AbsoluteMovement
 * @param mv the object to test
 * @returns is the object an AbsoluteMovement
 */
function isAbsoluteMovement(mv: any): mv is AbsoluteMovement {
    if (mv.direction !== undefined &&
        mv.direction in [Orientation.N, Orientation.E, Orientation.S, Orientation.W] &&
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
function isRelativeMovement(mv: any): mv is RelativeMovement {
    if (mv.direction !== undefined &&
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
function isRotation(mv: any): mv is Rotation {
    if (mv.direction !== undefined &&
        mv.direction in [RotationDirection.CW, RotationDirection.CCW] &&
        mv.units !== undefined
    ) {
        return true
    }
    return false
}

/**
 * operations related to an OrientedPosition. We put them in a namespace because I wanted to leave
 * OrientedPosition as an interface, not a class
 */
export namespace OrientedPosition {
    /**
     * performs a single step of an absolute movement
     * @param pos the starting position
     * @param dir the direction in which to move one space
     * @returns the resulting position after moving exactly one space as specified
     */
    function moveAbsolutely(pos: OrientedPosition, dir: Orientation): OrientedPosition {
        switch (dir) {
            case Orientation.N:
                pos.y += 1
                break
            case Orientation.E:
                pos.x += 1
                break
            case Orientation.S:
                pos.y -= 1
                break
            case Orientation.W:
                pos.x -= 1
                break
        }
        return pos
    }

    /**
     * applies a movement object to the position
     * @param pos the starting position
     * @param mv the movement to perform
     * @param hook a hook to be called after each step of movement. If it returns false, movement is interrupted
     * @returns the resulting position after applying all movements, or after halting with the hook
     */
    export function apply_movement(pos: OrientedPosition, mv: Movement, hook:(pos: OrientedPosition) => boolean = (pos) => true): OrientedPosition {
        if (isRotation(mv)) {
            pos.orientation = Orientation.rotate(pos.orientation, mv.direction, mv.units)
        } else if (isAbsoluteMovement(mv)) {
            let mvmt = mv.distance
            while (mvmt > 0) {
                // perform the movement
                pos = moveAbsolutely(pos, mv.direction)
                if (!hook(pos)) {
                    return pos
                }
                mvmt -= 1
            }
        } else if (isRelativeMovement(mv)) {
            let mvmt = mv.distance
            // convert the relative movement direction to an absolute one
            let o: Orientation
            switch (mv.direction) {
                case MovementDirection.Forward:
                    o = pos.orientation
                    break
                case MovementDirection.Right:
                    o = Orientation.rotate(pos.orientation, RotationDirection.CW)
                    break
                case MovementDirection.Back:
                    o = Orientation.rotate(pos.orientation, RotationDirection.CW, 2)
                    break
                case MovementDirection.Left:
                    o = Orientation.rotate(pos.orientation, RotationDirection.CCW)
                    break
            }
            while (mvmt > 0) {
                pos = moveAbsolutely(pos, o)
                if (!hook(pos)) {
                    return pos
                }
                mvmt -= 1
            }
            return pos
        }
        console.error(mv)
        throw new Error("Given Movement object was not recognized as a type")
    }

    /**
     * 
     * @param pos the starting position before movements are applied
     * @param mvs the list of movements to take
     * @param hook a hook which is called after each single square of movement. If it returns false at any time,
     * movement is stopped
     * @returns the resulting position after all movements are applied
     */
    export function apply_movements(pos: OrientedPosition, mvs: MovementArray, hook: (pos: OrientedPosition) => boolean = (pos) => true): OrientedPosition {
        for (const mv of mvs) {
            var hook_ret: boolean = true
            // nest in a hook
            pos = apply_movement(pos, mv, (p) => {
                hook_ret = hook(p)
                return hook_ret
            })
            if (!hook_ret) {
                return pos
            }
        }
        return pos
    }
}