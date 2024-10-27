import { Color } from "../models/player"
import {  PlayerState, type Character, type Player, type PlayerID, type PlayerName } from "../models/player"
import type { Main2ServerMessage, Sender } from '../models/connection'
import { GamePhase, newDamageDeck, ProgrammingCard, type RegisterArray } from '../models/game_data'

import type { Board, LaserPosition } from "./board"
import { Main2Server } from "../models/events"
import { botAction, connectRobot, BotAction } from "../bluetooth"
import { DeckManager } from "./deck_manager"
import { type OrientedPosition, type MovementArray, MovementDirection } from "../models/movement"

export const MAX_PLAYERS = 6

/**
 * GameManager class manages the game state and invokes the game logic when it's
 * time to do so.
 */
export class GameManager {
    private started: boolean = false
    private players = new Map<PlayerID,Player>() // maps player names to players
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
        if (this.players.size >= MAX_PLAYERS || this.players.has(player_id)) {
            return false
        }
        // build the player object
        const player: Player = {
            name: player_name,
            id: player_id,
            // get a default color for the player
            colors: Color.by_number(this.players.size)
        }
        
        // set the players initial state
        this.player_states.set(player_id, new PlayerState(player_name, this.players.size))
        
        // add this player to our registry
        this.players.set(player_id, player)
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
        connectRobot(bot.id)
        return true
    }

    private getPlayerPositions() {
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
        for (const player of this.players.values()) {
            if (player.character === undefined) {
                return false
            }
            if (player.colors === undefined) {
                player.colors = Color.GRAY
            }
            if (!connectRobot(player.character.id)) {
                return false
            }
        }
        // add the players to the programs
        this.resetPrograms()
        // set the game to started
        this.started = true

        this.getPlayerPositions()

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

    private executeMovements(movements: Map<string, MovementArray>): void {
        // check if the movement is legal
        // if so, execute it
        // update the local player position
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
        this.executeMovements(conv2)
        
        // conveyors
        const conv = this.board.handleConveyor(this.player_positions)
        this.executeMovements(conv)

        // gears
        const gears = this.board.handleGear(this.player_positions)
        this.executeMovements(gears)
        
        // pushers
        const pushed = this.board.handlePush(this.player_positions, register)
        this.executeMovements(pushed)

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
            botAction(player.character.id, BotAction.SHUTDOWN)
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

                // convert the card into a series of movements
                const movements = this.resolveRegister(index, program, player.id)
                // preprocess the action using the board data; create a modified movement array if needed

                // verify that the execution of the movement array is legal from the current position
                    // i.e.: (no walls in the way of any movements)
                // discover any pushing of other bots

                // execute the action(s)
                
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
    private handle2CardMovement(actions: ProgrammingCard[]): MovementArray {
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
    private resolveRegister(register: number, program: RegisterArray, player_id: PlayerID, card: ProgrammingCard|undefined=undefined): MovementArray {
        const actions: ProgrammingCard[] = program[register]
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