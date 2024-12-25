import { Color } from "../models/player"
import {  PlayerState, type Character, type PartialPlayer, type Player, type PlayerID, type PlayerName } from "../models/player"
import type { Main2ServerMessage, Sender } from '../models/connection'
import { GamePhase, newDamageDeck, ProgrammingCard, type RegisterArray } from '../models/game_data'
import type { Board, LaserPosition } from "./board"
import { Main2Server } from "../models/events"
import { BotAction } from "../bluetooth"
import * as bt from '../bluetooth'
import { DeckManager } from "./deck_manager"
import { MovementDirection, type Movement, isRotation, Orientation, isAbsoluteMovement } from "../models/movement"
import { MovementForest } from "./graph"
import { applyAbsoluteMovement, applyRotation, MovementArrayResultsBuilder, MovementArrayWithResults, MovementFrame, MovementStatus, type MovementResult, type OrientedPosition } from "./move_processors"

export const MAX_PLAYERS = 6

/**
 * GameManager class manages the game state and invokes the game logic when it's
 * time to do so.
 */
export class GameManager {
    private started: boolean = false
    private players = new Map<PlayerID,Player>() // maps player names to players
    private setup_players = new Map<PlayerID, PartialPlayer>()
    private decks = new Map<PlayerID, DeckManager>()
    private damage_deck = new DeckManager(newDamageDeck())
    private programs = new Map<PlayerID, RegisterArray|undefined>()
    private next_programs = new Map<PlayerID, RegisterArray>()
    private shutdowns = new Set<PlayerID>()
    private board: Board|undefined
    private player_states = new Map<string, PlayerState>()
    private player_positions = new Map<PlayerID, OrientedPosition>()
    private readonly M2SSender: Sender<Main2Server>

    /**
     * 
     * @param sender function which can be used to send data to clients
     */
    constructor(sender: Sender<Main2Server>) {
        this.M2SSender = sender
        this.started = false
    }

    /**
     * Adds a new player to the game
     * @param player_name the name of the player we are adding to the game
     * @returns false if the player couldn't be added
     */
    addPlayer(player_name: string, player_id: string): boolean {
        // don't add players after game start
        if (this.started) {
            return false
        }
        // don't allow adding more than max players
        // don't allow duplicate player IDs
        if (this.setup_players.size >= MAX_PLAYERS || this.setup_players.has(player_id)) {
            return false
        }
        // build the player object
        const player: PartialPlayer = {
            name: player_name,
            id: player_id,
            // get a default color for the player
            colors: Color.by_number(this.setup_players.size)
        }
        
        // set the players initial state
        this.player_states.set(player_id, new PlayerState(player_name, this.setup_players.size))
        
        // add this player to our registry
        this.setup_players.set(player_id, player)
        this.decks.set(player_id, new DeckManager())
        this.programs.set(player_id, undefined)
        // return the conn details to the caller
        return true
    }

    /**
     * sets the position of the player
     * @param player_id the id of the player to set the position
     * @param position the position of the player
     */
    setPlayerPosition(player_id: PlayerID, position: OrientedPosition) {
        this.player_positions.set(player_id, position)
    }

    /**
     * adds a character to the player entry
     * @param player_id the id of the player to add the character to
     * @param bot the character to add
     */
    setPlayerCharacter(player_id: string, bot: Character): boolean {
        // don't change bots after game start
        if (this.started) {
            return false
        }
        // get the player
        const player = this.players.get(player_id)
        if (player !== undefined) {
            // set the bot
            player.character = bot
        }

        // connect the bot over bluetooth
        bt.connectRobot(bot.id)
        return true
    }

    private getInitialPlayerPositions() {
        // run through the players and get starting positions for them

    }

    /**
     * start the current game, and execute starting logic
     * @returns false if the game data is not configured correctly yet
     */
    start(): boolean {
        // there better be a board
        if (this.board === undefined) {
            return false
        }

        // don't start with too few players
        if (this.players.size < 2) {
            return false
        }

        // validate all players and bot connections
        for (const [id, player] of this.setup_players.entries()) {
            if (player.character === undefined) {
                return false
            }
            if (player.colors === undefined) {
                player.colors = Color.GRAY
            }
            if (!bt.connectRobot(player.character.id)) {
                return false
            }
            this.players.set(id, player as Player)
        }
        // add the players to the programs
        this.resetPrograms()
        // set the game to started
        this.started = true

        this.getInitialPlayerPositions()

        return true
    }

    /**
     * stop the current game. This may require sending a reset
     */
    stop() {
        this.started = false
    }

    /**
     * loads the given board to the game data
     * @param board the board to use
     */
    useBoard(board: Board): void {
        // don't change the board after the game has started
        if (this.started) {
            return
        }
        // lol
        this.board = board
    }

    setProgram(player_name:PlayerName, program: RegisterArray) {
        this.programs.set(player_name, program)
        for (const [_, program] of this.programs.entries()) {
            if (program === undefined) {
                return
            }
        }
        // if we've gotten here, then all programs are set. Proceed to activation phase
        // broadcast phase update
        const msg: Main2ServerMessage<GamePhase> = {
            name: Main2Server.PHASE_UPDATE,
            data: GamePhase.Activation
        }
        this.M2SSender(msg)

        // run activation phase
        this.activationPhase()
    }

