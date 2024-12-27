import { Orientation, RotationDirection, Rotation, isAbsoluteMovement, isRotation } from "../models/movement"
import type { PlayerID } from "../models/player"
import { DualKeyMap, MovementForest } from "./graph"
import { applyOrientationStep, MovementArrayResultsBuilder, MovementArrayWithResults, MovementFrame, MovementStatus, Turn, type BoardPosition, type MovementResult, type OrientedPosition } from "./move_processors"

const BOARD_SIZE = 12

/**
 * The different types of spaces on a board
 */
export namespace SpaceType {
    export const CONVEYOR_F = "conv_F"     // conveyor goes straight
    export const CONVEYOR_L = "conv_L"     // conveyor turns to the left
    export const CONVEYOR_R = "conv_R"     // conveyor turns to the right
    export const CONVEYOR_RF = "conv_RF"    // conveyor comes in from straight and right
    export const CONVEYOR_LF = "conv_LF"    // conveyor comes in from left and straight
    export const CONVEYOR_LR = "conv_LR"    // conveyor comes in from left and straight
    export const CONVEYOR_LRF = "conv_LRF"   // conveyor comes in from all 3 directions
    export const CONVEYOR2_F = "conv2_F"    // save as above, blue conveyors
    export const CONVEYOR2_L = "conv2_L"
    export const CONVEYOR2_R = "conv2_R"
    export const CONVEYOR2_RF = "conv2_RF"
    export const CONVEYOR2_LF = "conv2_LF"
    export const CONVEYOR2_LR = "conv2_LR"
    export const CONVEYOR2_LRF = "conv2_LRF"
    export const GEAR_R = "gear_R"         // right rotating gear
    export const GEAR_L = "gear_L"         // left rotating gear
    export const PIT = "pit"            // a pit
    export const BATTERY = "battery"        // a battery space
    export const SPAWN = "spawn"          // an initial (not respawn) point

    /**
     * checks if the given type is any of the 2 conveyor(1) types
     * @param t the SpaceType to check
     * @returns is the space type a conveyor(1)
     */
    export function isConveyor(t: SpaceType|undefined): boolean {
        switch(t) {
            case SpaceType.CONVEYOR_F:
            case SpaceType.CONVEYOR_L:
            case SpaceType.CONVEYOR_R:
            case SpaceType.CONVEYOR_RF:
            case SpaceType.CONVEYOR_LF:
            case SpaceType.CONVEYOR_LR:
            case SpaceType.CONVEYOR_LRF:
                return true
            default:
                return false
        }
    }

    /**
     * checks if the given type is any of the 6 conveyor2 types
     * @param t the SpaceType to check
     * @returns is the space type a conveyor2
     */
    export function isConveyor2(t: SpaceType|undefined): boolean {
        switch(t) {
            case SpaceType.CONVEYOR2_F:
            case SpaceType.CONVEYOR2_L:
            case SpaceType.CONVEYOR2_R:
            case SpaceType.CONVEYOR2_RF:
            case SpaceType.CONVEYOR2_LF:
            case SpaceType.CONVEYOR2_LR:
            case SpaceType.CONVEYOR2_LRF:
                return true
            default:
                return false
        }
    }

    /**
     * checks if the given type is any of the 12 conveyor types
     * @param t the SpaceType to check
     * @returns is the space type a conveyor
     */
    export function isAnyConveyor(t: SpaceType|undefined): boolean {
        return isConveyor(t) || isConveyor2(t)
    }
}
export type SpaceType = "conv_F" | "conv_L" | "conv_R" | "conv_RF" | "conv_LF" | "conv_LR" |
    "conv_LRF" | "conv2_F" | "conv2_L" | "conv2_R" | "conv2_RF" | "conv2_LF" | "conv2_LR" |
    "conv2_LRF" | "gear_R" | "gear_L" | "pit" | "battery" | "spawn"

/**
 * The type of a wall, having a push panel, up to three lasers, or simply being a wall
 */
export namespace WallType {
    export const STANDARD = "standard"
    export const LASER = "laser"
    export const LASER2 = "laser2"
    export const LASER3 = "laser3"
    export type PUSH = {
        registers: number[]
    }
    export function isPUSH(obj: any): obj is PUSH {
        if (!!obj &&
            obj.registers !== undefined &&
            obj.registers.length !== undefined &&
            obj.registers.length > 0) 
        {
            return true
        }
        return false
    }

