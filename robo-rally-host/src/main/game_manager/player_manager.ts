import {  PlayerState, type Player, type PlayerID } from "../../shared/models/player"
import { newDamageDeck, newRegisterArray, ProgrammingCard, type ProgrammingHand, type RegisterArray } from '../../shared/models/game_data'
import type { Evaluator } from "./board"
import { DeckManager } from "./deck_manager"
import { MovementDirection, type Movement, isRotation, isAbsoluteMovement } from "../../shared/models/movement"
import { MovementForest } from "./graph"
import { applyAbsoluteMovement, applyRotation, MovementFrame, MovementStatus, type MovementResult, type OrientedPosition } from "./move_processors"

const SHUTDOWN_DAMAGE = 2

/**
 * GameManager class manages the game state and invokes the game logic when it's
 * time to do so.
 */
export class PlayerManager {
    private players = new Map<PlayerID, Player>() // maps player names to players
    // private setup_players = new Map<PlayerID, PartialPlayer>()
    private decks = new Map<PlayerID, DeckManager>()
    private damage_deck = new DeckManager(newDamageDeck())
    private programs = new Map<PlayerID, RegisterArray|undefined>()
    private next_programs = new Map<PlayerID, RegisterArray>()
    private player_states = new Map<string, PlayerState>()
    private players_by_priority: PlayerID[] = []
    private priority_lock: boolean = false
    private player_positions: Map<PlayerID, OrientedPosition>

    /**
     * constructs a PlayerManager object, go figure. It also initializes player states like checkpoints,
     * energy, and decks
     * @param players a mapping of the player IDs to their corresponding player objects
     * @param positions an initial mapping of player IDs to their positions
     * @param sender function which can be used to send data to clients
     */
    constructor(players: Map<PlayerID, Player>,
            positions: Map<PlayerID, OrientedPosition>) {
        this.priority_lock = false

        // set the player
        this.players = players
        this.player_positions = positions

        // copy in the player data
        for (const [player_id, player_data] of players) {

            // set the players initial state
            this.player_states.set(player_id, new PlayerState(player_data.name, this.player_states.size))
            
            // initialize all other player data
            this.decks.set(player_id, new DeckManager())
            this.programs.set(player_id, undefined)
        }
        
        this.resetPrograms()
        this.rebuildPriority()
    }

    /**
     * sets the position of the player
     * @param player_id the id of the player to set the position
     * @param position the position of the player
     */
    public setPlayerPosition(player_id: PlayerID, position: OrientedPosition) {
        if (!this.players.has(player_id)) {
            console.warn('Refused to set position for a nonexistent player:', player_id)
            return
        }
        this.player_positions.set(player_id, position)
    }

    /**
     * get the position of a single actor
     * @param player_id the id of the player whose position we want to get
     * @returns the position if there is one, otherwise the player is probably shutdown
     */
    public getPosition(player_id: PlayerID): OrientedPosition|undefined {
        return this.player_positions.get(player_id)
    }
    
    /**
     * gets the map of all players positions, indexed by IDs
     * @returns a map of all players positions
     */
    public getPositions(): Map<PlayerID, OrientedPosition> {
        return this.player_positions
    }

    /**
     * updated the given player's position after the action of this movement. If the movement contains a PIT
     * event at the end, the player is removed from the positions, dealt damage, and set to shutdown
     * @param actor the ID of the actor whose position we are updating
     * @param result the movement result object of the movement
     * @param register the 0-indexed number of the current register
     * @returns an updated map of all player positions, after applying this movement
     */
    public updatePositions(actor: PlayerID, result: MovementResult, register: number): Map<PlayerID, OrientedPosition> {
        // get the position
        let pos = this.player_positions.get(actor)
        if (pos === undefined) {
            // if it's not given, no-op
            console.warn('attempted to move', actor, 'while they have no position')
            return this.player_positions
        }

        // here is the status
        if (result.status === MovementStatus.PIT) {
            // we should be set as a shutdown and our position unset
            this.dealDamage(actor, SHUTDOWN_DAMAGE, register)
            const state = this.player_states.get(actor)
            this.player_positions.delete(actor)
            if (state === undefined) {
                console.warn('failed to shutdown unknown actor (missing state):', actor)
            } else {
                state.active = false
            }
            return this.player_positions
        }

        if (result.movement !== undefined) {            
            if (isAbsoluteMovement(result.movement)) {
                pos = applyAbsoluteMovement(pos, result.movement)
            } else if (isRotation(result.movement)) {
                pos = applyRotation(pos, result.movement)
            }
        }

        this.player_positions.set(actor, pos)

        return this.player_positions
    }