    /**
     * mark the player for a shutdown
     * @param player_id the id of the player marked for shutdown
     */
    setShutdown(player_id: PlayerID) {
        this.shutdowns.add(player_id)
    }

    /**
     * reset the player's programs
     */
    private resetPrograms() {
        for (const player of this.players.keys()) {
            this.programs.set(player, undefined)
        }
        this.shutdowns.clear()
    }

    private updatePositions(actor: PlayerID, result: MovementResult) {
        if (!this.player_positions.has(actor)) {
            console.warn('attempted to move', actor, 'while they have no position')
            return
        }
        let pos = this.player_positions.get(actor) as OrientedPosition

        if (result.movement === undefined) {
            return
        }

        if (isAbsoluteMovement(result.movement)) {
            pos = applyAbsoluteMovement(pos, result.movement)
        } else if (isRotation(result.movement)) {
            pos = applyRotation(pos, result.movement)
        }

        // here is the status
        if (result.status == MovementStatus.PIT) {
            // we should be set as a shutdown and our position unset
            this.shutdowns.add(actor)
            this.player_positions.delete(actor)
        }
    }

    private executeFrames(movements: Map<PlayerID, MovementArrayWithResults>, update_positions: boolean=true): void {
        // trigger any status-related conditions
        // only trigger once per event (only hit a wall once)
        // any pit actions should cause the bot to be deactivated and its positions to be removed
        // re-balance the lengths again
        // send the frames to bt
    }

    private dealDamage(damages: Map<string, number>, register: number) {
        // for each player
        for (const [player, damage] of damages.entries()) {
            // draw that many cards from the damage deck
            // check if we have a haywire already
            let has_haywire = ProgrammingCard.isHaywire((this.next_programs.get(player) as RegisterArray)[register][0]?.action)
            for (let i = 0; i < damage; i++) {
                // get the damage card
                const damage = this.damage_deck.drawCard()
                if (ProgrammingCard.isHaywire(damage.action)) {
                    // if there's already a haywire, then ignore this card
                    if (has_haywire) {
                        this.damage_deck.discard(damage)
                        continue
                    }
                    (this.next_programs.get(player) as RegisterArray)[register] = [damage]
                } else {
                    // this card should be spam, discard it to the player's deck
                    // TODO, log that damage was taken
                    (this.decks.get(player)?.discard(damage))
                }
            }
        }
    }

    private boardElements(register: number): void {
        // execute these in order
        if (this.board === undefined) {
            console.error("No board!")
            return
        }

        // conveyor-2s
        const conv2 = this.board.handleConveyor2(this.player_positions)
        this.executeFrames(conv2)
        
        // conveyors
        const conv = this.board.handleConveyor(this.player_positions)
        this.executeFrames(conv)

        // gears
        const gears = this.board.handleGear(this.player_positions)
        this.executeFrames(gears)
        
        // pushers
        const pushed = this.board.handlePush(this.player_positions, register)
        this.executeFrames(pushed)

        // crushers
        console.warn("crushers are not implemented")

        // board lasers
        const damages = this.board.handleLaserPaths(this.board.getLaserOrigins(), this.player_positions, false)
        this.dealDamage(damages, register)
        
        // robot lasers
        // turn the player positions into a laser origin set
        const origins: LaserPosition[] = []
        for (const value of this.player_positions.values()) {
            origins.push({
                pos: value,
                damage: 1
            })
        }
        const damages_2 = this.board.handleLaserPaths(origins, this.player_positions, true)
        this.dealDamage(damages_2, register)

        // batteries
        console.warn("batteries are not implemented")
        
        // checkpoints
        console.warn("checkpoints are not implemented")
    }

    /**
     * computes the action of the moving bot on all the other actors on the map
     * @param actor the actor who is moving around pushing people
     * @param position the starting position of the bot which may be pushing others around
     * @param movements the movements that this actor will be taking
     */
    private getBotPushes(actor: PlayerID, position: OrientedPosition, movement: MovementFrame): Map<PlayerID, MovementResult> {
        // populate data stores
        const ret = new Map<PlayerID, MovementResult>()

        // TODO the best move here is to extend the pusher forest to accommodate this as well.
        // we'll just instantiate a pusher forest with the single push and go from there
        if (isRotation(movement)) {
            // apply the rotation to the working position
            // just return the single movement, turns are always legal
            ret.set(actor, {
                movement: movement,
                status: MovementStatus.OK,
            })
            return ret
        }

        // create a new pusher forest with this push
        const forest = new MovementForest()
        forest.addMover(position, position.orientation)
        const results = forest.handleMovement(this.player_positions, (pos: OrientedPosition, moves: MovementFrame) => (this.board as Board).getMovementResult(pos, moves))

        // for each actor in the result
        for (const [id, result] of results.entries()) {
            // add the result to the pushes
            // here, each result should have at most one element because we have no rotations
            // added to the forest
            if (result.length > 0) {
                ret.set(id, result[0])
            }
        }

        return ret
    }

