/**
 * the GameStateManager class is essentially a monstrous state machine. Each method technically
 * represents a state transition. The state awareness allows the class to return and the entire
 * program to go dormant while awaiting player/bluetooth input.
 */
import { type PlayerID } from "../models/player"
import type { Board, LaserPosition } from "./board"
import { PlayerManager } from "./player_manager"
import { MovementArrayWithResults, MovementFrame, MovementMapBuilder, MovementStatus, type OrientedPosition } from "./move_processors"
import type { Main2Server } from "../models/events"
import type { Sender } from "../models/connection"
import { isRotation, Orientation, type Movement } from "../models/movement"
import type { RegisterArray } from "../models/game_data"
import type { BotInitializer, GameInitializer } from "./initializers"
import { BotMovement, BotState, type ActionFrame, type MovementExecutor } from "./executor"

enum TurnPhase {
    MOVEMENT,
    // conveyor2 behavior is executed in 2 steps, designated a and b
    CONVEYOR2_a,
    CONVEYOR2_b,
    CONVEYOR,
    GEARS,
    PUSHERS,
    BOARD_LASERS,
    ROBOT_LASERS,
    BATTERIES,
    CHECKPOINTS
}

/**
 * This class needs to be implemented like so:
 *  every minute operation (resolving a movement, resolving a register, inflicting damage) needs its own
 *  function. At the end of each function, we run through all the possible stoppage scenarios, and set them
 *  in the awaiting responses map. After we do, if there are any responses needed, we set the core parameters
 *  to reflect the current state, then return. If there are no responses needed, we may continue: call the
 *  function for the next operation.
 * 
 * NOTE: this seems like it would create massive call stacks, however, due to tail call optimization, it may not consume
 * any stack frames at all. The call for the next operation just has to happen last
 */
export class GameStateManager {
    
    private awaiting_responses = new Map<PlayerID, string>()
    private register: number = 0
    private priority: number = 0
    private next_board_element: TurnPhase = TurnPhase.MOVEMENT
    private movements: MovementFrame[] = []
    private movements_position: number = 0
    private movement_frames = new Map<PlayerID, MovementArrayWithResults>()
    private movement_frames_position: number = 0
    private damage = new Map<PlayerID, number>()
    private readonly player_count: number
    private readonly player_manager: PlayerManager
    private readonly board: Board
    private readonly movement_executor: MovementExecutor
    private readonly sender: Sender<Main2Server>
    // private game_manager: GameManager

    public constructor(player_initializer: GameInitializer,
            bot_initializer: BotInitializer,
            executor: MovementExecutor,
            event_sender: Sender<Main2Server>) {
        // this.game_manager = new GameManager()
        this.player_count = player_initializer.players.size
        // set up the player manager
        this.player_manager = new PlayerManager(player_initializer.getPlayers(),
            bot_initializer.getStartingPositions())
        
        this.board = player_initializer.getBoard()
        this.movement_executor = executor
        this.sender = event_sender
    }

    /**
     * sets a result on the class, then resumes execution if all expected responses are in
     * @param player the id of the player submitting the result
     * @param result the value of the result
     */
    public setResult(player: PlayerID, result: string): void {
        this.awaiting_responses.set(player, result)

        // check if all results are in, if so, call resume
        for (const response of this.awaiting_responses.values()) {
            // keep waiting
            if (response === undefined) return
        }

        this.resume()
    }

    // this guy is going to be a bugger
    private resume(): void {
        // if there are movement frames to execute, then execute them
        if (this.movement_frames.size > 0) {
            this.executeMovementFrames()
            return
        } else if (this.movements.length > 0) {
            // if there are movements, then execute those (as active priority player)
            this.executeMovements()
            return
        } else if (this.damage.size > 0) {
            this.applyDamage()
            return
        }
        // otherwise all movements are done, so do the next board element
        switch (this.next_board_element) {
            case TurnPhase.MOVEMENT:
                this.resolveRegister()
                break
            case TurnPhase.CONVEYOR2_a:
            case TurnPhase.CONVEYOR2_b:
                this.conveyor2()
                break
            case TurnPhase.CONVEYOR:
                this.conveyor()
                break
            case TurnPhase.GEARS:
                this.gears()
                break
            case TurnPhase.PUSHERS:
                this.pushers()
                break
            case TurnPhase.BOARD_LASERS:
                this.boardLasers()
                break
            case TurnPhase.ROBOT_LASERS:
                this.robotLasers()
                break
            case TurnPhase.BATTERIES:
                this.batteries()
                break
            case TurnPhase.CHECKPOINTS:
                this.checkpoint()
                break
        }
    }

