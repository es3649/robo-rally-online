import { createBluetooth, type Adapter, type Device, type GattService } from "node-ble";
import type { Character, CharacterID, Player, PlayerID } from "../shared/models/player"
import { ActionFrame, BotMovement, BotState } from "./game_manager/executor";
import type { MovementExecutor } from "./game_manager/executor";
import type { OrientedPosition } from "./game_manager/move_processors";
import type { BotInitializer } from "./game_manager/initializers";
import type { Board } from "./game_manager/board";
import { DualKeyMap } from "./game_manager/graph";

/** a timeout value (ms) */
const TIMEOUT = 15000
const SERVICE_ID                        = "346642f1-0000-49fc-a6a6-8a782eb06f26"
const STATE_CHARACTERISTIC              = "346642f1-0001-49fc-a6a6-8a782eb06f26"
const SOUND_CHARACTERISTIC              = "346642f1-0002-49fc-a6a6-8a782eb06f26"
const MOVEMENT_DIRECTION_CHARACTERISTIC = "346642f1-0003-49fc-a6a6-8a782eb06f26"
const IDEMPOTENCY_CHARACTERISTIC        = "346642f1-0004-49fc-a6a6-8a782eb06f26"
const RFID_CHARACTERISTIC               = "346642f1-0005-49fc-a6a6-8a782eb06f26"

export class BluetoothManager implements MovementExecutor {
    private static instance: BluetoothManager|undefined

    /**
     * gets the instance, creating one if one does not already exist
     * @returns the singleton instance
     */
    public static getInstance() {
        if (BluetoothManager.instance === undefined) {
            BluetoothManager.instance = new BluetoothManager()
        }

        return BluetoothManager.instance
    }

    /**
     * destroy the BluetoothManager instance, releasing its bluetooth resources
     */
    public static async destroy() {
        if (BluetoothManager.instance !== undefined && BluetoothManager.instance.destroyer !== undefined) {
            // shut off all the servers
            for (const [player, device] of BluetoothManager.instance.connections.entries()) {
                await BluetoothManager.instance.stopPositionNotifications(player)
                await device.disconnect()
            }
            BluetoothManager.instance.destroyer()
            BluetoothManager.instance = undefined
        }
    }

    private destroyer: (() => void)|undefined
    private adapter: Adapter|undefined
    private connections = new Map<CharacterID, Device>()
    private discovering = false
    private actions_set = new Set<CharacterID>()
    // ensure this is in the range [1,255]. 0 is reserved so the drivers have a default which will
    // never appear, and we always want to be able to store it in a uint8;
    private last_idempotency_code: number = 1

    /**
     * create a BluetoothManager
     */
    constructor () {}

    /**
     * sets up the bluetooth adapter. This will throw if Bluetooth is not set up correctly
     * 
     */
    async setup(): Promise<void> {
        console.info("Setting up BluetoothManager")
        const {bluetooth, destroy} = createBluetooth()

        this.destroyer = destroy
        this.adapter = await bluetooth.defaultAdapter()
        console.info("BluetoothManager set up")
    }

    /**
     * 
     * Returns a mapping of Device IDs to a boolean indicating whether that device is paired or
     * not. If some devices which are not in use may not have an entry
     * @returns a mapping of device IDs to paring status
     */
    async getConnectionStatuses(): Promise<Map<CharacterID, boolean>> {
        const ret = new Map<CharacterID, boolean>()

        for (const [_, device] of this.connections) {
            const paired = await device.isPaired()
            ret.set(await device.getAddress(), !!paired)
        }

        return ret
    }

    /**
     * set the bluetooth manager to begin discovering devices. Should be called before connectRobot
     */
    async startDiscovering(): Promise<void> {
        if (this.adapter !== undefined && ! await this.adapter.isDiscovering()) {
            await this.adapter.startDiscovery()
        }
        this.discovering = true
    }

    /**
     * end adapter discovery
     */
    async stopDiscovering(): Promise<void> {
        if (this.discovering) {
            await this.adapter?.stopDiscovery()
            this.discovering = false
        }
    }

    /**
     * initiate or validate bluetooth connection to a robot
    * @param name the name/ID of the bot to connect to
    * @returns true if the bot is connected
    */
    async connectRobot(bot: Character): Promise<boolean> {
        // try to establish a connection
        console.log(`Attempting bluetooth connection to ${bot.name}`)
        if (this.adapter == undefined) {
            console.log("adapter is undefined")
            return false
        }
        if (!this.discovering) {
            console.log("can't connect while not discovering!")
            return false
        }
    
        // try to connect to the device
        try {
            const device = await this.adapter.waitDevice(bot.bluetooth_id, TIMEOUT)
            await device.connect()
            
            // save the device internally
            this.connections.set(bot.id, device)

            // set the initial state
            this.setMode(bot.id, BotState.SHUTDOWN)
        } catch (error) {
            console.error(error)
            return false
        }

        return true
    }

