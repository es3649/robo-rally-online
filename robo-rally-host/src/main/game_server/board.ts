import { Orientation, RotationDirection } from "./movement"
import type { AbsoluteMovement, BoardPosition, MotionArray, Rotation } from "./movement"

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
export type SpaceType = "conv_F" | "conv_L" | "conv_R" | "conv_RF" | "conv_LF" | "conv_LRF" | "conv2_F" | "conv2_L" | "conv2_R" | "conv2_RF" | "conv2_LF" | "conv2_LRF" | "gear_R" | "gear_L" | "pit" | "battery" | "spawn"

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
    export const CRUSHER = "crusher"
    export const RESPAWN = "respawn"
    export type CHECKPOINT = {
        number: number
    }
    export function isCHECKPOINT(obj: any): obj is CHECKPOINT {
        if (!!obj && obj.number !== undefined) return true
        return false
    }
}
export type SpaceCoverType = "respawn" | "scrambler" | "crusher" | SpaceCoverType.CHECKPOINT

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
 * An array of board spaces
 */
export type SpaceArray = [Space, Space, Space, Space, Space, Space, Space, Space, Space, Space, Space, Space]
/**
 * an array of space arrays, making a complete board of spaces
 */
export type BoardArray = [SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray, SpaceArray]

/**
 * _WallArray holds 13 rows of 12 walls. It will be instantiated both vertically and horizontally
 */
export type _WallArray = [
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall],
    [Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall, Wall]
]

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
    private horizontal_walls: _WallArray
    private vertical_walls: _WallArray

    constructor(horiz: _WallArray, vert: _WallArray) {
        this.horizontal_walls = horiz,
        this.vertical_walls = vert
    }

    get_walls(pos: BoardPosition): SpaceBoundaries {
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
        const n_wall = this.horizontal_walls[y+1][x]
        const e_wall = this.vertical_walls[x+1][y]
        const s_wall = this.horizontal_walls[y][x]
        const w_wall = this.vertical_walls[x][y]
        
        return {
            // if n_wall is non-null, and n_wall.lo is not defined
            // use standard, otherwise use n_wall.lo (undefined if n_wall is undefined)
            n: n_wall != null && !n_wall.lo ? WallType.STANDARD : n_wall?.lo,
            e: e_wall != null && !e_wall.lo ? WallType.STANDARD : e_wall?.lo,
            s: s_wall != null && !s_wall.hi ? WallType.STANDARD : s_wall?.hi,
            w: w_wall != null && !w_wall.hi ? WallType.STANDARD : w_wall?.hi
        }
    }
}

/**
 * all of the data associated with a loaded board
 */
export type BoardData = {
    spaces: BoardArray
    walls: WallArray
}

/**
 * A full board object. It contains the raw board data, as well as some processed data which
 * will make processing board events more straightforward
 */
export class Board {
    public data: BoardData

    // all other events are independent, and only the position matters
    public battery_positions: BoardPosition[]
    public scrambler_positions: BoardPosition[]
    public crusher_positions: BoardPosition[]
    public checkpoint_map: Map<BoardPosition, number>

    constructor(data: BoardData) {
        this.data = data

        this.battery_positions = []
        this.scrambler_positions = []
        this.crusher_positions = []
        this.checkpoint_map = new Map<BoardPosition, number>()

        // build conveyor graphs and position arrays
        this.build_component_data()
    }

    rotate_board(dir: RotationDirection) {
        // rotate the data :P
        this.build_component_data()
    }

    build_component_data() {
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

                if (this.data.spaces[x][y].cover === SpaceCoverType.CRUSHER) {
                    this.crusher_positions.push({x:x,y:y})
                } else if (this.data.spaces[x][y].cover === SpaceCoverType.SCRAMBLER) {
                    this.scrambler_positions.push({x:x,y:y})
                } else if (SpaceCoverType.isCHECKPOINT(this.data.spaces[x][y].cover)) {
                    this.checkpoint_map.set({x:x,y:y}, (this.data.spaces[x][y].cover as SpaceCoverType.CHECKPOINT).number)
                }
            }
        }
    }
//     conveyor2_map: [GraphNode]
//     conveyor2_entries: Map<BoardPosition, GraphNode>
//     conveyor_map: [GraphNode]
//     conveyor_entries: Map<BoardPosition, GraphNode>
    // conveyor events should be parsed in a graph. This will allow them to be executed sequentially
    handle_conveyor2(pos: BoardPosition): MotionArray {
        return []
    }
    
    handle_conveyor(pos: BoardPosition): MotionArray {
        return []
    }

    // gear events can all be executed simultaneously
    handle_gear(pos: BoardPosition): Rotation | undefined {
        const space = this.data.spaces[pos.x][pos.y]
        if (space.type === SpaceType.GEAR_L) {
            return {
                direction: RotationDirection.CCW,
                units: 1
            }
        } else if (space.type === SpaceType.GEAR_R) {
            return {
                direction: RotationDirection.CW,
                units: 1
            }
        }
    }

    // these should specify the directions and lengths the lasers are coming in, and possibly accept as
    // arguments the current positions of other robots, to determine where lasers are blocked
    get_laser_positions(blocked: BoardPosition[]): BoardPosition[] {
        return []
    }

    // push events should be able to be executed simultaneously. This may require a data catch to
    // prevent multiple push events from interacting, which I think shouldn't be allowed (else we
    // can daisy chain them like conveyors?)
    handle_push(pos: BoardPosition): AbsoluteMovement | undefined {
        const walls = this.data.walls.get_walls(pos)
        if (WallType.isPUSH(walls.n)) {
            return {
                direction: Orientation.S,
                distance: 1
            }
        } else if (WallType.isPUSH(walls.e)) {
            return {
                direction: Orientation.W,
                distance: 1
            }
        } else if (WallType.isPUSH(walls.s)) {
            return {
                direction: Orientation.N,
                distance: 1
            }
        } else if (WallType.isPUSH(walls.w)) {
            return {
                direction: Orientation.E,
                distance: 1
            }
        }
    }
}