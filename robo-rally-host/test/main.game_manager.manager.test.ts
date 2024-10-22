import { expect, jest, test } from '@jest/globals'
import { GameManager } from '../src/main/game_manager/manager'
import { senderMaker } from '../src/main/models/connection'

function send(message: any,
    sendHandle?: any,
    options?: { keepOpen?: boolean|undefined } | undefined,
    callback?: ((error: Error|null) => void) | undefined
): boolean {
    return true
}

// we will (later) use bluetooth calls to be sure that the desired behavior is correct
// we mock bluetooth to get these values
// jest.mock("../src/main/bluetooth.js")

test('GameManager.addPlayer', () => {

    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)

    // construct the gm
    const gm = new GameManager(sender)

    // add players until we can't
    expect(gm.addPlayer('Matthew', '001')).toBeTruthy()
    expect(gm.addPlayer('James', '001')).toBeFalsy()
    expect(gm.addPlayer('Mark', '002')).toBeTruthy()
    expect(gm.addPlayer('Luke', '003')).toBeTruthy()
    expect(gm.addPlayer('John', '004')).toBeTruthy()
    expect(gm.addPlayer('Paul', '005')).toBeTruthy()
    // using the same name again should be fine
    expect(gm.addPlayer('Paul', '006')).toBeTruthy()
    expect(gm.addPlayer('James', '007')).toBeFalsy()

    // we should not be able to overwrite a player using the same ID
    expect(gm.addPlayer('James', '001')).toBeFalsy()
})

test('GameManager.setProgram', () => {
    // mock the sender
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)

    // construct the gm
    const gm = new GameManager(sender)

    // mock the activation phase function
    const activationMock = jest.fn(() => {})
    // TODO mock bluetooth to test this function
})


test('GameManager.addCharacter', () => {

})