    /**
     * sets the program for the given player on the PlayerManager
     * @param player_id the id of the player submitting the program
     * @param program the program to be submitted
     */
    public setProgram(player_id: PlayerID, program: RegisterArray): void {
        const ready = this.player_manager.setProgram(player_id, program)
        if (ready) {
            console.log("All programs received, beginning execution")
            // unlatch the movements for actors which are shutdown
            // these actions will have been set on setShutdown before programs are submitted
            this.movement_executor.unlatchActions()

            // continue to execution
            this.resolveRegister()
        }
    }

    /**
     * Marks the payer as having shutdown this round
     * @param player_id the id of the player to set a shutdown
     */
    public setShutdown(player_id: PlayerID): void {
        this.player_manager.setShutdown(player_id)
        this.movement_executor.setAction(player_id, {end_state: BotState.SHUTDOWN})
    }

    /**
     * Resolves the actions in the current player's current register. 
     * 
     * in this function, we really just need to get the list
     * of movements we are going to try to do. the bot is going to try to execute these
     * regardless of the action(s) of other bots. We can send these to be evaluated
     * elsewhere as they are executed: set them on the class, then invoke
     * movement() to do the actual evaluation and execution.
     */
    private resolveRegister(): void {
        // check the priority
        if (this.priority >= this.player_count) {
            console.log('all registers resolved, continuing...')
            // just move on
            this.next_board_element = TurnPhase.CONVEYOR2_a
            this.conveyor2()
            return
        }

        const player_id = this.player_manager.getPlayerByPriority(this.priority)
        console.log(`resolving register ${this.register} for ${player_id}`)
        let position = this.player_manager.getPosition(player_id)
        // if there is no position, it's likely because the player is offline
        if (position === undefined) {
            console.log("player has no position, skipping player")
            this.priority += 1
            this.resolveRegister()
            return
        }

        let resolved_movements: Movement[] = []
        if (false) {
            // run a pre-check to see if the card is anything which requires a choice to be made
            // if so, use the results of that choice instead of the results here
            // make this check a function on the PlayerManager

            // check if there is a response to the selected choice in the awaiting_responses, if so,
            // use that choice, then delete it. Otherwise, request a choice and return
        } else {
            // resolve the register the normal way
            resolved_movements = this.player_manager.resolveRegister(this.register, player_id)
        }

        // we should now have a list of movements
        if (resolved_movements.length == 0) {
            // there are no movements, could be due to a shutdown, just continue
            this.priority += 1
            this.resolveRegister()
            return
        }

        // zero out any movement data
        this.movements = []
        this.movements_position = 0

        // convert the movements to frames
        for (const movement of resolved_movements) {
            const frames = MovementFrame.fromMovement(movement, position.orientation)
            // if this is a rotation, update the orientation
            // otherwise, it should be invariant under any other action (no effect causes another actor to turn)
            for (const frame of frames) {
                this.movements.push(frame)
            }
        }

        // execute the movement
        this.executeMovements()
    }

    /**
     * executed the movements (not movement frames) set on the state manager. They are evaluated and the results 
     * submitted to executeMovementFrames, and its assumed these are the movements of the player with the currently
     * set priority. We evaluate results here because if the player is pushed into a pit or something, movement
     * needs to terminate. Positions are also updated here to maintain an accurate understanding of the board state
     * for the evaluation
     */
    private executeMovements(): void {
        console.log(`executing movements (register ${this.register})`)
        if (this.movements.length === 0 || this.movements_position >= this.movements.length) {
            // then we are done here, zero ourselves out, move to the next player in priority, and resume?
            console.log('no more movements to execute, continuing')
            this.movements = []
            this.movements_position = 0
            this.priority += 1
            this.resume()
            return
        }

        const active_player = this.player_manager.getPlayerByPriority(this.priority)
        const evaluator = (pos: OrientedPosition, move: MovementFrame) => this.board.getMovementResult(pos, move)
        const builder = new MovementMapBuilder<PlayerID>()

        // use the movement evaluator to build a MovementResult map until something comes up an issue:
        const movement_results = this.player_manager.getBotPushes(active_player, this.movements[this.movements_position], evaluator)
        
        builder.appendMovements(movement_results)

        // this will need to be updated even if we are not ok
        this.movements_position += 1


        // we are either done, or not OK:
        // send these movement to the frame executor
        this.movement_frames = builder.finish()
        this.executeMovementFrames()
    }

