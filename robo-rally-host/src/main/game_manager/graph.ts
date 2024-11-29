import { applyAbsoluteMovement, applyOrientationStep, isAbsoluteMovement, OrientedPosition, Rotation, type AbsoluteMovement, type Movement, type BoardPosition, type MovementArray, type Orientation, type RotationDirection, MovementFrame, type AbsoluteStep } from "../models/movement"
import { MovementStatus, type MovementResult } from "./board"

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

    public delete(k1: K, k2: K): boolean {
        const v1 = this.data.get(k1)
        if (v1 === undefined) {
            return false
        }

        const deleted = v1.delete(k2)
        if (deleted && v1.size == 0) {
            this.data.delete(k1)
        }
        return deleted
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

export class PusherForest {
    protected nodes = new DualKeyMap<number, MoverNode[]>()

    constructor() {}

    /**
     * add a pusher to the forest
     * @param position the position of the pusher
     * @param direction the direction that the pusher pushes in
     * @param activation the one-indexed phases in which the pusher activates
     */
    addPusher(position: BoardPosition, direction: Orientation, activation: number[]): void {
        if (!this.nodes.has(position.x, position.y)) {
            this.nodes.set(position.x, position.y, [])
        }

        this.nodes.get(position.x, position.y)?.push({
            direction: direction,
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
     * gets the movements of the activating pushers at this position. Only returns effects of pushers which activate at this
     * register. If more than one activating pusher is found, it returns no movements instead
     * @param position the position where we look up pushers for
     * @param register the register of pushers we want to get
     * @returns the action of the pushers activating in this register, at the given position
     */
    private getPusherAction(position: BoardPosition, register: number): AbsoluteStep|undefined {
        const movers = this.nodes.get(position.x, position.y)
        const moves: AbsoluteStep[] = []
        if (movers == undefined || movers.length == 0) {
            return 
        }

        // check activation registers: given register, activation and no inclusion, we don't activate now 
        for (const mover of movers) {
            if (mover.activation !== undefined &&
                    mover.activation.includes(register)) {
                // if there's already something in here but we found another legal mover, return empty
                // we don't mess with that crap

                moves.push({
                    direction: mover.direction,
                    distance: 1
                })
            }
        }

        if (moves.length != 1) {
            return
        }

        return moves[0]
    }

    // TODO this setup is good, but we need working knowledge of wall locations. Some movement
    // configurations will be legal when we take walls into account, but illegal if we don't,
    // for example a bot being pushed past a wall when a column of bots are being pushed into that wall
    /**
     * Computes the action of the stored pushers on the given actors
     * @param positions the list of actors and their positions
     * @param register the **1-indexed** register number
     * @param evaluator a function which can evaluate movements and determine if they run the actor into
     *  a wall
     */
    public handleMovement(positions: Map<string, OrientedPosition>, register: number, evaluator: (position: OrientedPosition, moves: MovementFrame) => MovementResult): Map<string, MovementFrame> {
        const resulting_positions = new DualKeyMap<number, string>()
        const resulting_positions_by_actor = new Map<string, BoardPosition>()
        const starting_positions = new DualKeyMap<number, string>()
        const movement_frames = new Map<string, MovementFrame>()
        const illegal_positions = new DualKeyMap<number, boolean>()
        let cluster_number = 0
        const cluster_membership = new Map<string, number>()
        const clusters = new Map<number, Set<string>>()
        console.log("using register", register)

        function _invalidateCluster(cluster: number) {
            console.log('invalidating cluster', cluster)
            const members = clusters.get(cluster) as Set<string>
            for (const member of members) {
                console.log('clearing movements for', member)
                movement_frames.set(member, undefined)
                const member_start = positions.get(member) as BoardPosition
                illegal_positions.set(member_start.x, member_start.y, true)
                // some movements (incl hitting walls) are unresolved when this is called
                // or do not require the target cell to be invalidated, so there may not
                // be a resulting position logged
                if (resulting_positions_by_actor.has(member)) {
                    const member_end = resulting_positions_by_actor.get(member) as BoardPosition
                    illegal_positions.set(member_end.x, member_end.y, true)
                    resulting_positions_by_actor.delete(member)
                }
            }
        }

        function _handleSpace(key: string, start: OrientedPosition,
                actionLookup: (pos: BoardPosition, register: number) => AbsoluteStep|undefined,
                push_orientation?: Orientation) {
            // add ourselves to the current cluster
            clusters.get(cluster_number)?.add(key)
            cluster_membership.set(key, cluster_number)
            console.log('evaluating actor at', start)

            // get movements
            let movement: AbsoluteStep|undefined
            if (push_orientation !== undefined) {
                movement = {
                    direction: push_orientation,
                    distance: 1
                }
            } else {
                movement = actionLookup(start, register)
            }
            console.log('movement is', movement)

            // if there is no movement for our space, and we are not currently a member of a
            // cluster there is nothing to do. Set our movement to nothing and carry on
            if (movement === undefined) {
                movement_frames.set(key, undefined)
                return
            } else if (push_orientation === undefined) {
                // this is an active pusher
                // mark this position illegal: never move into an active pusher
                illegal_positions.set(start.x, start.y, true)
            }

            // we have got a movement
            let pos: BoardPosition = start
            let cleaned_movements: MovementFrame = undefined
            // evaluate our movement

            const result = evaluator(start, movement)
            if (result === undefined || result.status == MovementStatus.wall) {
                // we hit a wall, so invalidate our cluster
                console.log('hit a wall')
                _invalidateCluster(cluster_number)
                return
            }
            
            // get our resulting position
            
            // they should all be absolute, but just make sure. Makes TS happy too
            if (!isAbsoluteMovement(result.movement)) {
                return
            }
            cleaned_movements = result.movement
            pos = applyAbsoluteMovement(pos, result.movement)
            console.log('resulting position', pos)
            // save this in the archive
            resulting_positions_by_actor.set(key, pos)
            
            // if we are attempting to move into an illegal space
            if (illegal_positions.has(pos.x, pos.y)) {
                // we can't move there
                console.log('result is illegal')
                movement_frames.set(key, undefined)
                resulting_positions_by_actor.delete(key)
            } else if (resulting_positions.has(pos.x, pos.y)) {
                // if we ended up in another resulting position
                // set the result illegal
                // get the cluster members which resulted in that spot
                const collision_actor = resulting_positions.get(pos.x, pos.y) as string
                const collision_cluster = cluster_membership.get(collision_actor) as number
                console.log('landed in resulting position of', collision_actor)
                resulting_positions.delete(pos.x, pos.y)
                // invalidate all members of this cluster
                _invalidateCluster(collision_cluster)
                // invalidate our cluster
                _invalidateCluster(cluster_number)
            } else {
                // it's all good
                console.log('we good')
                resulting_positions.set(pos.x, pos.y, key)
                // keep any changes from the movement evaluator
                movement_frames.set(key, cleaned_movements)
                
                if (starting_positions.has(pos.x, pos.y)) {
                    // propagate
                    // get the key and position of the actor
                    const actor = starting_positions.get(pos.x, pos.y) as string
                    const actor_start = positions.get(actor) as OrientedPosition
                    console.log('recursing as', actor)
                    // recurse
                    _handleSpace(actor, actor_start, actionLookup, movement.direction)
                    
                }
            }
        
            // check if we are moving into another active pusher
            // we do this after the cluster is formed, so we don't halt cluster formation if one of
            // them is in a bad spot. Tail recursion for the win
            if (actionLookup(pos, register) !== undefined) {
                console.log('moved resulted on active pusher')
                // invalidate our own cluster
                // note: this will also invalidate our resulting space
                _invalidateCluster(cluster_number)
                // check if that pusher pushed a different cluster, if so, that's a conflict
                if (starting_positions.has(pos.x, pos.y)) {
                    const actor = starting_positions.get(pos.x, pos.y) as string
                    // this can't be undefined, since we are on tail recursion
                    const dest_cluster = cluster_membership.get(actor) as number
                    _invalidateCluster(dest_cluster)
                }
            }
        }

        // make a lookup table for starting positions
        for (const [key, start] of positions.entries()) {
            starting_positions.set(start.x, start.y, key)
        }

        
        // for each bot
        for (const [key, start] of positions) {
            if (cluster_membership.has(key)) {
                // if we are are already in a cluster, then we don't need to do anymore calculation. It
                // was done when we were added to the cluster
                console.log(key, 'already in cluster')
                continue
            }
            
            // we are a new cluster, add it to the list
            cluster_number += 1
            const members = new Set<string>()
            clusters.set(cluster_number, members)
            
            _handleSpace(key, start, (pos: BoardPosition, register: number) => this.getPusherAction(pos, register))
        }

        return movement_frames
    }
}

export class ConveyorForest {
    protected nodes = new DualKeyMap<number, MoverNode>()

    constructor () {}

    /**
     * add the conveyor to the tree
     * @param position the position where this conveyer lies
     * @param direction the direction in which this conveyor faces
     * @param rotation the rotation effect of this conveyor, in the case it pushes onto a rotating
     * conveyor
     */
    public addConveyor(position: BoardPosition, direction: Orientation, rotation?:RotationDirection): void {
        this.nodes.set(position.x, position.y, {
            direction: direction,
            rotation: rotation,
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
    private getConveyorAction(position: BoardPosition): MovementFrame[] {
        const mover = this.nodes.get(position.x, position.y)
        // if this position is not on a conveyor
        let moves: MovementFrame[] = []
        if (mover == undefined) {
            // take no moves
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
    handleMovement<T extends BoardPosition>(positions: Map<string, T>): Map<string, MovementFrame[]> {
        let resulting_positions = new DualKeyMap<number, string>()
        let movement_arrays = new Map<string, MovementFrame[]>()
        let illegal_positions = new DualKeyMap<number, boolean>()
        // for each position
        for (const [key, start] of positions) {
            // for each position, get the conveyor action
            const movements = this.getConveyorAction(start)
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
        return MovementFrame.pad(movement_arrays)
    }
}