    /**
     * Checks that the given wall type is a laser or no
     * @param type the WallType to check
     * @returns whether it is a laser
     */
    export function isLaser(type: WallType|undefined): type is (typeof WallType.LASER | typeof WallType.LASER2 | typeof WallType.LASER3) {
        if (type === undefined) return false
        switch (type) {
            case LASER:
            case LASER2:
            case LASER3:
                return true
            default:
                return false
        }
    }
}
export type WallType = "standard" | "laser" | "laser2" | "laser3" | WallType.PUSH

/**
 * A wall. A wall could be undefined (nonexistent), or it could have a type on each side.
 * hi represents the north side of a horizontal wall, and the east side of a vertical wall
 * lo represents the south side of a horizontal wall, and the west side of a vertical wall
 */
export type Wall = null | {
    lo?: WallType
    hi?: WallType
}

/**
 * The type of cover a space has: this cover is superimposed on the type the cell may otherwise have
 */
export namespace SpaceCoverType {
    export const SCRAMBLER = "scrambler"
    export const RESPAWN = "respawn"
    export type CHECKPOINT = {
        number: number
    }
    export function isCHECKPOINT(obj: any): obj is CHECKPOINT {
        if (!!obj && obj.number !== undefined) return true
        return false
    }
    export type CRUSHER = {
        registers: number[]
    }
    export function isCRUSHER(obj: any): obj is CRUSHER {
        if (!!obj &&
            obj.registers !== undefined &&
            obj.registers.length !== undefined &&
            obj.registers.length > 0)
        {
            return true
        }
        return false
    }
}
export type SpaceCoverType = "respawn" | "scrambler" | SpaceCoverType.CRUSHER | SpaceCoverType.CHECKPOINT

/**
 * a full board space. It specifies the type of the space, a cover on the space, and any
 * orientation details about the space. It's possible all are blank because not every space
 * has something on it, or that type is blank and cover is not
 */
export type Space = {
    type?: SpaceType,
    cover?: SpaceCoverType
    orientation?: Orientation
    cover_orientation?: Orientation
}

/**
 * specifies the types of the walls surrounding a space and what they contain
 */
export class SpaceBoundaries {
    n: WallType | undefined
    e: WallType | undefined
    s: WallType | undefined
    w: WallType | undefined

    constructor(n: WallType|undefined, e: WallType|undefined, s: WallType|undefined, w: WallType|undefined) {
        this.n = n
        this.e = e
        this.s = s
        this.w = w
    }

    wall(o: Orientation): WallType|undefined {
        switch (o) {
            case Orientation.N:
                return this.n
            case Orientation.E:
                return this.e
            case Orientation.S:
                return this.s
            case Orientation.W:
                return this.w
        }
    }
}
/**
 * Wall array is a slightly more interactive container for the wall data. It is broken up into
 * horizontal and vertical wall arrays containing 13 sets of 12 walls each (_WallArray). It is
 * also able to get the walls surrounding a particular space with the getWalls method
 */
class WallArray {
    public horizontal_walls: Wall[][]
    public vertical_walls: Wall[][]

    constructor(horizontal: Wall[][], vert: Wall[][]) {
        this.horizontal_walls = horizontal,
        this.vertical_walls = vert
    }
}

/**
 * all of the data associated with a loaded board
 */
export type BoardData = {
    spaces: Space[][]
    walls: WallArray
    x_dim: number
    y_dim: number
    display_name: string
}
/**
 * checks if the object contains a valid board, then makes the type assertion
 * @param obj any old object, but probably one parsed from JSON
 */
export function isValidBoardData(obj:any): obj is BoardData {
    if (obj === undefined ||
        obj.spaces === undefined ||
        obj.walls === undefined ||
        obj.x_dim === undefined ||
        obj.y_dim === undefined ||
        obj.display_name === undefined
    ) {
        // the top level format is bad
        console.warn(`Missing properties for ${obj.display_name}`)
        return false
    }

    // validate the simple properties
    if (typeof obj.x_dim != 'number' ||
        typeof obj.y_dim != 'number' ||
        typeof obj.display_name != 'string' ||
        obj.walls.horizontal_walls === undefined ||
        obj.walls.horizontal_walls.length === undefined ||
        obj.walls.vertical_walls === undefined ||
        obj.walls.vertical_walls.length === undefined ||
        obj.spaces.length === undefined
    ) {
        console.warn(`Invalid property types for ${obj.display_name}`)
        return false
    }

    // run dimension checks for spaces, vert & horizontal walls
    if (
        obj.spaces.length !== obj.x_dim ||
        obj.walls.horizontal_walls.length !== obj.x_dim ||
        obj.walls.vertical_walls.length !== obj.x_dim + 1
    ) {
        console.warn(`Invalid dimensions for ${obj.display_name}`)
        return false
    }

    // check lengths of the elements
    try {
        // proper array checks are a pain, just try iterating over spaces
        for (const col of obj.spaces) {
            if (col === undefined || col.length !== obj.y_dim) {
                console.warn('Spaces column of incorrect length')
                return false
            }
        }
        for (const col of obj.walls.horizontal_walls) {
            if (col === undefined || col.length !== obj.y_dim + 1) {
                console.warn('Horizontal walls column of incorrect length')
                return false
            }
        }
        for (const col of obj.walls.vertical_walls) {
            if (col === undefined || col.length !== obj.y_dim) {
                console.warn('Vertical walls column of incorrect length')
                return false
            }
        }
    } catch (e) {
        console.warn(`Error encountered: ${e}`)
        return false
    }

    return true
}

