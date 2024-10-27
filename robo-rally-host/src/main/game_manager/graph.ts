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

interface MoverNode {
    direction: Orientation,
    rotation?: RotationDirection
    activation?: number[]
}

// TODO make this a base class, and subclass it for movers and conveyors
// conveyors can rotate where movers can't, and movers can push adjacent targets while conveyors can't
// movers also have an activation register check, and need to disable if something passes through a wall
// ALSO: consider making robot pushing an independent function, as we will need it when handling
// programmed actor movement as well
export class MoverForest {
    protected nodes = new DualKeyMap<number, MoverNode>()

    constructor () {}

    /**
     * add the conveyor to the tree
     * @param position the position where this conveyer lies
     * @param direction the direction in which this conveyor faces
     * @param rotation the rotation effect of this conveyor, in the case it pushes onto a rotating
     * conveyor
     */
    public addMover(position: BoardPosition, direction: Orientation, rotation?:RotationDirection, activation?: number[]|undefined): void {
        this.nodes.set(position.x, position.y, {
            direction: direction,
            rotation: rotation,
            activation: activation
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
    private getMoverAction(position: BoardPosition, register?: number): MovementArray {
        const mover = this.nodes.get(position.x, position.y)
        // if this position is not on a conveyor
        let moves: MovementArray = []
        if (mover == undefined) {
            // take no moves
            return moves
        }

        // check activation registers: given register, activation and no inclusion,, we don't activate now 
        if (register !== undefined &&
            mover.activation !== undefined &&
            !mover.activation.includes(register)) {
            return moves
        }

        // add the absolute movement of the bot by the conveyor
        moves.push({
            direction: mover.direction,
            distance: 1
        })

        // if there is a rotation (if it pushes onto a turn)
        if (mover.rotation !== undefined) {
            // add the turn to the actions as well
            moves.push(new Rotation(mover.rotation, 1))
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
    handleMovement<T extends BoardPosition>(positions: Map<string, T>, register?: number): Map<string, MovementArray> {
        let resulting_positions = new DualKeyMap<number, string>()
        let movement_arrays = new Map<string, MovementArray>()
        let illegal_positions = new DualKeyMap<number, boolean>()
        // for each position
        for (const [key, start] of positions) {
            // for each position, get the conveyor action
            const movements = this.getMoverAction(start, register)
            // for each of those movements
            let pos: BoardPosition = start
            for (const movement of movements) {
                // apply it to the starting position to get the resulting position
                // use the applyAbsoluteMovement function
                if (isAbsoluteMovement(movement)) {
                    pos = applyAbsoluteMovement(pos, movement)
                }
            }

            // if the resulting position is in the illegal set
            if (illegal_positions.has(pos.x, pos.y)) {
                // change our movement array to empty
                movement_arrays.set(key, [])
                // our position is illegal
                illegal_positions.set(pos.x, pos.y, true)
            } else if (resulting_positions.has(pos.x, pos.y)) {
                /**
                 * this can only happen if (1) we both move into each other, in which case both movements
                 * should be cancelled, or (2) we move into the space of a stationary actor, in which case
                 * resetting their movements has no effect
                 */

                // if the resulting position is someone else's resulting position
                // make the resulting position an illegal position
                illegal_positions.set(pos.x, pos.y, true)
                
                // do a makeIllegal routine:
                function _makeIllegal(key: string) {
                    // make our starting position an illegal position
                    const start = positions.get(key) as T
                    illegal_positions.set(start.x, start.y, true)
                    // make our movements empty
                    movement_arrays.set(key, [])
                    
                    /**
                     * No actor other than ourselves should have a starting position equal to ours
                     * and therefore if their resulting position is equal to ours, they have moved
                     * Since our movement is now illegal, they cannot move into us, and so must
                     * have movement reset to empty
                     */
                    // for each resulting position equal to our starting position (should be max 1)
                    const prev = resulting_positions.get(start.x, start.y)
                    // if that actor is not ourself
                    if (prev !== undefined && prev != key) {
                        // recurse
                        _makeIllegal(prev)
                    }
                }

                // for our position, and the other resulting position
                _makeIllegal(key)
                _makeIllegal(resulting_positions.get(pos.x, pos.y) as string)
            } else {
                // everything is fine
                resulting_positions.set(pos.x, pos.y, key)
                movement_arrays.set(key, movements)
            }

        }
        return movement_arrays
    }
}