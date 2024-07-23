import { GameAction, GamePhase, RegisterArray, UpgradeCard } from './game_data'
export declare interface ConnectionDetails {
    host: string,
    port: number,
    playerID: string
}

export interface ServerToClientEvents {
    noArg: () => void
    basicEmit: (a:number, b:string, c:boolean) => void
    withAck: (d:string, callback: (e:number) => void) => void

    beginPhase: (a: GamePhase) => void
    showAction: (action: GameAction) => void
    requestInput: (message: string, image: string, callback: (resp: boolean) => void) => void
    updatePlayerData: (data:any) => void
}

export interface ClientToServerEvents {
    submitProgram: (playerID:string, program: RegisterArray) => void
    shutdown: () => void
    buyUpgrade: (callback: (upgrade: UpgradeCard) => void) => void
    equipUpgrade: (upgrade: UpgradeCard) => void
    useUpgrade: (upgrade: UpgradeCard) => void
}

export namespace ServerEvents {
    export const beginPhase = 'beginPhase'
    export const showAction = 'showAction'
    export const requestInput = 'requestInput'
    export const updatePlayerData = 'updatePlayerData'
}

export namespace ClientEvents {
    export const submitProgram = 'submitProgram'
    export const shutdown = 'shutdown'
    export const buyUpgrade = 'buyUpgrade'
    export const equipUpgrade = 'equipUpgrade'
    export const useUpgrade = 'useUpgrade'
}