/**
 * the position and damage of a laser
 */
export type LaserPosition = {
    pos: OrientedPosition,
    damage: number
}

/**
 * the positions and activation registers of a pusher
 */
export type PusherPosition = {
    pos: OrientedPosition,
    registers: number[]
}

/**
 * A full board object. It contains the raw board data, as well as some processed data which
 * will make processing board events more straightforward
 */
export class Board {
    private static board_count = 0
    private readonly id: number
    public data: BoardData

    // all other events are independent, and only the position matters
    // public battery_positions: BoardPosition[] = []
    // public scrambler_positions: BoardPosition[] = []
    // public crusher_positions: BoardPosition[] = []
    public checkpoint_map: DualKeyMap<number, number> = new DualKeyMap<number, number>()
    // the following are indexed along the walls, so may go up to x_dim/y_dim, instead of one below these
    private laser_origins: LaserPosition[] = []
    private pushers: (MovementForest|undefined)[] = []
    private conveyors: MovementForest = new MovementForest(false)
    private conveyors2: MovementForest = new MovementForest(false)

    constructor(data: BoardData) {
        // set our instance ID from the static count
        this.id = Board.board_count
        Board.board_count++

        this.data = data

        // build conveyor graphs and position arrays
        this.rebuildComponentData()
    }

    /**
     * checks if the given position is on the board
     * @param pos the position to test
     * @returns true if the position is on the board
     */
    private _onBoard(pos: BoardPosition): boolean {
        return (
            pos.x >= 0 && pos.x < this.data.x_dim &&
            pos.y >= 0 && pos.y < this.data.y_dim
        )
    }

    /**
     * a standard getter for this readonly property
     * @returns the unique id of this board
     */
    public getId(): number {
        return this.id
    }

    /**
     * Rotates the board by 90-degrees in the given direction. This means tiles are moved, and 
     * oriented tiles are rotated
     * @param dir the direction in which to rotate the board
     */
    public rotateBoard(dir: RotationDirection) {
        // rotate the data :P
        // use the affine transformation from a rotation matrix
        // CW: x, y = y, 11 - x; E/W facing (on vertical walls) hi-lo switches sides
        // CCW: x, y = 11-y, x; N/S facing (on horizontal walls) hi-lo switches sides
        const X_DIM = this.data.x_dim
        const Y_DIM = this.data.y_dim

        // rotate the spaces
        let spaces: Space[][] = []
        // iterate over the x-dim TO BE
        for (let x = 0; x < Y_DIM; x++) {
            let col: Space[] = []
            // iterate over the columns TO BE
            for (let y = 0; y < X_DIM; y++) {
                // which direction are we rotating?
                if (dir == RotationDirection.CW) {
                    // use the formula above to determine which tile on the original board goes here
                    const sp = this.data.spaces[y][X_DIM - x]
                    // if it's oriented, rotate that as well
                    if (sp.orientation != undefined) {
                        sp.orientation = Orientation.rotate(sp.orientation, RotationDirection.CW)
                    }
                    col.push(sp)
                } else /* dir == CCW */ {
                    // similar to CW case
                    const sp = this.data.spaces[Y_DIM-y][x]
                    if (sp.orientation != undefined) {
                        sp.orientation = Orientation.rotate(sp.orientation, RotationDirection.CCW)
                    }
                    col.push(sp)
                }
            }
            spaces.push(col)
        }

        // build the vertical walls
        let vertical_walls: Wall[][] = []
        for (let x = 0; x < Y_DIM+1; x++) {
            let col: Wall[] = []
            for (let y = 0; y < X_DIM; y++) {
                if (dir == RotationDirection.CW) {
                    col.push(this.data.walls.horizontal_walls[y][X_DIM-x])
                } else /* rotating CCW */ {
                    const wall = this.data.walls.horizontal_walls[Y_DIM-y][x]
                    // on CCW rotations, the were-N/S walls need to be hi-lo swapped
                    if (wall !== undefined) {
                        col.push({
                            lo: wall?.hi,
                            hi: wall?.lo
                        })
                    } else { // just push as is
                        col.push(wall)
                    }
                }
            }
            vertical_walls.push(col)
        }

        let horizontal_walls: Wall[][] = []
        for (let x = 0; x < Y_DIM; x++) {
            let col: Wall[] = []
            for (let y = 0; y < X_DIM+1; y++) {
                // on CW rotations, the were-E/W walls need to be hi-lo swapped
                const wall = this.data.walls.vertical_walls[y][X_DIM-x]
                if (dir == RotationDirection.CW) {
                    if (wall !== undefined) {
                        col.push({
                            lo: wall?.hi,
                            hi: wall?.lo
                        })
                    } else {
                        col.push(wall)
                    }
                } else /* dir == CCW */ {
                    col.push(wall)
                }
            }
            horizontal_walls.push(col)
        }

        this.data.spaces = spaces
        this.data.walls = new WallArray(horizontal_walls, vertical_walls)
        this.data.x_dim = Y_DIM
        this.data.y_dim = X_DIM

        this.rebuildComponentData()
    }

