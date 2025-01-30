import { type Character } from "../main/models/player"
import { BOTS } from "../main/data/robots"

// create a mapping of the bots
export const bot_list = new Map<string, {used: boolean} & Character>()

// put the bots in the mapping
for (const bot of BOTS) {
    bot_list.set(bot.name, { used: false, ...bot})
}

export function listUnused(): Character[] {
    let unused: Character[] = []

    // for each bot in the list
    for (const bot of bot_list.values()) {
        if (!bot.used) {
            const rmKey: string = 'used'
            unused.push({
                ...bot,
                [rmKey]: undefined
            })
        }
    }

    return unused
}

/**
 * attempts to reserve a bot from the listing
 * @param name the name of the bot to reserve
 * @returns whether the bot was reserved
 */
export function useBot(name: string): boolean {
    const bot = bot_list.get(name)

    // if there's an issue, say false
    if (bot === undefined || bot.used) {
        return false
    }

    // reserve the bot and return ok
    bot.used = true
    return true
}