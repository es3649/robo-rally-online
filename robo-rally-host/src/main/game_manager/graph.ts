import { isAbsoluteMovement, isNoOp, type Orientation, type RotationDirection } from "../models/movement"
import { type PlayerID } from "../models/player"
import { applyAbsoluteMovement, MovementStatus, Turn, type AbsoluteStep, type BoardPosition, type MovementFrame, type MovementResult, type OrientedPosition } from "./move_processors"

/**
 * The DualKeyMap is technically a tree structure with a fixed depth of 2. Each key os of the same
 * template type. In all other respects, it implements the same basic properties of a map.
 */
export class DualKeyMap<K, V> {
    private data = new Map<K, Map<K, V>> ()

    constructor() {}

    /**
     * sets the given value at the key-pair (k1, k2)
     * @param k1 the first key
     * @param k2 the second key
     * @param val the value to store at this key-pair
     */
    public set(k1: K, k2: K, val: V) {
        if (!this.data.has(k1)) {
            this.data.set(k1, new Map<K, V>())
        }

        this.data.get(k1)?.set(k2, val)
    }

    /**
     * gets the value at the given key-pair
     * @param k1 the first key
     * @param k2 the second key
     * @returns the value stored at this key-pair if one exists, else undefined
     */
    public get(k1: K, k2: K): V | undefined {
        return this.data.get(k1)?.get(k2)
    }

    /**
     * checks if the given key-pair is contained in the mapping
     * @param k1 the first key
     * @param k2 the second key
     * @returns true iff the key-pair is found
     */
    public has(k1: K, k2: K): boolean {
        return this.data.has(k1) && (this.data.get(k1) as Map<K, V>).has(k2)
    }

    /**
     * deletes an element from the mapping
     * @param k1 te first key
     * @param k2 the second key
     * @returns true if an element is deleted
     */
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

    /**
     * clears all entries from the mapping
    */
   public clear(): void {
       return this.data.clear()
    }
    
    /**
     * counts the number of items in the mapping
     * @returns the number of items in the mapping
     */
    public get size(): number {
        let count = 0
        for (const val of this.data.values()) {
            count += val.size
        }
        return count
    }
}

/**
 * A Node to be used in the Pusher forest. It contains a direction, in which the movement is taking
 * place, and an optional orientation, if the movement includes a rotation as well. Movements are
 * assumed to be a single step
 */
interface MoverNode {
    direction: Orientation,
    rotation?: RotationDirection
}

/**
 * a collection of pushers, or other movement creators which are expected to activate simultaneously.
 * It also includes computations for pushing other actors, and for getting movement statuses. 
 */
export class MovementForest {
    protected nodes = new DualKeyMap<number, MoverNode[]>()
    protected allow_push: boolean

    /**
     * constructs a new MovementForest
     * @param allow_push controls the behavior of pushes when handling movement. See the notes in the
     * handleMovement method for more details
     */
    constructor (allow_push:boolean = true) {
        this.allow_push = allow_push
    }

    /**
     * add the conveyor to the tree
     * @param position the position where this conveyer lies
     * @param direction the direction in which this conveyor faces
     * @param rotation the rotation effect of this conveyor, in the case it pushes onto a rotating
     * conveyor
     */
    public addMover(position: BoardPosition, direction: Orientation, rotation?:RotationDirection): void {
        if (this.nodes.has(position.x, position.y)) {
            this.nodes.get(position.x, position.y)?.push({
                direction: direction,
                rotation: rotation
            })
        } else {
            this.nodes.set(position.x, position.y, [{
                direction: direction,
                rotation: rotation,
            }])
        }
    }

    private getMovementAction(position: BoardPosition): [AbsoluteStep|undefined, Turn|undefined] {
        const mover_list = this.nodes.get(position.x, position.y)
        // if there is no movement here, or too many, then just abort
        let moves: [AbsoluteStep|undefined, Turn|undefined] = [undefined, undefined]
        if (mover_list === undefined || mover_list.length != 1) {
            return moves
        }

        const mover = mover_list[0]
        moves[0] = {
            direction: mover.direction,
            distance: 1
        }

        if (mover.rotation !== undefined) {
            moves[1] = new Turn(mover.rotation)
        }

        return moves
    }

