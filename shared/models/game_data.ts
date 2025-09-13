import type { Player } from "./player"
import { MovementDirection, RotationDirection, Rotation, type Movement } from "./movement"

export const PROGRAMMING_HAND_SIZE: number = 9

export type GameAction = {
    action: ProgrammingCard,
    actor: Player
}

export enum GamePhase {
    Lobby = -2,
    Setup = -1,
    Upgrade = 0,
    Programming = 1,
    Activation = 2,
    Finished = 3
}
export namespace GamePhase {
    export function toString(phase: GamePhase): string {
        switch (phase) {
            case GamePhase.Lobby:
                return "Lobby"
            case GamePhase.Setup:
                return "Setup"
            case GamePhase.Upgrade:
                return "Upgrade"
            case GamePhase.Programming:
                return "Programming"
            case GamePhase.Activation:
                return "Activation"
            case GamePhase.Finished:
                return "Finished"
        }
    }
}

export enum BoardElement {
    Players,
    Conveyor2,
    Conveyor,
    Pusher,
    Gear,
    BoardLaser,
    RobotLaser,
    Battery,
    Checkpoint
}
export namespace BoardElement {
    /**
     * Stringified the name of the board element. It is set up return the element in the plural, so that
     * something like "Now activating: <board element>" makes sense
     * @param element the element to stringify
     * @returns the stringified name of the board element
     */
    export function toString(element: BoardElement): string {
        switch (element) {
            case BoardElement.Players:
                return "Player Movements"
            case BoardElement.Conveyor2:
                return "Fast Conveyors"
            case BoardElement.Conveyor:
                return "Conveyors"
            case BoardElement.Pusher:
                return "Pushers"
            case BoardElement.Gear:
                return "Gears"
            case BoardElement.BoardLaser:
                return "Board Lasers"
            case BoardElement.RobotLaser:
                return "Robot Lasers"
            case BoardElement.Battery:
                return "Batteries"
            case BoardElement.Checkpoint:
                return "Checkpoints"
        }
    }
}

export namespace ProgrammingCard {
    export const left = "left"
    export const right = "right"
    export const u_turn = "u_turn"
    export const forward1 = "forward1"
    export const forward2 = "forward2"
    export const forward3 = "forward3"
    export const back = "back"
    export const again = "again"
    export const power_up = "power_up"
    export const spam = "spam"
    export interface ActionChoiceData {
        prompt: string
        options: string[]
    }
    export interface ActionChoice extends ActionChoiceData {
        choice: (option: string) => Movement[]
    }
    export interface Haywire {
        text: string,
        actions: Movement[] | ActionChoice
        special?(...args: any): any // this should be used for 
    }
    export function isActionChoice(obj:Movement[] | ActionChoice): obj is ActionChoice {
        const choice = obj as ActionChoice
        return choice.prompt != undefined && choice.options != undefined && choice.choice != undefined
    }

    export function isHaywire(card:string|undefined|Haywire): card is Haywire {
        if (card === undefined) {
            return false
        }
        const h = card as Haywire
        return h.actions != undefined && h.text != undefined
    }
    export function getText(action: CardAction): string {
        if (isHaywire(action)) {
            return action.text
        }
        switch (action) {
            case left:
                return "Turn Left"
            case right:
                return "Turn Right"
            case u_turn:
                return "U-Turn"
            case forward1:
                return "Move Forward 1"
            case forward2:
                return "Move Forward 2"
            case forward3:
                return "Move Forward 3"
            case back:
                return "Move Back"
            case again:
                return "Again"
            case power_up:
                return "Power Up"
            case spam:
                return "Replace this card with the top card of your programming deck" 
        }
    }
    /**
     * is the action a turn: one of left, right, u_turn
     * @param action the action to check
     * @returns whether the action is a turn
     */
    export function isTurn(action: CardAction) {
        if (isHaywire(action)) {
            return false
        }
        switch (action) {
            case left:
            case right:
            case u_turn:
                return true
            default:
                return false
        }
    }
    /**
     * is the action a movement: one of forward1, forward2, forward3, or back
     * @param action the action to check
     * @returns true if the action moves
     */
    export function isMovement(action: CardAction) {
        if (isHaywire(action)) {
            return false
        }
        switch (action) {
            case forward1:
            case forward2:
            case forward3:
            case back:
                return true
            default:
                return false
        }
    }
    /**
     * Gets the Movement represented by a card
     * @param card the card to derive a movement from. This function may be obsolete
     * @returns the movement that the card represents, or undefined if that card does
     *    not represent a movement
     */
    export function toMovement(card: ProgrammingCard): Movement|undefined {
        // we don't really deal with these
        switch (card.action) {
            case ProgrammingCard.forward1:
                return {direction: MovementDirection.Forward, distance: 1}
            case ProgrammingCard.forward2:
                return {direction: MovementDirection.Forward, distance: 2}
            case ProgrammingCard.forward3:
                return {direction: MovementDirection.Forward, distance: 3}
            case ProgrammingCard.back:
                return {direction: MovementDirection.Back, distance: 1}
            case ProgrammingCard.left:
                return new Rotation(RotationDirection.CCW, 1)
            case ProgrammingCard.right:
                return new Rotation(RotationDirection.CW, 1)
            case ProgrammingCard.u_turn:
                return new Rotation(RotationDirection.CW, 2)
            default: // power_up, again, spam, haywire; action is do nothing or not determinable here
                return
        }
    }
    