    /**
     * executed movement frames one at a time, sending them to the executor to be executed.
     * Additionally, it updates the player positions by the action of the movements we execute
     */
    private executeMovementFrames(): void {
        console.log(`executing movement frame (register ${this.register}, phase ${this.next_board_element})`)
        // move through the list of movement frames and execute them
        let executed_any_frames = false
        for (const [actor, results] of this.movement_frames) {
            if (this.movement_frames_position < results.length) {
                executed_any_frames = true
                const action: ActionFrame = {}
                // get the move
                const result = results.getResult(this.movement_frames_position)

                // if it exists...
                if (result.movement !== undefined) {
                    // get the player;s position
                    const position = this.player_manager.getPosition(actor)
                    // FIXME if this is coming through on a rotation from a movement, getting the position here will not give
                    // the correct orientation because it will have already been updated
                    if (position === undefined) {
                        console.warn('Failed to get position for actor:', actor)
                    } else {
                        // use that to create a relativized BotMovement and set it on the action
                        action.movement = BotMovement.fromFrame(result.movement, position.orientation)
                    }

                    // now that we have set the move on the action, we can update the position
                    this.player_manager.updatePositions(actor, result, this.register)
                }

                // check if the bot fell off the map, if so: b'bye
                if (result.status === MovementStatus.PIT) {
                    this.player_manager.setShutdown(actor)
                    action.end_state = BotState.SHUTDOWN
                }

                this.movement_executor.setAction(actor, action)
            }
        }

        if (executed_any_frames) {
            this.movement_executor.unlatchActions()
            // repeat for the next frame
            this.movement_frames_position++
            this.executeMovementFrames()
        } else {
            console.log('no more frames to execute, continuing')
            this.movement_frames.clear()
            this.movement_frames_position = 0
            this.resume()
        }
    }

    /**
     * apply damage to the actors from the damage array set on the class
     */
    private applyDamage(): void {
        console.log('applying damage')
        // handle any damage-taking-specific actions here
        // assign the damage
        this.player_manager.dealDamages(this.damage, this.register)
        this.damage.clear()
        this.resume()
    }

    /**
     * conveyor2 handles the execution of 2-step conveyor belts. Since positions and pits and whatnot
     * all need to be evaluated between the first and second activation, we 
     */
    private conveyor2(): void {

        // get the actions of the first conveyor2 activation
        this.movement_frames_position = 0
        this.movement_frames = this.board.handleConveyor2(this.player_manager.getPositions())
        if (this.next_board_element === TurnPhase.CONVEYOR2_a) {
            console.log('processing first conveyor2 execution')
            this.next_board_element = TurnPhase.CONVEYOR2_b
        } else {
            console.log('processing second conveyor2 execution')
            this.next_board_element = TurnPhase.CONVEYOR
        }
        this.executeMovementFrames()
    }

    /**
     * executes the actions of the 1-step conveyors, setting movements on the class,
     * then invoking their execution
     */
    private conveyor(): void {
        console.log('processing conveyor execution')
        // get the movements and set them on the executor, then execute
        this.movement_frames_position = 0
        this.movement_frames = this.board.handleConveyor(this.player_manager.getPositions())
        // set up for gears to execute next
        this.next_board_element = TurnPhase.GEARS
        this.executeMovementFrames()
    }

    /** 
     * executes the actions of gears on the board, setting movements on the class
     * then invoking their execution
     */
    private gears(): void {
        console.log('processing gear execution')
        this.movement_frames_position = 0
        this.movement_frames = this.board.handleGear(this.player_manager.getPositions())
        
        this.next_board_element = TurnPhase.PUSHERS
        this.executeMovementFrames()
    }

