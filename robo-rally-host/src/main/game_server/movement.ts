/**
 * the orientation of an object on the board, or board element
 */
export namespace Orientation {
    export const N = "N"  // upright
    export const E = "E"  // rotated 90-degrees CW
    export const S = "S"  // rotated 180 degrees
    export const W = "W"   // rotated 90-degrees CCW
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
export type Rotation = {
    direction: RotationDirection,
    units: number
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