    export namespace Movements {

        export const Forward1: Movement = {
            direction: MovementDirection.Forward,
            distance: 1
        }
        export const Forward2: Movement = {
            direction: MovementDirection.Forward,
            distance: 2
        }
        export const Forward3: Movement = {
            direction: MovementDirection.Forward,
            distance: 3
        }
        export const Back: Movement = {
            direction: MovementDirection.Back,
            distance: 1
        }
        export const Right: Movement = new Rotation(RotationDirection.CW, 1)
        export const Left: Movement = new Rotation(RotationDirection.CCW, 1)
        export const U_turn: Movement = new Rotation(RotationDirection.CW, 2)
    }
}
export type CardAction = "left" | "right" | "u_turn" | "forward1" | "forward2" | "forward3" | "back" | "again" | "power_up" | "spam" | ProgrammingCard.Haywire
export type ProgrammingCard = {
    id: number,
    action: CardAction
}

export interface UpgradeCard {
    name: string,
    cost: number,
    // to implement these, gameplay should probably have hooks, that the upgrades attach to
    // when the hook is reached, we sequentially activate all the upgrades on that hook
    effect_hook: any
    // what the thing actually does
    effect: (game_state:any) => void
}

// This is annoying, but here's the data for a standard deck
export function newStandardDeck(): ProgrammingCard[] {
    return [
        {
            action: 'left', 
            id: 0
        },{
            action: 'left', 
            id: 1
        },{
            action: 'left', 
            id: 2
        },{
            action: 'left',
            id: 3
        },{
            action: 'right', 
            id: 4
        },{
            action: 'right', 
            id: 5
        },{
            action: 'right', 
            id: 6
        },{
            action: 'right',
            id: 7
        },{
            action: 'forward1', 
            id: 8
        },{
            action: 'forward1',
            id: 9
        },{
            action: 'forward1',
            id: 10
        },{
            action: 'forward1',
            id: 11
        },{
            action: 'forward2', 
            id: 12
        },{
            action: 'forward2',
            id: 13
        },{
            action: 'forward2',
            id: 14
        },{
            action: 'forward3',
            id: 15
        },{
            action: 'back',
            id: 16
        },{
            action: 'u_turn',
            id: 17
        },{
            action: 'again',
            id: 18
        },{
            action: 'power_up',
            id: 19
        }
    ]
}