    /**
     * rebuilds the internal players_by_priority list using the priority values set
     * in the player states. It is called by updatePriority after the priority values
     * have been set on the player states
     */
    private rebuildPriority(): void {
        this.players_by_priority = []
        this.players.forEach((player: Player) => {
            const state = this.player_states.get(player.id) as PlayerState
            if (state === undefined) {
                console.warn("Failed to get state for player:", player)
            }
            this.players_by_priority.splice(state.priority, 0, player.id)
        })
    }

    /**
     * runs through the players and decrement their priority. If that player's priority is 0,
     * then set it to max instead
     */
    public updatePriority() {
        // if we got priority locked, then unlock and don't update
        if (this.priority_lock) {
            // reset the priority lock
            this.priority_lock = false
            return    
        }

        // update the priority values
        for (const state of this.player_states.values()) {
            if (state.priority == 0) {
                // set the old first person to the last position
                state.priority = this.player_states.size - 1
            } else {
                state.priority = state.priority - 1
            }
        }

        // reset the priority queue
        this.rebuildPriority()
    }

    /**
     * sets the priority lock, so that the next call to update priority does nothing
     * (except remove the lock)
     */
    public lockPriority() {
        this.priority_lock = true
    }

    /**
     * implements a mapping of priority values to player IDs
     * @param priority the priority of the player to get
     * @returns the id of the player at that priority
     */
    public getPlayerByPriority(priority: number): PlayerID {
        if (priority < 0 || priority >= this.players_by_priority.length) {
            console.error("Received out-of-bounds index while looking up priority:", priority,
                "out of", this.players_by_priority.length, 'entries')
            throw new Error("List index out of bounds in priority lookup")
        }
        return this.players_by_priority[priority]
    }

    /**
     * gets the player states
     * @returns a mapping of player IDs to their respective states
     */
    public getPlayerStates(): Map<PlayerID, PlayerState> {
        return this.player_states
    }

    /**
     * mark the player for a shutdown
     * @param player_id the id of the player marked for shutdown
     */
    public setShutdown(player_id: PlayerID) {
        const state = this.player_states.get(player_id)
        if (state === undefined) {
            console.warn("tried to get state for unknown player:", player_id)
            return
        }

        state.active = false
    }

    /**
     * 
     * @param player_id the id of the player to set the program for
     * @param program the program to set
     * @returns true if all programs are set
     */
    public setProgram(player_id:PlayerID, program: RegisterArray): boolean {
        this.programs.set(player_id, program)
        let missing = 0
        for (const [_, program] of this.programs.entries()) {
            if (program === undefined) {
                missing += 1
            }
        }
        
        console.log(`still expecting ${missing} programs`)
        return missing === 0
    }

    /**
     * reset the player's programs
     */
    public resetPrograms(): Map<PlayerID, RegisterArray> {
        // save the next programs for return, we will clear them now also
        const next = this.next_programs

        this.next_programs = new Map<PlayerID, RegisterArray>()

        for (const player of this.players.keys()) {
            // reactivate the actor
            const state = this.player_states.get(player)
            if (state === undefined) {
                console.warn("Player state missing for player:", player)
            } else {
                state.active = true
            }

            const program = this.programs.get(player)
            // I think the program could still be undefined if the player shuts down
            if (program !== undefined) {

                // discard that player's hand as well
                const deck = this.decks.get(player)
                if (deck === undefined) {
                    console.error("Deck missing for player:", player)
                } else {
                    const damages = deck.clearProgram(program)

                    // discard all damage cards removed
                    damages.forEach((card: ProgrammingCard) => {
                        this.damage_deck.discard(card)
                    })

                    deck.drawHand()
                }
            }

            // set their program to undefined
            this.programs.set(player, undefined)

            // reset their next program
            this.next_programs.set(player, newRegisterArray())
        }

        return next
    }