    /**
     * helper method to get the Gatt Service from the device stores on the connection manager
     * @param bot_id the id of the player to get the gatt service for
     * @returns the GattService for this player's BLE connection
     */
    private async getService(bot_id: CharacterID): Promise<GattService|undefined> {
        const device = this.connections.get(bot_id)
        if (device === undefined) {
            return undefined
        }

        const gatt = await device.gatt()
        return await gatt.getPrimaryService(SERVICE_ID)
    }

    /**
     * move the identified bot by performing the given movements
     * @param botID the id of the bot to send the command to
     * @param movement the movements the bot should perform
     */
    async setAction(bot_id: CharacterID, action: ActionFrame): Promise<void> {
        console.log(`sending movement to ${bot_id}`)

        // check which attributes are set on the given ActionFrame
        if (ActionFrame.isEmpty(action)) {
            // there's nothing to do here
            return
        }

        // add that this player has an action set
        this.actions_set.add(bot_id)

        // get the service
        const service = await this.getService(bot_id)
        if (service === undefined) {
            // TODO error handling, is the character disconnected?
            return
        }

        if (action.pre_action !== undefined) {
            console.log(`execution for pre-action is not implemented: ${action.pre_action}`)
            // const action_characteristic = await service.getCharacteristic(SOUND_CHARACTERISTIC)
            // await action_characteristic.writeValue(Buffer.from(action.pre_action))
        }

        if (action.end_state !== undefined) {
            await this.setMode(bot_id, action.end_state, service)
        }
        
        // always write the movement in case it is now undefined (meaning no movement), but wasn't
        // previously. Writing a new idempotency code without zeroing it would re-trigger the previous
        // movement
        const movement_characteristic = await service.getCharacteristic(MOVEMENT_DIRECTION_CHARACTERISTIC)
        const le_move = action.movement || BotMovement.NONE
        await movement_characteristic.writeValue(Buffer.from([le_move]))
    }

    async unlatchActions(): Promise<void> {
        // we will use idempotency codes on a broadcasting channel. When this value is changed,
        // we will have the GattClient read their movement values and execute them once, then
        // wait for a new status change.
        console.log('unlatching movements')
        if (this.last_idempotency_code >= 255) {
            // never set the code to be 0. 0 is reserved for a default value in the drivers so that
            // any initial value will still trigger a change
            this.last_idempotency_code = 1
        } else {
            this.last_idempotency_code++
        }

        for (const player of this.actions_set) {

            const service = await this.getService(player)
            if (service === undefined) {
                console.error("Failed to get service for", player)
                continue
            }
            const idempotency_characteristic = await service.getCharacteristic(IDEMPOTENCY_CHARACTERISTIC)
            idempotency_characteristic.writeValue(Buffer.from([this.last_idempotency_code]))
        }

        this.actions_set.clear()
    }

    /**
     * starts receiving notifications from the bot with RFIDs read. This will continue, and the call back will be called
     * on any value change until stopPositionNotifications is called
     * @param bot_id the id of the player we will watch for positions on
     * @param callback the function we will call when the position value changes
     */
    private async startPositionNotifications(bot_id: CharacterID, callback: (buffer: Buffer) => void): Promise<void> {
        console.log(`starting spawn location notifications for ${bot_id}`)

        const service = await this.getService(bot_id)
        if (service === undefined) {
            console.warn(`TODO: better error handling: failed to get service for ${bot_id}`)
            return
        }
        
        // subscribe to notifications
        const characteristic = await service.getCharacteristic(RFID_CHARACTERISTIC)
        characteristic.on('valuechanged', callback)

        // set the state to RFID read so that these values start getting read
        this.setMode(bot_id, BotState.GET_POSITION, service)
    }

    /**
     * releases the notifier on the position characteristic for the player with the given ID
     * @param player_id the id of the player to stop getting notifications for
     */
    private async stopPositionNotifications(player_id: CharacterID): Promise<void> {
        const service = await this.getService(player_id)
        if (service === undefined) {
            console.warn(`TODO: better error handling: failed to get service for ${player_id}`)
            return
        }

        // set the state back to default
        this.setMode(player_id, BotState.DEFAULT)

        // unsubscribe
        const characteristic = await service.getCharacteristic(RFID_CHARACTERISTIC)
        characteristic.stopNotifications()
    }

