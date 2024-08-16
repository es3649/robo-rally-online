import { walk } from "vue/compiler-sfc"
import { Orientation, RotationDirection, Rotation } from "./movement"
import type { AbsoluteMovement, BoardPosition, OrientedPosition, MovementArray } from "./movement"

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
    export const CONVEYOR_LRF = "conv_LRF"   // conveyor comes in from all 3 directions
    export const CONVEYOR2_F = "conv2_F"    // save as above, blue conveyors
    export const CONVEYOR2_L = "conv2_L"
    export const CONVEYOR2_R = "conv2_R"
    export const CONVEYOR2_RF = "conv2_RF"
    export const CONVEYOR2_LF = "conv2_LF"
    export const CONVEYOR2_LRF = "conv2_LRF"
    export const GEAR_R = "gear_R"         // right rotating gear
    export const GEAR_L = "gear_L"         // left rotating gear
    export const PIT = "pit"            // a pit
    export const BATTERY = "battery"        // a battery space
    export const SPAWN = "spawn"          // an initial (not respawn) point
}
export type SpaceType = "conv_F" | "conv_L" | "conv_R" | "conv_RF" | "conv_LF" | 
    "conv_LRF" | "conv2_F" | "conv2_L" | "conv2_R" | "conv2_RF" | "conv2_LF" | 
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
        if (!!obj && obj.registers !== undefined) return true
        return false
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
        if (!!obj && obj.registers !== undefined) return true
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
export type SpaceBoundaries = {
    n: WallType | undefined,
    e: WallType | undefined,
    s: WallType | undefined,
    w: WallType | undefined
}
/**
 * Wall array is a slightly more interactive container for the wall data. It is broken up into
 * horizontal and vertical wall arrays containing 13 sets of 12 walls each (_WallArray). It is
 * also able to get the walls surrounding a particular space with the getWalls method
 */
class WallArray {
    public horizontal_walls: Wall[][]
    public vertical_walls: Wall[][]

    constructor(horiz: Wall[][], vert: Wall[][]) {
        this.horizontal_walls = horiz,
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
        return false
    }

    // run dimension checks for spaces, vert & horiz walls
    if (
        obj.spaces.length !== obj.x_dim ||
        obj.walls.horizontal_walls.length !== obj.x_dim ||
        obj.walls.vertical_walls.length !== obj.x_dim + 1
    ) {
        return false
    }