    /**
     * run the logic of the activation phase
     */
    private activationPhase() {
        // serious logic happens here
        // begin with the priority player, and run through the registers, performing actions
        let players_in_priority: (Player)[] = []
        this.players.forEach((player: Player, _: string) => {
            const state = this.player_states.get(player.name) as PlayerState
            players_in_priority.splice(state.priority, 0, player)
        })

        // bluetooth shutdown any robots
        this.shutdowns.forEach((player_id: PlayerID, value2: string, _: Set<PlayerID>) => {
            const player = this.players.get(player_id)
            if (player === undefined || player.character === undefined) return
            // send the action to the bot
            bt.botAction(player.character.id, BotAction.SHUTDOWN)
        })

        // TODO set shutdown players in the renderer

        // for each register
        for (var i = 0; i < 5; i++) {
            // for each player in priority order
            players_in_priority.forEach((player: Player, index: number, arr: Player[]) => {
                // execute their move
                // players who are shutdown do nothing
                if (this.shutdowns.has(player.id)) {
                    return
                }

                const program = this.programs.get(player.id)
                if (program === undefined || this.board === undefined) {
                    return
                }

                const position = this.player_positions.get(player.id) as OrientedPosition
                // convert the card into a series of movements
                const resolved = this.resolveRegister(index, program, player.id)
                const cleaners = new Map<PlayerID, MovementArrayResultsBuilder>()
                
                // process the action and compute pushes simultaneously
                for (const movement of resolved) {
                    // translate this movement to movement frames
                    const absolutized = MovementFrame.fromMovement(movement, position.orientation)
                    // compute the result of each movement frame using a mover forest
                    for (let i = 0; i < absolutized.length; i++) {
                        // get the results of the movement
                        const frame = absolutized[i]
                        
                        if (frame === undefined) {
                            // this shouldn't happen, but we'll check it
                            continue
                        }

                        // frame is an AbsoluteStep
                        const results = this.getBotPushes(player.id, position, frame)
                        for (const [actor, result] of results.entries()) {
                            let builder = cleaners.get(actor)
                            if (builder === undefined) {
                                builder = new MovementArrayResultsBuilder()
                                cleaners.set(actor, builder)
                                builder.padMovementToLength(i)
                            }
                            builder.addFrame(result.movement, result.status, !!result.pushed)
                            // update the positions
                            this.updatePositions(actor, result)
                        }
                    }
                    
                    // end the movement in each builder
                    for (const builder of cleaners.values()) {
                        builder.endMovement()
                    }
                }

                const cleaned = new Map<PlayerID, MovementArrayWithResults>()
                for (const [actor, builder] of cleaners.entries()) {
                    cleaned.set(actor, builder.finish())
                }

                this.executeFrames(cleaned, false)
            })

            // execute actions related to board events
            this.boardElements(i)
        }

        // reset their programs
        this.resetPrograms()
        // update the phase
        const message: Main2ServerMessage<GamePhase> = {
            name: Main2Server.PHASE_UPDATE,
            data: GamePhase.Upgrade
        }
        this.M2SSender(message)
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
     * @param register the index of the register to resolve
     * @param program the program to resolve the action from
     * @param player_id the id of the player who owns this program
     * @returns an array of movements to be taken
     */
    private resolveRegister(register: number, program: RegisterArray, player_id: PlayerID, card: ProgrammingCard|undefined=undefined): Movement[] {
        const actions: ProgrammingCard[] = program[register]
        const o = this.player_positions.get(player_id)?.orientation as Orientation
        // if there is no program for some reason, or the player is on shutdown, take no actions
        if (actions.length == 0 || this.shutdowns.has(player_id)) {
            return []
        }

        // if there are more than 2 cards, that's a serious issue
        if (actions.length > 2) {
            console.warn(`${player_id} sent too many cards (${actions.length})`)
        }

        // this should be the crab-legs option
        if (actions.length == 2) {
            return this.handle2CardMovement(program[register])
        }

        // if we were not given a card, pull from the program
        if (card === undefined) {
            card = actions[0]
        }

        // resolve spam
        if (card.action == ProgrammingCard.spam) {
            const deck = (this.decks.get(player_id) as DeckManager)
            do {
                card = deck.drawCard()
            } while (card.action != ProgrammingCard.spam)
            // discard the card, it wasn't actually in the register
            // any spam drawn don't have to be discarded
            deck.discard(card)
            return this.resolveRegister(register, program, player_id, card)
        }

        // resolve again
        if (card.action == ProgrammingCard.again) {
            if (register == 1) {
                card = {action: ProgrammingCard.spam, id: -1}
                // recurse to handle the card in the previous register again
                return this.resolveRegister(register, program, player_id, card)
            } else {
                // resolve the previous register again
                return this.resolveRegister(register-1, program, player_id)
            }
        }

        // if it's power up, add the energy, don't process the card ()
        if (card.action == ProgrammingCard.power_up) {
            this.player_states.get(player_id)?.gainEnergy()
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
}