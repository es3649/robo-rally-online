import { applyAbsoluteMovement, isAbsoluteMovement, Rotation, type BoardPosition, type MovementArray, type Orientation, type RotationDirection } from "../models/movement"

// TODO this will all be important for serial-loaded boards
// class BorderedCell<T> {
//     n_cell: BorderedCell<T>|undefined
//     // n_wall: Wall|undefined
//     e_cell: BorderedCell<T>|undefined
//     // e_wall: Wall|undefined
//     s_cell: BorderedCell<T>|undefined
//     // s_wall: Wall|undefined
//     w_cell: BorderedCell<T>|undefined
//     // w_wall: Wall|undefined
//     data: T

//     constructor(data: T) {
//         this.data = data
//     }
// }

/**
 * CellGrid contains a grid of cells of type T
 */
// class OrthogonalGraph<T> {
    // origin: BorderedCell<T>

    // constructor(origin: T) {
        // this.origin = new BorderedCell(origin)
    // }

    // toArrayBoard(): Board {
    //     throw new Error("Not Implemented")
    // }
// }

export class DualKeyMap<K, V> {
    private data = new Map<K, Map<K, V>> ()

    constructor() {}

    public set(k1: K, k2: K, val: V) {
        if (!this.data.has(k1)) {
            this.data.set(k1, new Map<K, V>())
        }

        this.data.get(k1)?.set(k2, val)
    }

    public get(k1: K, k2: K): V | undefined {
        return this.data.get(k1)?.get(k2)
    }

    public has(k1: K, k2: K): boolean {
        return this.data.has(k1) && (this.data.get(k1) as Map<K, V>).has(k2)
    }

    public clear() {
        return this.data.clear()
    }

    public get size(): number {
        let count = 0
        for (const val of this.data.values()) {
            count += val.size
        }
        return count
    }
}

interface ConveyorNode {
    direction: Orientation,
    rotation: RotationDirection|undefined
}

export class ConveyorForest {
    private nodes = new DualKeyMap<number, ConveyorNode>()

    constructor () {}

    /**
     * add the conveyor to the tree
     * @param position the position where this conveyer lies
     * @param direction the direciton in which this conveyor faces
     * @param rotation the rotation effect of this conveyor, in the case it pushes onto a rotating
     * conveyor
     */
    public addConveyor(position: BoardPosition, direction: Orientation, rotation?:RotationDirection): void {
        this.nodes.set(position.x, position.y, {
            direction: direction,
            rotation: rotation
        })
    }

    /**
     * clear all data from the forest
     */
    public clear(): void {
        this.nodes.clear()
    }

    /**
     * Gets the list of movement actions applied to a given position by conveyors. These will all be
     * AbsoluteMovements and Rotations
     * @param position the starting position
     * @returns the movement applied to the position by the conveyors
     */
    private getConveyorAction(position: BoardPosition): MovementArray {
        const conveyor = this.nodes.get(position.x, position.y)
        // if this position is not on a conveyor
        let moves: MovementArray = []
        if (conveyor == undefined) {
            // take no moves
            return moves
        }

        // add the absolute movement of the bot by the conveyor
        moves.push({
            direction: conveyor.direction,
            distance: 1
        })

        // if there is a rotation (if it pushes onto a turn)
        if (conveyor.rotation !== undefined) {
            // add the turn to the actions as well
            moves.push(new Rotation(conveyor.rotation, 1))
        }

        return moves
    }

    /**
     * Computes the action of all conveyors simultaneously on each position in the input array.
     * For each position, it returns the resulting action of the conveyors on all actors (possibly
     * empty but not null).
     * It only steps one unit, regardless of the conveyor type, and thus must be called twice on
     * blue conveyors.
     * @param positions the list of all positions of actors to be conveyed (invariant)
     * @returns a list of equal length of movements corresponding to the positions in the input
     */
    handleConveyance<T extends BoardPosition>(positions: Map<string, T>): Map<string, MovementArray> {
        // map the resulting positions to 
        let resulting_positions = new DualKeyMap<number, string>()
        let movement_arrays = new Map<string, MovementArray>()
        let illegal_positions = new DualKeyMap<number, boolean>()

        for (const [key, start] of positions) {
            // for each position, get the conveyor action
            const movements = this.getConveyorAction(start)
            let pos: BoardPosition = start
            for (const movement of movements) {
                // use the applyAbsoluteMovement function
                if (isAbsoluteMovement(movement)) {
                    pos = applyAbsoluteMovement(pos, movement)
                }
            }

            // if the resulting action puts two robots at the same position, cancel those movements
            // this can result if
                // 1: both would be moved onto the same position by conveyors
                // 2: one would be moved into an occupied stationary position
            // in both cases, the resulting movements can be omitted (since we are only moving one
            // step at a time)
            // if (illegal_positions.has(pos.x, pos.y)) {
            //     // then don't move
            //     movement_arrays.set(key, [])
            //     // our position becomes illegal
            //     illegal_positions.set(start.x, start.y, true)
            // } else 
            if (resulting_positions.has(pos.x, pos.y)) {
                // this should be the first time we find an offending key

                const offending_key = (resulting_positions.get(pos.x, pos.y) as string)
                // clear the offender and push an empty array
                movement_arrays.set(offending_key, [])
                movement_arrays.set(key, [])

                // set our starting position, the starting position at the offending key, and 
                // then we can't move into that position
            } else {
                // add the computed movements
                movement_arrays.set(key, movements)
            }
            resulting_positions.set(pos.x, pos.y, key)
            illegal_positions.set(pos.x, pos.y, true)
        }
        console.log(resulting_positions)
        return movement_arrays
    }
}