    /**
     * If the space is a conveyor, this determines the direction in which it rotates when it activates.
     * This is done by finding the space that the conveyor pushes onto, determining if it is a rotating
     * conveyor (a consideration of its type and orientation), and then returns that direction. If
     * these cases aren't met, it returns undefined
     * @param pos the position of the space to check
     * @returns the direction in which the space rotates if it is a conveyor, else undefined
     */
    private _conveyorTurnDirection(pos: BoardPosition): RotationDirection|undefined {
        const o = this.data.spaces[pos.x][pos.y].orientation
        if (o == undefined) {
            return
        }
        const destination_pos = applyOrientationStep(pos, o)
        const destination_space = this.data.spaces[destination_pos.x][destination_pos.y]
        if (!this._onBoard(destination_pos) ||
            !SpaceType.isAnyConveyor(destination_space.type))
        {
            return
        }

        switch (destination_space.type) {
            case SpaceType.CONVEYOR_L:
            case SpaceType.CONVEYOR2_L:
                return RotationDirection.CCW
            case SpaceType.CONVEYOR_R:
            case SpaceType.CONVEYOR2_R:
                return RotationDirection.CW
            case SpaceType.CONVEYOR_LRF:
            case SpaceType.CONVEYOR2_LRF:
            case SpaceType.CONVEYOR_LR:
            case SpaceType.CONVEYOR2_LR:
                // if we are coming in the same direction as we are facing, then no rotation, otherwise
                // rotate in the direction we are coming in from
                if (destination_space.orientation == o) {
                    return
                }
                // otherwise, test entrance from relative left by flowing in to the next case, below
                // if we are coming in from the relative right of the tile, we rotate
                if (o == Orientation.rotate((destination_space.orientation as Orientation), RotationDirection.CCW, 1)) {
                    return RotationDirection.CW
                }
            case SpaceType.CONVEYOR_LF:
            case SpaceType.CONVEYOR2_LF:
                // if we come in from the relative left of the tile, we rotate
                if (o == Orientation.rotate((destination_space.orientation as Orientation), RotationDirection.CW, 1)) {
                    return RotationDirection.CCW
                }
                // otherwise we don't
                return
            case SpaceType.CONVEYOR_RF:
            case SpaceType.CONVEYOR2_RF:
                // if we are coming in from the relative right of the tile, we rotate
                if (o == Orientation.rotate((destination_space.orientation as Orientation), RotationDirection.CW, 1)) {
                    return RotationDirection.CW
                }
                // otherwise we don't
                return
            default:
                return
        }
    }

    private _getLaserDamage(type: WallType): number {
        switch (type) {
            case WallType.LASER:
                return 1
            case WallType.LASER2:
                return 2
            case WallType.LASER3:
                return 3
            default:
                console.warn(`checking damage of non-laser type: ${type}`)
                return 0
        }
    }