export function newDamageDeck(): ProgrammingCard[] {
    // write out the haywires explicitly
    let cards: ProgrammingCard[] = [{
        action: {
            text: 'Move 2, Rotate Right.',
            actions: [{
                direction: MovementDirection.Forward,
                distance: 2
            },new Rotation(RotationDirection.CW, 1)]
        },
        id: 43
    },{
        action: {
            text: 'Rotate Right or Rotate Left.',
            actions: {
                prompt: "Choose a direction",
                options: ['Right', 'Left'],
                choice(option: string): Movement[] {
                    switch (option) {
                        case "Right":
                            return [new Rotation(RotationDirection.CW, 1)]
                            case "Left":
                            return [new Rotation(RotationDirection.CCW, 1)]
                    }
                    
                    return []
                }
            }
        },
        id: 44
    },{
        action: {
            text: 'Move 1, Rotate Left, Move 1.',
            actions: [{
                direction: MovementDirection.Forward,
                distance: 1
            },new Rotation(RotationDirection.CCW, 1),{
                direction: MovementDirection.Forward,
                distance: 1
            }]
        },
        id: 45
    },{
        action: {
            text: 'Rotate to any Facing, Move 1.',
            actions: {
                prompt: "Rotation",
                options: ["None", "Left", "U-Turn", "Right"],
                choice(option:string): Movement[] {
                    let moves: Movement[] = []
                    switch (option) {
                        case "None":
                            break
                        case "Left":
                            moves.push(new Rotation(RotationDirection.CCW, 1))
                            case "U-Turn":
                            moves.push(new Rotation(RotationDirection.CW, 2))
                        case "Right":
                            moves.push(new Rotation(RotationDirection.CW, 1))
                        default:
                            console.warn(`Illegal option in Haywire 46: ${option}`)
                    }
                    moves.push({
                        direction: MovementDirection.Forward,
                        distance: 1
                    })
                    return moves
                }
            }
        },
        id: 46
    },{
        action: {
            text: 'Install a permanent upgrade from your collection of uninstalled upgrades. At the end of round, place that card into the upgrade discard pile.',
            actions: []
        },
        id: 47
    },{
        action: {
            text: 'Move 1, then take the priority token. Do not move the priority token at the end of this round.',
            actions: []
        },
        id: 48
    },{
        action: {
            text: 'Pay 0-8 energy, then move 2 spaces for each energy you paid.',
            actions: {
                prompt: "Pay energy",
                options: ['0','1','2','3','4','5','6','7','8'],
                choice(option: string): Movement[] {
                    try {
                        const energy = Math.round(parseInt(option))
                        if (energy < 0 || energy > 8) {
                            console.warn(`Illegal option in Haywire 49: ${option}`)
                            return []
                        }
                        return [{
                            direction: MovementDirection.Forward,
                            distance: 2*energy
                        }]
                    } catch {
                        console.warn(`Illegal option in Haywire 49: ${option}`)
                        return []
                    }
                }
            }
        },
        id: 49
    },{
        action: {
            text: 'Move back 3.',
            actions: [{
                direction: MovementDirection.Back,
                distance: 3
            }]
        },
        id: 50
    },{
        action: {
            text: 'Move back 1, U-turn.',
            actions: [{
                direction: MovementDirection.Back,
                distance: 1
            }, new Rotation(RotationDirection.CW, 2)]
        },
        id: 51
    },{
        action: {
            text: 'Move 1, rotate right, move 1.',
            actions: [{
                direction: MovementDirection.Forward,
                distance: 1
            },new Rotation(RotationDirection.CW, 1),{
                direction: MovementDirection.Forward,
                distance: 1
            }]
        },
        id: 52
    },{
        action: {
            text: 'Move 2 left or right, without changing facing.',
            actions: {
                prompt: "Movement direction",
                options: ["Left", "Right"],
                choice(option: string): Movement[] {
                    switch (option) {
                        case "Left":
                            return [{
                                direction: MovementDirection.Left,
                                distance: 2
                            }]
                        case "Right":
                            return [{
                                direction: MovementDirection.Right,
                                distance: 2
                            }]
                        default:
                            console.warn(`Illegal option in Haywire 53: ${option}`)
                            return []
                    }
                }
            }
        },
        id: 53
    },{
        action: {
            text: 'Move back 1. Remove a card in your discard pile from the game.',
            actions: []
        },
        id: 54
    },{
        action: {
            text: 'Move 2, rotate left.',
            actions: [{
                direction: MovementDirection.Forward,
                distance: 2
            }, new Rotation(RotationDirection.CCW, 1)]
        },
        id: 55
    },{
        action: {
            text: 'Move 5. If you hit a wall this register take 1 damage.',
            actions: []
        },
        id: 56
    },{
        action: {
            text: "Move 1, your robot's laser deals 1 additional damage this register.",
            actions: []
        },
        id: 57
    },{
        action: {
            text: 'Draw and reveal the top 2 cards of your programming deck. Resolve both in the order of your choosing.',
            actions: []
        },
        id: 58
    },{
        action: {
            text: 'Move 3, U-turn.',
            actions: [{
                direction: MovementDirection.Forward,
                distance: 3
            }, new Rotation(RotationDirection.CW, 2)]
        },
        id: 59
    }]

    // add 23 spams
    for (let i = 0; i < 23; i++) {
        cards.push({
            action: 'spam',
            id: 20+i
        })
    }
    return cards
}

export declare type ProgrammingHand = ProgrammingCard[]
export declare type ProgrammingCardSlot = ProgrammingCard|undefined
export declare type RegisterArray = [ProgrammingCard[], ProgrammingCard[], ProgrammingCard[], ProgrammingCard[], ProgrammingCard[]]

export function newRegisterArray(): RegisterArray {
    return [[], [], [], [], []]
}

/**
 * Check whether a RegisterArray contains any empty slots
 * @param arr an array of ProgrammingCardSlots to check
 * @returns true if any element is undefined
 */
export function anyRegisterEmpty(arr:RegisterArray): boolean {
    /**
     * reduces an array to determine if any element is undefined
     * @param prev the value after the previous iteration
     * @param cur the current array element
     * @param idx the current index
     * @param arr the parent array
     * @returns true if the prev is true or if the current value is undefined
     */
    const anyUndefinedReducer = (prev:boolean, cur:ProgrammingCard[], idx:number, arr:ProgrammingCard[][]): boolean => {
        // return prev || cur === undefined
        return prev || cur.length === 0
    }
    return arr.reduce<boolean>(anyUndefinedReducer, false)
}

export type Program = {
    shutdown: boolean,
    registers: RegisterArray
}