    // check lengths of the elements
    try {
        // proper array checks are a pain, just try iterating over spaces
        for (const col of obj.spaces) {
            if (col === undefined || col.length !== obj.y_dim) {
                return false
            }
        }
        for (const col of obj.walls.horizontal_walls) {
            if (col === undefined || col.length !== obj.x_dim + 1) {
                return false
            }
        }
        for (const col of obj.walls.vertical_walls) {
            if (col === undefined || col.length !== obj.y_dim) {
                return false
            }
        }
    } catch {
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
 * A full board object. It contains the raw board data, as well as some processed data which
 * will make processing board events more straightforward
 */
export class Board {
    private static board_count = 0
    private readonly id: number
    public data: BoardData

    // all other events are independent, and only the position matters
    public battery_positions: BoardPosition[] = []
    public scrambler_positions: BoardPosition[] = []
    public crusher_positions: BoardPosition[] = []
    public checkpoint_map: Map<BoardPosition, number> = new Map<BoardPosition, number>()
    // the following are indexed along the walls, so may go up to x_dim/y_dim, instead of one below these
    public h_laser_positions: BoardPosition[] = []
    public v_laser_positions: BoardPosition[] = []
    public h_pusher_positions: BoardPosition[] = []
    public v_pusher_positions: BoardPosition[] = []

    constructor(data: BoardData) {
        // set our instance ID from the static count
        this.id = Board.board_count
        Board.board_count++

        this.data = data

        // build conveyor graphs and position arrays
        this.rebuild_component_data()
    }

    /**
     * a standard getter for this readonly property
     * @returns the unique id of this board
     */
    get_id(): number {
        return this.id
    }

    /**
     * Rotates the board by 90-degrees in the given direction. This means tiles are moved, and 
     * oriented tiles are rotated
     * @param dir the direction in which to rotate the board
     */
    rotate_board(dir: RotationDirection) {
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

        this.rebuild_component_data()
    }

    /**
     * Build the data structures associated with the board in memory. This means tracing out paths
     * traversable by conveyor, and listing other component types
     */
    rebuild_component_data() {
        this.battery_positions = []
        this.scrambler_positions = []
        this.crusher_positions = []
        this.checkpoint_map = new Map<BoardPosition, number>()
        // run over the board and add each component to its list
        for (var x = 0; x < this.data.spaces.length; x++) {
            for (var y = 0; y < this.data.spaces[x].length; y++) {
                if (this.data.spaces[x][y].type === SpaceType.BATTERY) {
                    this.battery_positions.push({x:x, y:y})
                }

                if (SpaceCoverType.isCRUSHER(this.data.spaces[x][y].cover)) {
                    this.crusher_positions.push({x:x,y:y})
                } else if (this.data.spaces[x][y].cover === SpaceCoverType.SCRAMBLER) {
                    this.scrambler_positions.push({x:x,y:y})
                } else if (SpaceCoverType.isCHECKPOINT(this.data.spaces[x][y].cover)) {
                    this.checkpoint_map.set({x:x,y:y}, (this.data.spaces[x][y].cover as SpaceCoverType.CHECKPOINT).number)
                }
            }
        }

        for (var x = 0; x < this.data.walls.horizontal_walls.length; x++) {
            for (var y = 0; y < this.data.walls.horizontal_walls[x].length; y++) {
                const wall = this.data.walls.horizontal_walls[x][y]
                if (wall?.lo == WallType.LASER || wall?.lo == WallType.LASER2 || wall?.lo == WallType.LASER3 ||
                    wall?.hi == WallType.LASER || wall?.hi == WallType.LASER2 || wall?.hi == WallType.LASER3) {
                    this.h_laser_positions.push({x:x,y:y})
                } else if (WallType.isPUSH(wall?.lo) || WallType.isPUSH(wall?.hi)) {
                    this.h_pusher_positions.push({x:x,y:y})
                }
            }
        }

        for (var x = 0; x < this.data.walls.vertical_walls.length; x++) {
            for (var y = 0; y < this.data.walls.vertical_walls[x].length; y++) {
                const wall = this.data.walls.vertical_walls[x][y]
                if (wall?.lo == WallType.LASER || wall?.lo == WallType.LASER2 || wall?.lo == WallType.LASER3 ||
                    wall?.hi == WallType.LASER || wall?.hi == WallType.LASER2 || wall?.hi == WallType.LASER3) {
                    this.v_laser_positions.push({x:x,y:y})
                } else if (WallType.isPUSH(wall?.lo) || WallType.isPUSH(wall?.hi)) {
                    this.v_pusher_positions.push({x:x,y:y})
                }
            }
        }
    }
//     conveyor2_map: [GraphNode]
//     conveyor2_entries: Map<BoardPosition, GraphNode>
//     conveyor_map: [GraphNode]
//     conveyor_entries: Map<BoardPosition, GraphNode>
    // conveyor events should be parsed in a graph. This will allow them to be executed sequentially
    handle_conveyor2(pos: BoardPosition): MovementArray {
        return []
    }
    
    handle_conveyor(pos: BoardPosition): MovementArray {
        return []
    }

    // gear events can all be executed simultaneously
    handle_gear(pos: BoardPosition): Rotation | undefined {
        const space = this.data.spaces[pos.x][pos.y]
        if (space.type === SpaceType.GEAR_L) {
            return new Rotation(RotationDirection.CCW, 1)
        } else if (space.type === SpaceType.GEAR_R) {
            return new Rotation(RotationDirection.CW, 1)
        }
    }

    // these should specify the directions and lengths the lasers are coming in, and possibly accept as
    // arguments the current positions of other robots, to determine where lasers are blocked
    get_laser_origins(): LaserPosition[] {
        return []
        // deal with the lasers one dimension at a time
        // for vertical
        // get the locations of the lasers on walls
        // append their damage
    }

    /**
     * computes paths and blockages of lasers to determine how many of the targets are hit and for how
     * much damage
     * @param laser_origins the origins of the lasers included in the handling
     * @param targets the positions of the targets
     * @param inclusive_positions do lasers also hit the space they shoot from?
     * @return a list of damage values corresponding to the entries in targets
     */
    handle_laser_paths(laser_origins: LaserPosition[], targets: BoardPosition[], inclusive_positions:boolean=false): number[] {
        // look in the direction they're shooting
            // step forward along the path of fire
            // check for blocks from targets when crossing spaces
                // log a damage for this target if its in the way
            // check for nonempty wall when crossing wall spaces
        // 
        return []
    }

    // push events should be able to be executed simultaneously. This may require a data catch to
    // prevent multiple push events from interacting, which I think shouldn't be allowed (else we
    // can daisy chain them like conveyors?)
    /**
     * Computes the resulting movement on a target in the given position by the activation of 
     * @param pos the initial position of the target
     * @returns the resulting absolute movement of activating all pushers
     */
    handle_push(pos: BoardPosition, register: number): AbsoluteMovement | undefined {
        const walls = get_walls(this, pos)
        if (WallType.isPUSH(walls.n) && register in walls.n.registers) {
            return {
                direction: Orientation.S,
                distance: 1
            }
        } else if (WallType.isPUSH(walls.e) && register in walls.e.registers) {
            return {
                direction: Orientation.W,
                distance: 1
            }
        } else if (WallType.isPUSH(walls.s) && register in walls.s.registers) {
            return {
                direction: Orientation.N,
                distance: 1
            }
        } else if (WallType.isPUSH(walls.w) && register in walls.w.registers) {
            return {
                direction: Orientation.E,
                distance: 1
            }
        }
    }

    /**
     * Extends the board by adding another board object. This involves merging the walls
     * along the boundary, and rebuilding the internal data model with the 
     * @param direction the direction in which the new board will be appended
     * @param board the board to append
     * @param offset an offset value, if the board is not to be appended exactly to the side
     */
    extend(direction: Orientation, board: Board, offset:number=0) {
        // append the existing board in the given orientation
    }
}

export function get_walls(board: Board, pos: BoardPosition): SpaceBoundaries {
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
    
    return {
        // if n_wall is non-null, and n_wall.lo is not defined
        // use standard, otherwise use n_wall.lo (undefined if n_wall is undefined)
        n: n_wall != null && !n_wall.lo ? WallType.STANDARD : n_wall?.lo,
        e: e_wall != null && !e_wall.lo ? WallType.STANDARD : e_wall?.lo,
        s: s_wall != null && !s_wall.hi ? WallType.STANDARD : s_wall?.hi,
        w: w_wall != null && !w_wall.hi ? WallType.STANDARD : w_wall?.hi
    }
}