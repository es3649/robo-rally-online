import type { Sender } from "@/main/models/connection";
import { Server2Main, type Server2MainMessage } from "@/main/models/events";

export function makeJoinHandler(id: string, sender: Sender<Server2Main>): (name:string, callback:(ok: boolean) => void) => void {
    function join(name: string, callback:(ok:boolean) => void): void {
        sender<never>({
            name: Server2Main.ADD_PLAYER,
            id: id
        })
    }
    return join
}