import { isAbsoluteMovement, isRelativeMovement, isRotation, MovementDirection, Orientation, Rotation, RotationDirection } from "../models/movement"
import type { AbsoluteMovement, Movement } from "../models/movement"

// this is an orientation-agnostic position on the board. the Oriented position extends it
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
    export function fromNonRelativeMovement(movement: AbsoluteMovement | Rotation): MovementFrame[] {
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
}

/**
 * this is a simple object which holds the start and end of something
 */
type MovementBoundary = {
    start: number,
    end: number
}

export class MovementArrayWithResults {
    public frames: MovementFrame[]
    public movement_boundaries: MovementBoundary[]
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
        this.frames = frames
        this.movement_boundaries = bounds
        this.results = results
        this.pushed = pushed
    }

    get length(): number {
        return this.frames.length
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

export class MovementMapBuilder<Key> {
    private working = new Map<Key, MovementArrayResultsBuilder>()
    private len = 0

    constructor() {}

    /**
     * appends a map of movement results to the internal map. I't like concatenating a map of arrays
     * by key, so that each array gets extended by the array in the second map with the corresponding
     * key. Padding is taken into account as well, so that if new keys appear, they will be padded out
     * as far as the previous entries are long
     * @param moves the movements to append to the builder
     * @returns true if all movements added ended with OK status, false othwerise
     */
    appendMovements(moves: Map<Key, MovementResult[]>): boolean {
        let all_ok = true
        let max_len = 0

        // get the max length of the moves in this batch so we know haw far to pad
        for (const frames of moves.values()) {
            if (frames.length > max_len) {
                max_len = frames.length
            }
        }

        for (const [key, frames] of moves.entries()) {
            // get the builder for this key
            let builder = this.working.get(key)

            // if there's nothing, no need to log
            if (frames.length == 0) {
                // unless we already have something, then pad out to length
                if (builder !== undefined) {
                    builder.padMovementToLength(max_len)
                }
                continue
            }
            
            // if there is no builder, create one and pad it out
            if (builder === undefined) {
                builder = new MovementArrayResultsBuilder()
                builder.padMovementToLength(this.len)
                this.working.set(key, builder)
            }

            // add the frame to the builder
            for (const frame of frames) {
                // add the frame to the builder
                builder.addFrame(frame.movement, frame.status, !!frame.pushed)
                if (frame.status !== MovementStatus.OK) {
                    all_ok = false
                }
            }

            // pad out the result builder
            builder.padMovementToLength(max_len)
        }
        
        this.len += max_len
        
        // pad out any that didn't have additions this call
        for (const [key, builder] of this.working.entries()) {
            if (!moves.has(key)) {
                // pad out the movement
                builder.padMovementToLength(this.len)
            }
        }
        
        return all_ok
    }

    finish(): Map<Key, MovementArrayWithResults> {
        const ret = new Map<Key, MovementArrayWithResults>()

        // finish each of hte builders
        for (const [key, builder] of this.working.entries()) {
            ret.set(key, builder.finish())
        }

        return ret
    }
}
