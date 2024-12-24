import { isAbsoluteMovement, isRelativeMovement, isRotation, MovementDirection, Orientation, Rotation, RotationDirection } from "../models/movement"
import type { AbsoluteMovement, Movement } from "../models/movement"

/**
 * These are the types of movements we want to deal with here
 */
export type NonRelativeMovement = (AbsoluteMovement | Rotation)

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
 * an extension of the rotation class which represents a single, 90-degree turn
 */
export class Turn extends Rotation {
    constructor(direction: RotationDirection) {
        super(direction, 1)
    }
}

/**
 * an absolute movement which 
 */
export type AbsoluteStep = {
    direction: Orientation,
    distance: 1
}

export enum MovementStatus {
    WALL,
    PIT,
    OK
}

export type MovementResult = {
    movement: MovementFrame
    status: MovementStatus
    pushed?: boolean
}

/**
 * steps the position by one step in the direction indicate by the orientation
 * @param position the starting position
 * @param orientation the orientation in which to step the position
 */
export function applyOrientationStep<T extends BoardPosition>(pos: T, orientation: Orientation): T {
    let x = pos.x
    let y = pos.y
    switch (orientation) {
        case Orientation.N:
            y += 1
            break
        case Orientation.E:
            x += 1
            break
        case Orientation.S:
            y -= 1
            break
        case Orientation.W:
            x -= 1
            break
    }
    // return the items to the result, only modifying x and y
    return {...pos, x: x, y: y}
}

/**
 * gets the effect of an absolute movement on a position, returning the updated position
 * @param pos the starting position
 * @param movement the movement to apply
 * @returns the resulting position
 */
export function applyAbsoluteMovement<T extends BoardPosition>(pos: T, movement: AbsoluteMovement): T {
    let ret_pos = pos
    let direction = movement.direction
    let distance = movement.distance

    // handle negative distances
    if (distance < 0) {
        distance *= -1
        direction = Orientation.flip(direction)
    }
    // just step 
    for (let i = 0; i < distance; i++) {
        ret_pos = applyOrientationStep(ret_pos, direction)
    }
    return ret_pos
}

/**
 * Applies the given rotation to the given position, computing the result
 * @param pos the starting position
 * @param rotation the rotation to apply
 * @returns the resulting position
 */
export function applyRotation(pos: OrientedPosition, rotation: Rotation): OrientedPosition {
    return {
        x: pos.x,
        y: pos.y,
        orientation: Orientation.rotate(pos.orientation, rotation.direction, rotation.units)
    }
}

/**
 * We need to store the actions which will be sent over bluetooth, but they need to be
 * synchronized in a specific way. We need to be able to send a SINGLE movement (one rotation
 * or one step of movement), and these all need to be activated simultaneously. If one bot is 
 * not sent an action, or if a collection of actions are sent at once for one actor, we need
 * to reconcile the action frames to make sure that the synchronization of the movements is
 * correct and makes sense
 */
export type MovementFrame = Turn|AbsoluteStep|undefined
export namespace MovementFrame {
    /**
     * converts a non-relative movement to an equivalent array of MovementFrames
     * @param movement the movement to convert
     * @returns an array of MovementFrames
     */
    export function fromNonRelativeMovement(movement: NonRelativeMovement): MovementFrame[] {
        const framed: MovementFrame[] = []
        if (isAbsoluteMovement(movement)) {
            for (let i = 0; i < movement.distance; i++) {
                // if movement is an 
                framed.push({
                    direction: movement.direction,
                    distance: 1
                })
            }
        } else if (isRotation(movement)) {
            for (let i = 0; i < movement.units; i++) {
                framed.push(new Turn(movement.direction))
            }
        }
        return framed
    }

    /**
     * converts a single movement to an array of action frames
     * @param movement the movement to convert to frames
     */
    export function fromMovement(movement: Movement, orientation: Orientation): MovementFrame[] {
        const framed: MovementFrame[] = []
        // translate absolute movement: this is easiest
        if (isRelativeMovement(movement)) {
            var o: Orientation
            switch (movement.direction) {
                case MovementDirection.Forward:
                    o = orientation
                    break
                case MovementDirection.Right:
                    o = Orientation.rotate(orientation, RotationDirection.CW)
                    break
                case MovementDirection.Back:
                    o = Orientation.rotate(orientation, RotationDirection.CW, 2)
                    break
                case MovementDirection.Left:
                    o = Orientation.rotate(orientation, RotationDirection.CCW)
                    break
            }
            for (let i = 0; i < movement.distance; i++) {
                framed.push({
                    direction: o,
                    distance: 1
                })
            }
            return framed
        }

        // leave this to the other function
        return fromNonRelativeMovement(movement)
    }