    /**
     * computes the actions of the pushers for the current register, and sets it
     * on the class, then invokes their execution
     */
    private pushers(): void {
        console.log('processing pusher execution')
        this.movement_frames_position = 0
        this.movement_frames = this.board.handlePush(this.player_manager.getPositions(), this.register)

        this.next_board_element = TurnPhase.BOARD_LASERS
        this.executeMovementFrames()
    }

    private boardLasers(): void {
        console.log('executing board lasers')
        // get the laser positions, from the board
        const laser_positions = this.board.getLaserOrigins()
        const target_positions = this.player_manager.getPositions()
        this.damage = this.board.handleLaserPaths(laser_positions, target_positions)

        this.next_board_element = TurnPhase.ROBOT_LASERS
        this.applyDamage()
    }

    /**
     * gets the damage from the robot lasers and applies it
     */
    private robotLasers(): void {
        console.log('activating robot lasers')
        // set all players to laser on mode
        for (const [actor, state] of this.player_manager.getPlayerStates().entries()) {
            if (state.active) {
                this.movement_executor.setAction(actor, {end_state: BotState.FIRE_LASER})
            }
        }
        this.movement_executor.unlatchActions()

        // perform the computations while the lasers are on
        const target_positions = this.player_manager.getPositions()
        const laser_positions: LaserPosition[] = []
        // build up the list of laser positions
        for (const [actor, position] of target_positions.entries()) {
            laser_positions.push({
                damage: 1,
                pos: position
            })
        }
        this.damage = this.board.handleLaserPaths(laser_positions, target_positions, false)

        // turn off the lasers
        for (const [actor, state] of this.player_manager.getPlayerStates().entries()) {
            if (state.active) {
                this.movement_executor.setAction(actor, {end_state: BotState.DEFAULT})
            }
        }
        this.movement_executor.unlatchActions()

        this.next_board_element = TurnPhase.BATTERIES
        this.applyDamage()
    }

    /**
     * get the battery positions, and for each actor which is on a battery, increment their
     * energy values on the player manager
     */
    private batteries(): void {
        console.log('executing batteries')
        // get the player locations
        const locations = this.player_manager.getPositions()

        // loop over the player positions
        for (const [actor, position] of locations.entries()) {
            // if it's a battery
            if (this.board.isBatteryPosition(position)) {
                // get energy
                this.player_manager.addEnergy(actor, 1)
            }
        }

        // continue to next phase
        this.next_board_element = TurnPhase.CHECKPOINTS
        this.checkpoint()
    }

    /**
     * handles checkpoints
     */
    private checkpoint(): void {
        console.log('granting checkpoints')
        const positions = this.player_manager.getPositions()

        for (const [actor, position] of positions.entries()) {
            // get this space
            const checkpoint = this.board.checkpoint_map.get(position.x, position.y)

            // if it's a checkpoint, take it
            if (checkpoint !== undefined) {
                this.player_manager.takeCheckpoint(actor, checkpoint)
            }
        }

        this.finish()
    }

    /**
     * finish the board element activation phase and proceed to either the next register
     * or ending the activation phase entirely
     */
    private finish(): void {
        console.log(`finishing register ${this.register}`)
        // check the end condition
        if (this.gameOver() !== undefined) {
            // return. The caller should be checking the game over condition, and we can't
            // guarantee a return from this depth, but we need to halt
            return
        }

        // proceed to the next register
        this.register++
        this.priority = 0
        // if we aren't on the last register, go back to programming stage
        this.next_board_element = TurnPhase.MOVEMENT
        if (this.register < 5) {
            // then we are still playing, go back to movement phase
            this.resolveRegister()
            return
        }

        // otherwise this is the end of the last register
        // reset, then return and await a new set of programs
        this.player_manager.resetPrograms()
        this.player_manager.updatePriority()
        this.register = 0
    }

    /**
     * checks if the end condition has been met
     * @returns the id of the player who won the game
     */
    public gameOver(): PlayerID|undefined {
        console.log('checking win condition')
        // check the end conditions
        const last_checkpoint = this.board.getLastCheckpoint()

        for (const [actor, state] of this.player_manager.getPlayerStates().entries()) {
            // if this is checked every register, then there should only be one player with the
            // checkpoint, so there's no possibility for a tie
            if (state.checkpoints == last_checkpoint) {
                console.log(`${actor} has won`)
                return actor
            }
        }
    }
}