    /**
     * handles a movement when there are 2 cards in the register
     * @param actions the list of cards in the register, should have length 2
     * @returns the resulting movement of performing both actions
     */
    private handle2CardMovement(actions: ProgrammingCard[]): Movement[] {
        // be sure that the two actions are move forward, and either rotate left or right
        let has_fwd = false
        let has_right = false
        let has_left = false
        // set the variables according to what we find in the register
        for (const card of actions) {
            switch (card.action) {
                case ProgrammingCard.forward1:
                    has_fwd = true
                    break
                case ProgrammingCard.right:
                    has_right = true
                    break
                case ProgrammingCard.left:
                    has_left = true
                    break
                default:
                    break
            }
        }
        // if we didn't get forward, and a left or right: error
        if (!has_fwd && !(has_left || has_right)) {
            console.warn("Multiple card action is not a crab-legs")
            return []
        }
        if (has_right) {
            // we have fwd+right
            return [{direction: MovementDirection.Right, distance: 1}]
        }
        // we have fwd+left
        return [{direction: MovementDirection.Left, distance: 1}]
    }

    /**
     * resolves the contents of the register into a series of Movements, handling all other collateral
     * actions along the way, such as powering up or haywire effects
     * @param register the 0-indexed number of the register to resolve
     * @param program the program to resolve the action from
     * @param player_id the id of the player who owns this program
     * @returns an array of movements to be taken
     */
    public resolveRegister(register: number, player_id: PlayerID, card: ProgrammingCard|undefined=undefined, allow_2:boolean=false): Movement[] {
        const program = this.programs.get(player_id)
        const state = this.player_states.get(player_id)
        if (program === undefined || register < 0 || register > 4) {
            return []
        }

        const actions: ProgrammingCard[] = program[register]
        // if there is no program for some reason, or the player is on shutdown, take no actions
        if (actions.length == 0 || state === undefined || !state.active) {
            return []
        }

        // if there are more than 2 cards, that's a serious issue
        if (actions.length > 2) {
            console.warn(`${player_id} sent too many cards (${actions.length})`)
        }

        // this should be the crab-legs option
        if (actions.length == 2) {
            if (allow_2) {
                return this.handle2CardMovement(program[register])
            }
            // complain, return the first card
            console.warn("2 card movement provided for player", player_id, "in register", register, "but is not allowed")
        }

        // if we were not given a card, pull from the program
        if (card === undefined) {
            card = actions[0]
        }

        // resolve spam
        if (card.action == ProgrammingCard.spam) {
            const deck = (this.decks.get(player_id) as DeckManager)
            do {
                card = deck.draw()
            } while (card.action == ProgrammingCard.spam)
            // discard the card, it wasn't actually in the register
            // any spam drawn don't have to be discarded
            deck.discard(card)
            return this.resolveRegister(register, player_id, card)
        }

        // resolve again
        if (card.action == ProgrammingCard.again) {
            if (register == 0) {
                card = {action: ProgrammingCard.spam, id: -1}
                // recurse to handle the card in the previous register again
                return this.resolveRegister(register, player_id, card)
            } else {
                // resolve the previous register again
                return this.resolveRegister(register-1, player_id)
            }
        }

        // if it's power up, add the energy, don't process the card ()
        if (card.action == ProgrammingCard.power_up) {
            this.player_states.get(player_id)?.gainEnergy(1)
        }

        // resolve haywires
        if (ProgrammingCard.isHaywire(card.action)) {
            // if there's a simple move, do it
            if (!ProgrammingCard.isActionChoice(card.action.actions)) {
                return card.action.actions
            }
            // do the action and choices
            // heaven help us
        }

        // it's a regular card 
        const result = ProgrammingCard.toMovement(card)
        return result === undefined ? [] : [result]
    }

    /**
     * deals damage to the actors, adding spam cards to their decks, or haywires to the next round's
     * registers, as they are drawn. Damage is applied in priority order
     * @param damages the mapping of player_IDs to damage amounts to be dealt
     * @param register the 0-indexed number of the current register
     */
    public dealDamages(damages: Map<string, number>, register: number) {
        // for each player
        for (let i = 0; i < this.players.size; i++) {
            const player = this.getPlayerByPriority(i)
            const damage = damages.get(player)
            if (damage === undefined) {
                continue
            }

            this.dealDamage(player, damage, register)
        }
    }

    /**
     * deals the specified damage to the given player, adding spam cards or haywire to the next
     * round's registers as necessary.
     * @param player_id the ID of the player to deal the damage to
     * @param damage the amount of damage to deal
     * @param register the 0-indexed number of the current register
     */
    private dealDamage(player_id: PlayerID, damage: number, register: number) {
        // draw that many cards from the damage deck
        // check if we have a haywire already
        let has_haywire = ProgrammingCard.isHaywire((this.next_programs.get(player_id) as RegisterArray)[register][0]?.action)
        for (let i = 0; i < damage; i++) {
            // get the damage card
            const damage = this.damage_deck.draw()
            if (ProgrammingCard.isHaywire(damage.action)) {
                // if there's already a haywire, then ignore this card
                if (has_haywire) {
                    this.damage_deck.discard(damage)
                    continue
                }
                (this.next_programs.get(player_id) as RegisterArray)[register] = [damage]
                // we now have a haywire
                has_haywire = true
            } else if (damage !== undefined) {
                // this card should be spam, discard it to the player's deck
                // TODO, log that damage was taken
                (this.decks.get(player_id)?.discard(damage))
            }
        }
    }