    /**
     * converts a list of absolute movements or rotations to MovementFrames
     * @param movements the list of rotations or absolute movements to convert
     * @returns the converted movements
     */
    export function fromNonRelativeMovements(movements: NonRelativeMovement[]): MovementFrame[] {
        const converted: MovementFrame[] = []
        for (const movement of movements) {
            converted.concat(fromNonRelativeMovement(movement))
        }
        return converted
    }

    /**
     * pad the values of a map to the same length
     * @param moves a map of any kay to movement frame arrays
     * @returns the same map, but each value is guaranteed to have the same length
     */
    export function pad<T>(moves: Map<T, MovementFrame[]>): Map<T, MovementFrame[]> {
        let max_len = 0
        for (const movements of moves.values()) {
            // get the max movement for padding
            if (movements.length > max_len) {
                max_len = movements.length
            }
        }

        // pad the lists
        for (const movements of moves.values()) {
            while (movements.length < max_len) {
                movements.push(undefined)
            }
        }

        return moves
    }
}

/**
 * this is a simple object which holds the start and end of something
 */
type MovementBoundary = {
    start: number,
    end: number
}

export class MovementArray {
    public frames: MovementFrame[]
    public movement_boundaries: MovementBoundary[]

    static fromMovements(movements: Movement|Movement[], starting_orientation: Orientation): MovementArray {
        // initialize the property arrays
        let movement_boundaries = []
        let frames: MovementFrame[] = []
        // make movements an array if it isn't
        if (!Array.isArray(movements)) {
            movements = [movements]
        }
        // count the number of frames we've seen
        let frame_count = 0
        for (const move of movements) {
            const start = frame_count
            // convert the movement to frames
            const new_frames = MovementFrame.fromMovement(move, starting_orientation)
            // update the new number of frames we have
            frame_count += new_frames.length
            // point the start to the first new frame, and the end to the last new frame
            movement_boundaries.push({
                start: start,
                end: frame_count
            })
            // add the new frames to our internal listing
            new_frames.forEach((value: MovementFrame) => frames.push(value))
        }

        return new MovementArray(frames, movement_boundaries)
    }

    static blankOfSameSize(other: MovementArray) {
        let frames: MovementFrame[] = []
        while (frames.length < other.frames.length) {
            frames.push(undefined)
        }
        // slice created a deep copy
        return new MovementArray(frames, other.movement_boundaries.slice())
    }

    protected constructor(frames: MovementFrame[], boundaries: MovementBoundary[]) {
        this.frames = frames
        this.movement_boundaries = boundaries
    }

    get length(): number {
        return this.frames.length
    }
}

export class MovementArrayWithResults extends MovementArray {
    public results: MovementStatus[]
    public pushed: boolean[]

    static fromSingleFrame(frame: MovementFrame, result: MovementStatus=MovementStatus.OK, pushed: boolean=false) {
        return new MovementArrayWithResults([frame],
            [{start:0, end: 1}],
            [result],
            [pushed]
        )
    }

    constructor(frames: MovementFrame[], bounds: MovementBoundary[], results: MovementStatus[], pushed: boolean[]) {
        super(frames, bounds)
        this.results = results
        this.pushed = pushed
    }
}

/**
 * a builder class for MovementArrayWithResults
 */
export class MovementArrayResultsBuilder {
    protected frames: MovementFrame[] = []
    protected movement_boundaries: MovementBoundary[] = []
    protected cur_movement_start: number = 0
    protected results: MovementStatus[] = []
    protected pushed: boolean[] = []
    
    constructor () {}
    
    addFrame(frame: MovementFrame, status: MovementStatus, pushed: boolean) {
        this.frames.push(frame)
        this.results.push(status)
        this.pushed.push(pushed)
    }
    
    endMovement() {
        // set the end of the movement by pushing the boundary
        this.movement_boundaries.push({
            start: this.cur_movement_start,
            end: this.frames.length
        })
        // reset the start of the current movement
        this.cur_movement_start = this.frames.length
    }

    padMovementToLength(length: number) {
        while (this.frames.length - this.cur_movement_start < length) {
            this.frames.push(undefined)
            this.results.push(MovementStatus.OK)
            this.pushed.push(false)
        }
    }
    
    finish() {
        if (this.cur_movement_start != this.frames.length) {
            this.endMovement()
        }
        
        return new MovementArrayWithResults(this.frames, this.movement_boundaries, this.results, this.pushed)
    }
}