    /**
     * adds a new pusher to the array of pushers. It also manages the pushers array length, and
     * contents to make sure that we add to real MoverForests.
     * @param position the position to add the pusher
     * @param direction the direction in which the pusher pushes
     * @param registers the 1-indexed registers on which the pushers activate
     */
    private _addPusher(position: BoardPosition, direction: Orientation, registers: number[]) {
        for (const register of registers) {
            const zeroed = register - 1
            // if there is not an instantiated mover here
            if (this.pushers[zeroed] == undefined) {
                // instantiate a mover
                this.pushers[zeroed] = new MovementForest()
            }
            this.pushers[zeroed].addMover(position, direction)
        }
    }

    /**
     * Build the data structures associated with the board in memory. This means tracing out paths
     * traversable by conveyor, and listing other component types
     */
    private rebuildComponentData() {
        // this.battery_positions = []
        // this.scrambler_positions = []
        // this.crusher_positions = []
        this.checkpoint_map = new DualKeyMap<number, number>()
        this.conveyors.clear()
        this.conveyors2.clear()
        this.pushers = [undefined, undefined, undefined, undefined, undefined]
        // run over the board and add each component to its list
        for (var x = 0; x < this.data.spaces.length; x++) {
            for (var y = 0; y < this.data.spaces[x].length; y++) {
                const space = this.data.spaces[x][y]
                // if (SpaceCoverType.isCRUSHER(this.data.spaces[x][y].cover)) {
                //     // list this as a crusher
                //     this.crusher_positions.push({x:x,y:y})
                // } else if (this.data.spaces[x][y].cover === SpaceCoverType.SCRAMBLER) {
                //     this.scrambler_positions.push({x:x,y:y})
                // } else 
                if (SpaceCoverType.isCHECKPOINT(space.cover)) {
                    this.checkpoint_map.set(x, y, (this.data.spaces[x][y].cover as SpaceCoverType.CHECKPOINT).number)
                // } else if (this.data.spaces[x][y].type == SpaceType.BATTERY) {
                    // this.battery_positions.push({x:x, y:y})
                } else if (SpaceType.isAnyConveyor(space.type)) {
                    // check if it gives a rotation when it pushes
                    const pos: BoardPosition = {x:x, y:y}
                    const rotation: RotationDirection|undefined = this._conveyorTurnDirection(pos)
                    // make sure that this gets added to the correct forest
                    const o = space.orientation as Orientation
                    const cell = getWalls(this, {x:x, y:y})
                    // if there is a wall in the direction of the conveyor, then the conveyor is
                    // effectively useless. Don't add it to the conveyor forest
                    if (SpaceType.isConveyor(space.type) && !cell.wall(o)) {
                        this.conveyors.addMover(pos, o, rotation)
                    } else {
                        this.conveyors2.addMover(pos, o, rotation)
                    }
                }
            }
        }

        // loop over the horizontal walls to get the lasers
        for (var x = 0; x < this.data.walls.horizontal_walls.length; x++) {
            for (var y = 0; y < this.data.walls.horizontal_walls[x].length; y++) {
                const wall = this.data.walls.horizontal_walls[x][y]
                if (wall === undefined || wall === null) {
                    continue
                }
                // lasers are perpendicular to walls, so horizontal walls bear vertical facing lasers
                if (WallType.isLaser(wall?.lo)) {
                    // add a South (vertical-low) facing laser
                    this.laser_origins.push({
                        pos: {
                            x:x,
                            y:y-1, 
                            orientation: Orientation.S
                        },
                        damage: this._getLaserDamage(wall.lo)
                    })
                } else if (WallType.isLaser(wall.hi)) {
                    // add a North (vertical-high) facing laser
                    this.laser_origins.push({
                        pos: {
                            x:x,
                            y:y, 
                            orientation: Orientation.N
                        },
                        damage: this._getLaserDamage(wall.hi)
                    })
                } else if (WallType.isPUSH(wall?.lo)) {
                    // add a South (vertical-low) facing pusher
                    this._addPusher({x:x, y:y-1}, Orientation.S, wall.lo.registers)
                } else if (WallType.isPUSH(wall?.hi)) {
                    // add a North (vertical-high) facing pusher
                    this._addPusher({x:x, y:y}, Orientation.N, wall.hi.registers)
                }
            }
        }

        // loop over the vertical walls to get the lasers
        for (var x = 0; x < this.data.walls.vertical_walls.length; x++) {
            for (var y = 0; y < this.data.walls.vertical_walls[x].length; y++) {
                const wall = this.data.walls.vertical_walls[x][y]
                // lasers are perpendicular to walls, so vertical walls bear horizontal facing lasers
                if (WallType.isLaser(wall?.lo)) {
                    // add a West (horizontal-low) facing laser
                    this.laser_origins.push({
                        pos: {
                            x:x-1,
                            y:y, 
                            orientation: Orientation.W
                        },
                        damage: this._getLaserDamage(wall.lo)
                    })
                } else if (WallType.isLaser(wall?.hi)) {
                    // add an East (horizontal-high) facing laser
                    this.laser_origins.push({
                        pos: {
                            x:x,
                            y:y, 
                            orientation: Orientation.E
                        },
                        damage: this._getLaserDamage(wall.hi)
                    })
                } else if (WallType.isPUSH(wall?.lo)) {
                    // add a West (horizontal-low) facing pusher
                    this._addPusher({x:x-1, y:y}, Orientation.W, wall.lo.registers)
                } else if (WallType.isPUSH(wall?.hi)) {
                    // add an East (horizontal-high) facing pusher
                    this._addPusher({x:x, y:y}, Orientation.E, wall.hi.registers)
                }
            }
        }
    }