    /**
     * adds energy to the given actor
     * @param actor the actor to add energy to
     * @param energy the amount of energy to add
     */
    public addEnergy(actor: PlayerID, energy: number): void {
        // get the player to change energy for
        const player = this.player_states.get(actor)
        if (player == undefined) {
            console.warn(`trying to modify energy for unknown player: ${actor}`)
            return 
        }

        player.gainEnergy(energy);
    }

    /**
     * subtracts energy from the given actor
     * @param actor the actor to subtract energy from
     * @param energy the amount of energy to subtract
     */
    public spendEnergy(actor: PlayerID, energy: number): void {
        // get the player to change energy for
        const player = this.player_states.get(actor)
        if (player == undefined) {
            console.warn(`trying to modify energy for unknown player: ${actor}`)
            return 
        }
        player.spendEnergy(energy)
    }

    /**
     * updates the given actors checkpoint with the current checkpoint number. This can only happen
     * if the given checkpoint number is exactly 1 more than the the players current checkpoint value
     * @param actor the id of the actor who is taking the checkpoint
     * @param checkpoint the number of the checkpoint being taken
     * @return true if the checkpoint is actually taken
     */
    public takeCheckpoint(actor: PlayerID, checkpoint: number): boolean {
        const player = this.player_states.get(actor)
        if (player === undefined) {
            console.warn(`"Tried to update checkpoint for nonexistent player: ${actor}`)
            return false
        }

        // if they have the previous checkpoint
        if (player.checkpoints + 1 === checkpoint) {
            // grant this checkpoint
            player.checkpoints = checkpoint
            return true
        }

        // otherwise don't
        return false
    }

    /**
     * @returns a map of player IDs to the last checkpoint they have claimed
     */
    public getCheckpoints(): Map<PlayerID, number> {
        const checkpoints = new Map<PlayerID, number>()
        for (const [actor, state] of this.player_states.entries()) {
            checkpoints.set(actor, state.checkpoints)
        }
        return checkpoints
    }

    /**
     * computes the action of the moving bot on all the other actors on the map
     * @param actor the actor who is moving around pushing people
     * @param position the starting position of the bot which may be pushing others around
     * @param movements the movements that this actor will be taking
     */
    public getBotPushes(actor: PlayerID, movement: MovementFrame, evaluator: Evaluator): Map<PlayerID, MovementResult[]> {
        // populate data stores
        const ret = new Map<PlayerID, MovementResult[]>()
        
        if (movement === undefined) {
            return ret
        }

        // we'll just instantiate a pusher forest with the single push and go from there
        if (isRotation(movement)) {
            // apply the rotation to the working position
            // just return the single movement, turns are always legal
            ret.set(actor, [{
                movement: movement,
                status: MovementStatus.OK,
            }])
            return ret
        }

        const position = this.player_positions.get(actor)
        if (position === undefined) {
            console.warn(`tried to compute a push for actor ${actor} with no set position`)
            return ret
        }

        // create a new pusher forest with this push
        const forest = new MovementForest()
        forest.addMover(position, movement.direction)
        const results = forest.handleMovement(this.player_positions, evaluator)

        // for each actor in the result
        for (const [id, result] of results.entries()) {
            // add the result to the pushes
            // here, each result should have at most one element because we have no rotations
            // added to the forest
            if (result.length > 0) {
                ret.set(id, [result[0]])
            }
        }

        return ret
    }

    /**
     * gets the new programming hands from the deck managers
     * @returns a mapping of the new hands for the players
     */
    public getHands(): Map<PlayerID, ProgrammingHand> {
        const ret = new Map<PlayerID, ProgrammingHand>()

        for (const [player, deck] of this.decks.entries()) {
            ret.set(player, deck.getHand())
        }

        return ret
    }

    /**
     * returns the :next registers" which are registers containing any cards which
     * were force-placed during this activation, such as haywire cards
     * @returns the next registers
     */
    public getNextRegisters(): Map<PlayerID, RegisterArray> {
        return this.next_programs
    }
}