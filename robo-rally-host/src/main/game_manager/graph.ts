import { applyAbsoluteMovement, isAbsoluteMovement, Rotation, type BoardPosition, type MovementArray, type Orientation, type RotationDirection } from "../models/movement"

// TODO this will all be important for serial-loaded boards
class BorderedCell<T> {
    n_cell: BorderedCell<T>|undefined
    // n_wall: Wall|undefined
    e_cell: BorderedCell<T>|undefined
    // e_wall: Wall|undefined
    s_cell: BorderedCell<T>|undefined
    // s_wall: Wall|undefined
    w_cell: BorderedCell<T>|undefined
    // w_wall: Wall|undefined
    data: T

    constructor(data: T) {
        this.data = data
    }
}

/**
 * CellGrid contains a grid of cells of type T
 */
class OrthogonalGraph<T> {
    origin: BorderedCell<T>

    constructor(origin: T) {
        this.origin = new BorderedCell(origin)
    }

    // toArrayBoard(): Board {
    //     throw new Error("Not Implemented")
    // }
}

interface ConveyorNode {
    direction: Orientation,
    rotation: RotationDirection|undefined
}

export class ConveyorForest {
    private nodes = new Map<BoardPosition, ConveyorNode>()

    constructor () {}

    /**
     * add the conveyor to the tree
     * @param position the position where this conveyer lies
     * @param direction the direciton in which this conveyor faces
     * @param rotation the rotation effect of this conveyor, in the case it pushes onto a rotating
     * conveyor
     */
    public addConveyor(position: BoardPosition, direction: Orientation, rotation?:RotationDirection): void {
        this.nodes.set(position, {
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
        const conveyor = this.nodes.get(position)
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
    handleConveyance(positions: BoardPosition[]): MovementArray[] {
        // map the resulting positions to 
        let resulting_positions = new Map<BoardPosition, number>()
        let movement_arrays: MovementArray[] = []

        for (let i = 0; i < positions.length; i++) {
            // for each position, get the conveyor action
            const movements = this.getConveyorAction(positions[i])
            let pos = positions[i]
            for (const movement in movements) {
                // use the applyAbsoluteMovement function
                if (isAbsoluteMovement(movement)) {
                    pos = applyAbsoluteMovement(pos, movement)
                }
            }

            // if the resulting action puts two robots at the same position, cancel those movements
            // this can result if
                // 1: both would be moved onto the same position by conveyors
                // 2: one would be moved into a stationary position
            // in both cases, the resulting movements can be omitted (since we are only moving one
            // step at a time)
            if (resulting_positions.has(pos)) {
                const offending_idx = (resulting_positions.get(pos) as number)
                // clear the offender and push an empty array
                movement_arrays[offending_idx] = []
                movement_arrays.push([])
            } else {
                // add the computed movements
                movement_arrays.push(movements)
            }
        }

        return movement_arrays
    }
}