    /**
     * computes movements for each position resulting from the actions of the 2-step conveyors. The
     * return array will be the same size as the input array, and each entry should be applied to the
     * position at the same index in the input. All outputs will either be empty, or the same non-zero
     * length.
     * @param positions the starting positions of the actors to act upon
     * @returns the movements to be applied by the conveyors in a list, placed in the same order as
     * the positions in the input
     */
    public handleConveyor2(positions: Map<PlayerID, OrientedPosition>): Map<PlayerID, MovementArrayWithResults> {
        // call handle conveyance twice because handle conveyance only handles one step
        const evaluator = (pos: OrientedPosition, move: MovementFrame) => this.getMovementResult(pos, move)
        let movements_1 = this.conveyors2.handleMovement(positions, evaluator)
        let mid_positions = new Map<string, OrientedPosition>()
        const ret_builder = new Map<PlayerID, MovementArrayResultsBuilder>()

        // get the max len to use for padding out movements
        let max_len_1 = 0
        for (const frames of movements_1.values()) {
            if (frames.length > max_len_1) {
                max_len_1 = frames.length
            }
        }

        // apply the movements to the positions in the array to get the next round of positions
        for (const [key, frames] of movements_1.entries()) {
            // we don't need to log it if there's no movement
            if (frames.length == 0) {
                continue
            }
            let new_pos: OrientedPosition = positions.get(key) as OrientedPosition
            const builder = new MovementArrayResultsBuilder()
            let remove = false
            
            for (const frame of frames) {
                // update the position
                if (isAbsoluteMovement(frame.movement)) {
                    new_pos = applyOrientationStep(new_pos, frame.movement.direction)
                }
                // add the frame to the builder
                builder.addFrame(frame.movement, frame.status, !!frame.pushed)
                // if we end on a pit, break our movement, we don't continue
                if (frame.status == MovementStatus.PIT) {
                    remove = true
                    break
                }
            }

            // set the updated position, unless we were removed (we aren't counted in movements anymore)
            if (!remove) {
                mid_positions.set(key, new_pos)
            }

            // pad out the result builder
            builder.padMovementToLength(max_len_1)
            ret_builder.set(key, builder)
        }

        // get the second set of movements
        const movements_2 = this.conveyors2.handleMovement(mid_positions, evaluator)

        // get the max length of a movements_2 array
        let max_len_2 = 0
        for (const frames of movements_2.values()) {
            if (frames.length > max_len_2) {
                max_len_2 = frames.length
            }
        }

        // define the return value
        const ret = new Map<PlayerID, MovementArrayWithResults>()

        // run over the results and continue to update the builders
        for (const [key, frames] of movements_2.entries()) {
            let builder = ret_builder.get(key)
            // if there's nothing, no need to log
            if (frames.length == 0) {
                // unless we already have something, then pad out to length
                if (builder !== undefined) {
                    builder.padMovementToLength(max_len_2)
                }
                continue
            }
            // if the builder was empty
            if (builder === undefined) {
                builder = new MovementArrayResultsBuilder()
                builder.padMovementToLength(max_len_1)
                builder.endMovement()
                ret_builder.set(key, builder)
            }

            // extend the builder
            for (const frame of frames) {
                builder.addFrame(frame.movement, frame.status, !!frame.pushed)
            }

            builder.padMovementToLength(max_len_2)
            ret.set(key, builder.finish())
        }

        return ret
    }
    