    /**
     * computes the action of the moves in the forest on the actors, including secondary movements induced
     * by pushes. It also cancels movements when conflicts are detected, including multiple actors being
     * pushed into the same space, or actors being pushed into active movement sources.
     * 
     * If allow_push is set on the class, then when one pusher moves an actor into another actor, this
     * actor will be forced to move as well, and the movements will be propagates as far as they are legal.
     * It will also stop movement of any actor if they move into another active mover.
     * 
     * If allow push is not set, then moving into another active mover will not trigger a cancellation of
     * the movement, and moving into another actor, will not trigger that actor to move. If that actor is
     * on a mover, it will move as well, and the movements will be cancelled together if the latter is
     * determined to be illegal, otherwise, the first will be cancelled if the second actor is not on an
     * active mover.
     * @param positions a mapping of actorIDs to their positions
     * @param evaluator a function accepting a position and a movement, and returns the result of that action
     * @returns a map of actor IDs to action of other movements on those actors
     */
    handleMovement(positions: Map<PlayerID, OrientedPosition>,
            evaluator: (position: OrientedPosition, moves: MovementFrame) => MovementResult): Map<PlayerID, MovementResult[]> {
        // prepare a bunch of lookup tables
        const resulting_positions = new DualKeyMap<number, PlayerID>()
        const resulting_positions_by_actor = new Map<PlayerID, BoardPosition>()
        const starting_positions = new DualKeyMap<number, PlayerID>()
        const movement_frames = new Map<PlayerID, MovementResult[]>()
        const illegal_positions = new DualKeyMap<number, boolean>()
        // cluster numbers and lookups
        let cluster_number = 0
        const cluster_membership = new Map<PlayerID, number>()
        const clusters = new Map<number, Set<PlayerID>>()
        
        /**
         * invalidates the cluster at the given number. It makes their positions illegal, and
         * removes any added movements from the actors involved
         * @param cluster the number of the cluster to invalidate
         */
        function _invalidateCluster(cluster: number) {
            console.log('invalidating cluster', cluster)
            const members = clusters.get(cluster)
            // if the cluster doesn't exist
            if (members === undefined || members.size == 0) {
                return
            }
            for (const member of members) {
                console.log('clearing movements for', member)
                movement_frames.set(member, [])
                const member_start = positions.get(member) as BoardPosition
                illegal_positions.set(member_start.x, member_start.y, true)
                // some movements (including hitting walls) are unresolved when this is called
                // or do not require the target cell to be invalidated, so there may not be a
                // a resulting position logged
                if (resulting_positions_by_actor.has(member)) {
                    const member_end = resulting_positions_by_actor.get(member) as BoardPosition
                    illegal_positions.set(member_end.x, member_end.y, true)
                    resulting_positions_by_actor.delete(member)
                }
            }
        }

        const allow_push = this.allow_push

        /**
         * handles the action on a single space by an outside actor, or the board elements. It stores
         * the action results in the upper scope variables, so they are retained outside of the
         * function call. It may also recurse if the action in this space causes another actor to be
         * pushed.
         * @param key the id of the player whose movement we are handling
         * @param start the starting position of this actor
         * @param actionLookup a function which looks up the action on this space
         * @param push_orientation the orientation if the actor in this space is being pushed by
         * another actor, instead of a stores mover
         */
        function _handleSpace(key: PlayerID, start: OrientedPosition, 
                actionLookup: (pos: BoardPosition) => MovementFrame[], 
                push_orientation?: Orientation) {
            // add our orientation to the current cluster
            clusters.get(cluster_number)?.add(key)
            cluster_membership.set(key, cluster_number)
            console.log('evaluating actor at', start)

            // get our movements
            let movements: MovementFrame[]
            if (push_orientation !== undefined) {
                movements = [{
                    direction: push_orientation,
                    distance: 1
                }]
            } else {
                movements = actionLookup(start)
            }
            console.log('movements are', movements)

            // if there is no movement for our space, and we are not currently a member of a
            // cluster, there is nothing to do. Set our movement to nothing and carry on
            if (movements[0] == undefined) {
                movement_frames.set(key, [])
                return
            } else if (push_orientation === undefined) {
                // this is an active pusher
                // mark this position as illegal: never move into an active pusher
                illegal_positions.set(start.x, start.y, true)
            }

            // we have got a movement
            let pos: BoardPosition = start
            // evaluate our movement

            // this will be at most an absolute movement followed by a rotation
            const result = evaluator(start, movements[0])
            if (result === undefined || result.status == MovementStatus.WALL) {
                // we hit a wall, so invalidate our cluster
                // do not process any rotation, the entire movement is cancelled
                console.log('hit a wall')
                _invalidateCluster(cluster_number)
                return
            }

            // get our resulting position

            const cleaned_movement = result.movement as AbsoluteStep
            // this should always be true, but TS needs it
            if (isAbsoluteMovement(cleaned_movement)) {
                pos = applyAbsoluteMovement(pos, cleaned_movement)
            }
            // save this resulting position
            resulting_positions_by_actor.set(key, pos)

            // check if we are attempting to move into an illegal space
            if (illegal_positions.has(pos.x, pos.y)) {
                // we can't move here
                console.log('result is illegal')
                movement_frames.set(key, [])
                resulting_positions_by_actor.delete(key)
            } else if (resulting_positions.has(pos.x, pos.y)) {
                // we ended up in another resulting position
                // set the result illegal (no other can move into our resulting pos)
                // get the cluster members which resulted in that spot
                const collision_actor = resulting_positions.get(pos.x, pos.y) as PlayerID
                const collision_cluster = cluster_membership.get(collision_actor) as number
                console.log('landed in resulting position of', collision_actor)
                // this will be made an illegal position, not a resulting position, so we
                // don't go through this logic again
                resulting_positions.delete(pos.x, pos.y)
                // invalidate all members of this cluster
                _invalidateCluster(collision_cluster)
                // invalidate our cluster as well
                // (this call will also make our resulting position illegal)
                _invalidateCluster(cluster_number)
            } else {
                // it's all good
                console.log('we good')
                resulting_positions.set(pos.x, pos.y, key)
                // keep any changes from the movement evaluator
                let movement: MovementResult[] = [{
                    ...result,
                    // if there is a push orientation, then we were pushed in this direction
                    pushed: push_orientation !== undefined
                }]
                // if there was a rotation attached, add it
                if (movements[1] !== undefined) {
                    movement.push({
                        movement: movements[1],
                        // rotations are always ok
                        status: MovementStatus.OK
                        // rotations should never happen in conjunction with a push
                        // we won't specify it
                    })
                }
                // save the movement
                movement_frames.set(key, movement)

                // check if a push is happening
                if (starting_positions.has(pos.x, pos.y)) {
                    // if pushes are allowed, propagate
                    if (allow_push) {
                        // propagate
                        // get the key and position of the actor
                        const actor = starting_positions.get(pos.x, pos.y) as PlayerID
                        const actor_start = positions.get(actor) as OrientedPosition
                        console.log('push-recursing as', actor)
                        // recurse
                        _handleSpace(actor, actor_start, actionLookup, cleaned_movement.direction)
                    } else {
                        // pushes are not allowed
                        // propagate anyway, add the actor
                        console.log('reached a push action, but pushing is not allowed')
                        const dest_lookup = actionLookup(pos)
                        if (!isNoOp(dest_lookup[0]) || !isNoOp(dest_lookup[1])) {
                            // then the actor in the target space will likely be moving as well
                            // don't indicate this as a push, but propagate the movement and consider
                            // them to be in the same cluster as us, so we all succeed or get canceled
                            // together
                            const actor = starting_positions.get(pos.x, pos.y) as PlayerID
                            const actor_start = positions.get(actor) as OrientedPosition
                            console.log('no-push-recursing as', actor)
                            _handleSpace(actor, actor_start, actionLookup)
                        } else {
                            // the target is stationary, and we cannot move there
                            // invalidate our cluster
                            console.log('moved into stationary actor in', pos)
                            _invalidateCluster(cluster_number)
                        }
                    }
                }
            }

            // check if we are moving into an active motion source
            // we do this after the cluster is formed so we don't halt cluster formation if one of
            // them is in a bad spot. Tail recursion for the win
            // we also don't worry about this lookup if we aren't allowing pushing
            const dest_lookup = actionLookup(pos)
            if (allow_push && !isNoOp(dest_lookup[0]) || !isNoOp(dest_lookup[2])) {
                console.log('moved onto an active motion source:', pos)
                // invalidate our own cluster
                // note: this will invalidate our resulting space
                _invalidateCluster(cluster_number)
                // check if that pusher pushed a different cluster, if so, that's a conflict
                if (starting_positions.has(pos.x, pos.y)) {
                    const actor = starting_positions.get(pos.x, pos.y) as PlayerID
                    // this can't be undefined, since we are on tail recursion
                    const dest_cluster = cluster_membership.get(actor) as number
                    _invalidateCluster(dest_cluster)
                }
            }
        }

        // make a lookup table of start positions
        for (const [key, start] of positions.entries()) {
            starting_positions.set(start.x, start.y, key)
        }

        // for each bot
        for (const [key, start] of positions.entries()) {
            if (cluster_membership.has(key)) {
                // if we are already in a cluster, then we don't need to do anymore calculation. It
                // was done when we were added to the cluster
                console.log(key, 'already in cluster')
                continue
            }

            // we are a new cluster, add it to the list
            cluster_number += 1
            const members = new Set<PlayerID>()
            clusters.set(cluster_number, members)

            _handleSpace(key, start, (pos: BoardPosition) => this.getMovementAction(pos))
        }

        // trim the results, we don't want to even have entries for actors who resulted in no movement
        // TODO we may need to pad here as well
        const ret = new Map<PlayerID, MovementResult[]>()
        for (const [key, results] of movement_frames.entries()) {
            if (results.length != 0) {
                ret.set(key, results)
            }
        }

        return ret
    }

    clear(): void {
        this.nodes.clear()
    }
}
