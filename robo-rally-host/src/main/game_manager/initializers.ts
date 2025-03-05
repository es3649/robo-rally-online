import type { Character, CharacterID, PartialPlayer, Player, PlayerID } from "../models/player"
import type { Board } from "./board"
import type { OrientedPosition } from "./move_processors"
import { BOTS } from "../data/robots"
import type { BotAvailabilityUpdate } from "../models/connection"

export const MAX_PLAYERS = 6
export const MIN_PLAYERS = 2

export class GameInitializer {
    public players = new Map<PlayerID, PartialPlayer>()
    public board: Board|undefined
    private characters_used = new Set<CharacterID>()

    public constructor() {}

    public todo(): Map<PlayerID, string[]> {
        const todo = new Map<PlayerID, string[]>()
        const generals: string[] = []

        // if we don't have a board, that's number 1
        if (this.board === undefined) {
            generals.push('Select a board')
        }

        // if there are not enough players yet, that's also an issue
        if (this.players.size < MIN_PLAYERS) {
            generals.push('Not enough players (minimum 2)')
        }

        if (generals.length > 0) {
            todo.set('General', generals)
        }

        // loop over the existing players and see what they have to do still
        for (const [player_id, player] of this.players.entries()) {
            // evaluate the player object and see how ready they are
            // each player must have:
            // * a color
            // * a character
            const player_todo: string[] = []
            if (player.character == undefined) {
                player_todo.push(`${player.name} must choose a character`)
            }

            // if its nonempty, add it
            if (player_todo.length > 0) {
                todo.set(player_id, player_todo)
            }
        }

        return todo
    }

    /**
     * Adds a new player to the game
     * @param player_name the name of the player we are adding to the game
     * @returns false if the player couldn't be added
     */
    addPlayer(player_name: string, player_id: string): boolean {
        // don't allow adding more than max players
        // don't allow duplicate player IDs
        if (this.players.size >= MAX_PLAYERS || this.players.has(player_id)) {
            return false
        }
        // build the player object
        const player: PartialPlayer = {
            name: player_name,
            id: player_id,
        }

        // add this player to our registry
        this.players.set(player_id, player)

        // return the conn details to the caller
        return true
    }

    /**
     * gets the sub-array of the constant BOTS array which have not yet been selected by any
     * player
     * @returns the list of known characters which are not currently in use
     */
    getUnusedCharacters(): CharacterID[] {
        return BOTS.filter((character:Character) => !this.characters_used.has(character.id)).map((value: Character) => value.id)
    }

    /**
     * sets the character with the given character ID on the player with the given player ID. If
     * either ID is invalid, the character is not set, and if the character is already assigned,
     * it is also not set
     * @param player_id the id of the player selecting the character
     * @param character_id the id of the selected character
     * @returns a BotAvailability update, signaling which bots are newly available and newly unavailable
     *  if newly_unavailable is empty, then no bot was set (i.e. operation failed, or bot was already
     *  unavailable)
     */
    setCharacter(player_id: PlayerID, character_id: CharacterID): BotAvailabilityUpdate {
        // get the player
        const result: BotAvailabilityUpdate = {newly_available: [], newly_unavailable: []}
        const player = this.players.get(player_id)
        if (player === undefined) {
            console.warn("Tried to set actor for unknown player")
            return result
        }

        // check if the character is already in use
        if (character_id in this.characters_used) {
            return result
        }

        for (const robot of BOTS) {
            if (robot.id === character_id) {
                // if this player already has a character set
                if (player.character !== undefined) {
                    result.newly_available.push(player.character.id)
                    // unset their old character
                    this.characters_used.delete(player.character.id)
                }
                // set the character, and mark it as set
                player.character = robot
                this.characters_used.add(character_id)
                result.newly_unavailable.push(character_id)
                return result
            }
        }

        console.warn("Unknown bot ID:", character_id)
        return result
    }

    /**
     * checks that the board is selected, there are enough players, and all the players'
     * character data is set
     * @returns true if there are enough players and their characters are all connected
     */
    public ready(): boolean {
        return this.todo().size == 0
    }

    /**
     * returns the players mapping, with the player objects returned as Players, instead of PartialPlayers
     * @returns the mapping of players
     * @throws an error if the game hasn't started or any player hasn't chosen a character
     */
    public getPlayers(): Map<PlayerID, Player> {
        if (!this.ready()) {
            console.warn("Tried to get players before the game is ready")
            throw new Error("Can't get players before game is ready!")
        }
        const ret = new Map<PlayerID, Player>()

        for (const [id, player] of this.players.entries()) {
            // make sure the character is for real
            const character = player.character
            if (character === undefined) {
                console.error("Character for player", id, "is empty somehow")
                throw new Error(`Failed to get character for ${player.name}`)
            }

            ret.set(id, {
                name: player.name,
                id: player.id,
                character: character
            })
        }

        return ret
    }

    /**
     * gets the board (removes the undefined option from the board variable)
     * @returns the board
     * @throws an error if the board is not defined
     */
    public getBoard(): Board {
        if (this.board === undefined) {
            console.warn('Tried to get board before it was defined')
            throw new Error("Can't get board before game is ready!")
        }

        return this.board
    }
}

/**
 * interface for an event-driven initializer
 * 
 * It should maintain:
 * - the priority-ordered list of players (internally)
 * - which player should currently be connecting
 * It should provide
 * - the ability to invoke a position read from the setup apparatus
 *   - ability to indicate if this position is legal
 *   - if successful, this should advance to the next player in priority
 * - ability to get all listed positions
 */
export interface BotInitializer {
    nextPlayer(): PlayerID|undefined
    readPlayerPosition(): Promise<void>
    getStartingPositions: () => Map<PlayerID, OrientedPosition>
}