    /**
     * computes movements for each position resulting from the actions of the 1-step conveyors. The
     * return array will be the same size as the input array, and each entry should be applied to the
     * position at the same index in the input
     * @param positions the starting positions of the actors to act upon
     * @returns the movements to be applied by the conveyors in a list, placed in the same order as
     * the positions in the input
     */
    public handleConveyor(positions: Map<PlayerID, OrientedPosition>): Map<PlayerID, MovementArrayWithResults> {
        const results = this.conveyors.handleMovement(positions, 
            (pos: OrientedPosition, move: MovementFrame) => this.getMovementResult(pos, move))

        // get the max length of any frame array so we can pad out to this length later
        let max_len = 0
        for (const frames of results.values()) {
            if (frames.length > max_len) {
                max_len = frames.length
            }
        }

        // prepare a map of builders 
        const ret = new Map<PlayerID, MovementArrayWithResults>()
        for (const [actor, frames] of results.entries()) {
            if (frames.length == 0) {
                // no need to set an action if there are no frames
                continue
            }
            // set up a builder
            const builder = new MovementArrayResultsBuilder()
            // add the frames
            for (const frame of frames) {
                builder.addFrame(frame.movement, frame.status, !!frame.pushed)
            }
            // pad it out and finish it
            builder.padMovementToLength(max_len)
            ret.set(actor, builder.finish())
        }

        return ret
    }

    /**
     * computes the rotation of any actors by gear tiles on the board
     * @param positions the positions of the actors
     * @returns the list of rotations which are applied by gear spaces on the board
     */
    public handleGear(positions: Map<PlayerID, BoardPosition>): Map<PlayerID, MovementArrayWithResults> {
        const ret = new Map<PlayerID, MovementArrayWithResults>()
        // check each entry
        for (const [key, pos] of positions.entries()) {
            const space = this.data.spaces[pos.x][pos.y]
            // check if it's a gear
            if (space.type === SpaceType.GEAR_L) {
                ret.set(key, MovementArrayWithResults.fromSingleFrame(new Turn(RotationDirection.CCW)))
            } else if (space.type === SpaceType.GEAR_R) {
                ret.set(key, MovementArrayWithResults.fromSingleFrame(new Turn(RotationDirection.CW)))
            }
        }

        return ret
    }

    /**
     * computes paths and blockages of lasers to determine how many of the targets are hit and for how
     * much damage
     * @param laser_origins the origins of the lasers included in the handling
     * @param targets the positions of the targets
     * @param inclusive_positions do lasers also hit the space they shoot from?
     * @return a list of damage values corresponding to the entries in targets
     */
    public handleLaserPaths(laser_origins: LaserPosition[], targets: Map<PlayerID, BoardPosition>, inclusive_positions:boolean=false): Map<PlayerID, number> {
        // create a mapping to simplify the world a little
        const damages = new Map<PlayerID, number>()
        const actor_positions = new DualKeyMap<number, string>()
        for (const [target, position] of targets.entries()) {
            damages.set(target, 0)
            actor_positions.set(position.x, position.y, target)
        }

        // look in the direction they're shooting
        for (const origin of laser_origins) {
            const orientation = origin.pos.orientation
            let working: BoardPosition = {x: origin.pos.x, y: origin.pos.y}

            const key = actor_positions.get(working.x, working.y)
            if (inclusive_positions && key !== undefined) {
                // if inclusive, and there is a target, they take damage
                damages.set(key, damages.get(key) as number + origin.damage)
                // target is hit, continue to next origin
                continue
            }

            // step forward along the path of fire
            // if there is a wall here, stop
            let here = getWalls(this, working)
            if (here.wall(orientation)) {
                continue
            }

            // step
            working = applyOrientationStep(working, orientation)

            // store this for speed over multiple orientations
            const flipped = Orientation.flip(orientation)

            // while the position os on the board
            while (this._onBoard(working)) {
                here = getWalls(this, working)

                // if we hit a wall on entry, break
                if (here.wall(flipped)) {
                    break
                }
                // if there is a target here, hit it
                const key = actor_positions.get(working.x, working.y)
                if (key !== undefined) {
                    damages.set(key, damages.get(key) as number + origin.damage)
                    // end of this laser
                    break
                }
                
                // check for walls before stepping on
                if (here.wall(orientation)) {
                    break
                }

                // step
                working = applyOrientationStep(working, orientation)
            }
        }
        
        return damages
    }

    /**
     * gets the laser origins
     * @returns the laser origins
     */
    public getLaserOrigins(): LaserPosition[] {
        return this.laser_origins
    }