    /**
     * gets the the position of an actor. In this case, it wraps the callback, making calls to start
     * and stopPositionNotifications, forwarding all notifications through the callback. Once the
     * callback indicates that the position is acceptable, we stop notifications
     * @param bot_id the id of the player to get the position of
     * @param callback the callback function for setting the position. It should return true if the
     * position given is acceptable and no more positions are needed
     */
    async getPosition(bot_id: CharacterID, callback: (position_id: string) => void): Promise<void> {
        const callback_wrapper = (data_buffer: Buffer): void => {
            const decoder = new TextDecoder('UTF-8')
            callback(decoder.decode(data_buffer))
        }

        this.startPositionNotifications(bot_id, callback_wrapper)
    }

    /**
     * wraps stopPositionNotifications, provided to implement MovementExecutor
     * @param bot_id the id of the player whose position is now set, and no longer needs to
     * receive position updates
     */
    async positionSet(bot_id: CharacterID): Promise<void> {
        await this.stopPositionNotifications(bot_id)
    }

    /**
     * sets the BLE characteristic for the bot state to the specified value for the specified player's bot
     * @param bot_id the id of the player whose bot will have the state set
     * @param mode the state to set
     */
    async setMode(bot_id: CharacterID, mode: BotState, service?: GattService): Promise<void> {
        if (service === undefined) {
            service = await this.getService(bot_id)
        }
        if (service === undefined) { // still...
            console.warn(`TODO: failed to get service for ${bot_id}`)
            return
        }
        const characteristic = await service.getCharacteristic(STATE_CHARACTERISTIC)
        characteristic.writeValue(Buffer.from([mode]))
    }
}

/**
 * Initializes bots over bluetooth connections
 */
export class BluetoothBotInitializer implements BotInitializer {
    private priority_list: Player[]
    private connecting: number = 0
    private initial_positions = new Map<PlayerID, OrientedPosition>()
    private used_positions = new DualKeyMap<number, boolean>()
    private board: Board

    public constructor(board: Board, priority_list: Player[]) {
        this.board = board,
        this.priority_list = priority_list
    }

    /**
     * connect the next bot in the priority order, and notify the player that it is their
     * turn to select a position
     */
    public async connectCurrent(): Promise<void> {
        const cur = this.priority_list[this.connecting]
        // make sure a Bluetooth connection is established
        if (!await BluetoothManager.getInstance().connectRobot(cur.character)) {
            throw new Error(`Failed to establish Bluetooth connection with: ${cur.name}'s bot`)
        }
        
        // notify the player that their bot is ready to place
        // TODO
    }

    /**
     * Gets the bluetooth aparattuses set up so that we are ready to establish
     * connections
     */
    public async setup(): Promise<void>{
        await BluetoothManager.getInstance().setup()
        await BluetoothManager.getInstance().startDiscovering()
    }

    /**
     * note that the software is finished setting up new bluetooth connections,
     * takes the system out of discovery mode
     */
    public async finished(): Promise<void> {
        await BluetoothManager.getInstance().stopDiscovering()
    }

    /**
     * gets the id of the next player who needs to select a position. if all players have
     * selected, it returns undefined. It also begins notifications for the bluetooth module
     * so whenever a position is set, we read the new value automatically
     * @returns the id of the next player
     */
    public nextPlayer(): PlayerID | undefined {
        if (this.connecting < this.priority_list.length) {
            const cur = this.priority_list[this.connecting].character.id
            this.connectCurrent().then(() => {
                BluetoothManager.getInstance().getPosition(cur, (position_id: string) => {
                    // look up the position on the board
                    const pos = this.board.getSpawnLocation(position_id)
                    if (pos !== undefined) {
                        // check out current position
                        const used = this.initial_positions.get(cur)
                        if (used !== undefined) {
                            this.used_positions.delete(used.x, used.y)
                        }
                        if (this.used_positions.has(pos.x, pos.y)) {
                            // this is a problem, can't use a used position
                            // unset any position
                            this.initial_positions.delete(cur)
                            return
                        }
                        // set the position
                        this.initial_positions.set(cur, pos)
                        this.used_positions.set(pos.x, pos.y, true)
                    }
                })
            })
            return cur
        }

        return undefined
    }

    /**
     * stops notifications for position changes and advances the "current player" to the
     * next player
     */
    public async readPlayerPosition(): Promise<void> {
        const cur = this.priority_list[this.connecting].id
        // if there's no position, we keep waiting
        if (!this.initial_positions.has(cur)) {
            return
        }
        // read the position from the bluetooth characteristic
        BluetoothManager.getInstance().positionSet(cur)
        this.connecting++
    }

    /**
     * returns a map of all players' starting positions
     * @returns the map of all players' starting positions
     */
    public getStartingPositions(): Map<PlayerID, OrientedPosition> {
        return this.initial_positions
    }
}
