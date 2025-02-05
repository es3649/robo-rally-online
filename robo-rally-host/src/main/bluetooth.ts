import { createBluetooth, type Adapter, type Device, type GattService } from "node-ble";
import type { CharacterID, PlayerID } from "./models/player"
import { ActionFrame, BotMovement, BotState } from "./game_manager/executor";
import type { MovementExecutor } from "./game_manager/executor";
import { v4 as uuid4 } from "uuid";

/** a timeout value (ms) */
const TIMEOUT = 15000
const SERVICE_ID = "346642f1-48ef-49fc-a6a6-8a782eb06f26"
const STATE_CHARACTERISTIC = "fd2deb9e-d600-46ba-9f3b-0f8fe52a5b0b"
const SOUND_CHARACTERISTIC = "67b35a19-03be-41f4-859a-db8487711878"
const MOVEMENT_DIRECTION_CHARACTERISTIC = "66d8cf14-fe99-4937-83f1-8504fd093731"
const IDEMPOTENCY_CHARACTERISTIC = "e542d2b4-4a28-4fd2-8a6d-9be1371ea03e"
const RFID_CHARACTERISTIC = "2970f9ef-277c-49f8-ab1c-096e45242807"

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
    private connections = new Map<PlayerID, Device>()
    private discovering = false
    private actions_set = new Set<PlayerID>()

    /**
     * create a BluetoothManager
     */
    constructor () {}

    /**
     * sets up the bluetooth adapter. This will throw if Bluetooth is not set up correctly
     * 
     */
    async setup(): Promise<void> {
        const {bluetooth, destroy} = createBluetooth()

        this.destroyer = destroy
        bluetooth.defaultAdapter().then((value: Adapter) => {
            this.adapter = value
        })
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
    async connectRobot(player_id: PlayerID, bot_id: CharacterID): Promise<boolean> {
        // try to establish a connection
        console.log(`Attempting bluetooth connection to ${name}`)
        if (this.adapter == undefined || !this.discovering) {
            return false
        }
    
        // try to connect to the device
        try {
            const device = await this.adapter.waitDevice(bot_id, TIMEOUT)
            await device.connect()
            
            // save the device internally
            this.connections.set(player_id, device)

            // set the initial state
            this.setMode(player_id, BotState.SHUTDOWN)
        } catch (error) {
            console.error(error)
            return false
        }

        return true
    }

    /**
     * helper method to get the Gatt Service from the device stores on the connection manager
     * @param player_id the id of the player to get the gatt service for
     * @returns the GattService for this player's BLE connection
     */
    private async getService(player_id: PlayerID): Promise<GattService|undefined> {
        const device = this.connections.get(player_id)
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
    async setAction(player_id: PlayerID, action: ActionFrame): Promise<void> {
        console.log(`sending movement to ${player_id}`)

        // check which attributes are set on the given ActionFrame
        if (ActionFrame.isEmpty(action)) {
            // there's nothing to do here
            return
        }

        // add that this player has an action set
        this.actions_set.add(player_id)

        // get the service
        const service = await this.getService(player_id)
        if (service === undefined) {
            // TODO error handling, is the character disconnected?
            return
        }

        if (action.pre_action !== undefined) {
            const action_characteristic = await service.getCharacteristic(SOUND_CHARACTERISTIC)
            await action_characteristic.writeValue(Buffer.from(action.pre_action))
        }

        if (action.end_state !== undefined) {
            await this.setMode(player_id, action.end_state, service)
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
        const idempotency = uuid4()

        for (const player of this.actions_set) {

            const service = await this.getService(player)
            if (service === undefined) {
                console.error("Failed to get service for", player)
                continue
            }
            const idempotency_characteristic = await service.getCharacteristic(IDEMPOTENCY_CHARACTERISTIC)
            idempotency_characteristic.writeValue(Buffer.from(idempotency))
        }

        this.actions_set.clear()
    }

    /**
     * starts receiving notifications from the bot with RFIDs read. This will continue, and the call back will be called
     * on any value change until stopPositionNotifications is called
     * @param player_id the id of the player we will watch for positions on
     * @param callback the function we will call when the position value changes
     */
    private async startPositionNotifications(player_id: CharacterID, callback: (buffer: Buffer) => void): Promise<void> {
        console.log(`starting spawn location notifications for ${player_id}`)

        const service = await this.getService(player_id)
        if (service === undefined) {
            console.warn(`TODO: better error handling: failed to get service for ${player_id}`)
            return
        }
        
        // subscribe to notifications
        const characteristic = await service.getCharacteristic(RFID_CHARACTERISTIC)
        characteristic.on('valuechanged', callback)

        // set the state to RFID read so that these values start getting read
        this.setMode(player_id, BotState.GET_POSITION, service)
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
     * @param player_id the id of the player to get the position of
     * @param callback the callback function for setting the position. It should return true if the
     * position given is acceptable and no more positions are needed
     */
    async getPosition(player_id: PlayerID, callback: (position_id: string) => void): Promise<void> {
        const callback_wrapper = (data_buffer: Buffer): void => {
            const decoder = new TextDecoder('UTF-8')
            callback(decoder.decode(data_buffer))
        }

        this.startPositionNotifications(player_id, callback_wrapper)
    }

    /**
     * wraps stopPositionNotifications, provided to implement MovementExecutor
     * @param player_id the id of the player whose position is now set, and no longer needs to
     * receive position updates
     */
    async positionSet(player_id: PlayerID): Promise<void> {
        await this.stopPositionNotifications(player_id)
    }

    /**
     * sets the BLE characteristic for the bot state to the specified value for the specified player's bot
     * @param player_id the id of the player whose bot will have the state set
     * @param mode the state to set
     */
    async setMode(player_id: PlayerID, mode: BotState, service?: GattService): Promise<void> {
        if (service === undefined) {
            service = await this.getService(player_id)
        }
        if (service === undefined) { // still...
            console.warn(`TODO: failed to get service for ${player_id}`)
            return
        }
        const characteristic = await service.getCharacteristic(STATE_CHARACTERISTIC)
        characteristic.writeValue(Buffer.from([mode]))
    }
}