    /**
     * Computes the resulting movement on a target in the given position by the activation of 
     * @param positions the initial positions of the targets
     * @param register the register in which we are activating pushers
     * @returns the resulting absolute movement of activating all pushers
     */
    public handlePush(positions: Map<PlayerID, OrientedPosition>, register: number): Map<PlayerID, MovementArrayWithResults> {
        const ret = new Map<PlayerID, MovementArrayWithResults>()
        
        // handle robots pushing
        if (this.pushers[register] == undefined) {
            return ret
        }
        
        const result = this.pushers[register].handleMovement(positions, 
            (pos: OrientedPosition, move: MovementFrame) => this.getMovementResult(pos, move)
        )

        // get the max_len for padding
        let max_len = 0
        for (const frames of result.values()) {
            if (frames.length > max_len) {
                max_len = frames.length
            }
        }

        for (const [key, frames] of result.entries()) {
            const builder = new MovementArrayResultsBuilder()

            for (const frame of frames) {
                builder.addFrame(frame.movement, frame.status, !!frame.pushed)
            }
            builder.padMovementToLength(max_len)
            ret.set(key, builder.finish())
        }

        return ret
    }

    /**
     * Checks the legality of the given movements, and updates those which are not legal
     * @param position the starting position for the movement array
     * @param movements the list of movements to execute
     * @returns an updated list of movements, cutting short those which end at walls or in pits. Each
     * updated movement is paired with a status for that movement, indicating whether it was ok, hit a 
     * wall, or ended in a pit
     */
    public getMovementResult(position: OrientedPosition, movement: MovementFrame): MovementResult {

        // rotations should always be legal, as well as 0-distance movements
        if (movement === undefined || isRotation(movement)) {
            return {
                movement: movement,
                status: MovementStatus.OK
            }
        }
        
        // 
        let direction = movement.direction
        let cell = getWalls(this, position)
        let working: BoardPosition = position
        // check legality of movement in that direction
        // check cell exit
        if (cell.wall(direction)) {
            // then we move 0
            return {
                movement: {
                    direction: direction,
                    distance: 1
                },
                status: MovementStatus.WALL
            }
        }

        // step forward
        working = applyOrientationStep(working, direction)

        // check the cell status (on board/ is pit)
        if (!this._onBoard(working) || this.data.spaces[working.x][working.y].type == SpaceType.PIT) {
            return {
                movement: {
                    direction: direction,
                    distance: 1
                },
                status: MovementStatus.PIT
            }
        }
        
        return {
            movement: {
                direction: direction,
                distance: 1
            },
            status: MovementStatus.OK
            
        }
    }

    /**
     * Extends the board by adding another board object. This involves merging the walls
     * along the boundary, and rebuilding the internal data model with the 
     * @param direction the direction in which the new board will be appended
     * @param board the board to append
     * @param offset an offset value, if the board is not to be appended exactly to the side
     */
    public extend(direction: Orientation, board: Board, offset:number=0) {
        // append the existing board in the given orientation
    }
}

export function getWalls(board: Board, pos: BoardPosition): SpaceBoundaries {
    const x = pos.x
    const y = pos.y
    if (x < 0 || y < 0 || x >= BOARD_SIZE || y >= BOARD_SIZE) {
        console.error(`Given pair (${x}, ${y}) is out of bounds`)
        throw ("Out of Bounds")
    }
    
    // A wall's special types are only considered if that type faces the space.
    // Otherwise the type is considered to be STANDARD. The
    // following properties are used for the given space walls:
    // (n, down), (e, down), (s, up), (w, up)
    
    // get the wall values
    const n_wall = board.data.walls.horizontal_walls[x][y+1]
    const e_wall = board.data.walls.vertical_walls[x+1][y]
    const s_wall = board.data.walls.horizontal_walls[x][y]
    const w_wall = board.data.walls.vertical_walls[x][y]
    
    // if n_wall is non-null, and n_wall.lo is not defined
    // use standard, otherwise use n_wall.lo (undefined if n_wall is undefined)
    return new SpaceBoundaries(
        /* n */ n_wall != null && !n_wall.lo ? WallType.STANDARD : n_wall?.lo,
        /* e */ e_wall != null && !e_wall.lo ? WallType.STANDARD : e_wall?.lo,
        /* s */ s_wall != null && !s_wall.hi ? WallType.STANDARD : s_wall?.hi,
        /* w */ w_wall != null && !w_wall.hi ? WallType.STANDARD : w_wall?.hi
    )
}