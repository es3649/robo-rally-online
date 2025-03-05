<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useConnectionsStore } from '../stores/render_connections_store'
import router from '../router';
import qrcodegen from 'nayuki-qr-code-generator';
import { toSvgString } from '../qr';
import { SetupPhase, useGameDataStore } from '../stores/render_game_data_store';
import { PlayerID } from 'src/main/models/player';

const r_cs = useConnectionsStore()
const r_gds = useGameDataStore()

function openLobby(): void {
    r_cs.getIP().then((value: string|undefined):void => {
        if (value !== undefined) {
            const qr0 = qrcodegen.QrCode.encodeText(`http://${r_cs.ip}`, qrcodegen.QrCode.Ecc.MEDIUM)
            r_gds.qr.view_box = `0 0 ${qr0.size + 4} ${qr0.size +4}`
            r_gds.qr.svg_path = toSvgString(qr0)
        }
    })
    r_cs.getToDos().then((value: Map<PlayerID, string[]>) => {
        r_gds.to_dos = value
    })
    r_gds.setup_status = SetupPhase.Lobby
}

function start(): void {
    // send a start notification to the main thread
    r_cs.sendStart().then((ok: boolean) => {
        if (!ok) {
            // log an error message to the display
            console.warn("Failed to start game")
            return
        }

        // update our phase
        r_gds.setup_status = SetupPhase.Done
        // go to the game thread
        router.replace('/game')
    })
}
</script>

<template>
    <main>
        <div v-if="r_gds.setup_status == SetupPhase.Lobby">

            <p>Join IP: <span>{{ r_cs.ip }}</span></p>
            <div v-if="r_cs.ip">
                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" :view-box="r_gds.qr.view_box" stroke="none">
                    <!-- <rect width="100%" height="100%" fill="#ffffff"/> -->
                    <path :d="r_gds.qr.svg_path" fill="#ebebeb" />
                </svg>
            </div>
            <div v-else>
                <p>Failed to get IP address</p>
                <ul>
                    <li>Is network access disabled?</li>
                    <li>Are you connected to a network?</li>
                </ul>
            </div>

            <table>
                <tr>
                    <th>Player</th>
                    <th>Character</th>
                </tr>
                <tr v-for="[player_id, name] of r_gds.players" :key="player_id">
                    <td>{{ name }}</td>
                    <td>{{ r_gds.characters.has(player_id) ? r_gds.characters.get(player_id).name : "[No character selected]" }}</td>
                </tr>
            </table>

            <div v-if="r_gds.to_dos.size > 0">
                <h4>The following must be addressed before beginning the game</h4>
                <ul v-for="[player, actions] in r_gds.to_dos" :key="player">
                    <!-- <td>{{ player }}:</td> -->
                    <li v-for="line in actions">{{ line }}</li>
                </ul>
            </div>
            <div v-else>
                <p>Ready!</p>
            </div>
            <button :disabled="r_gds.to_dos.size > 0" @click="start">Start Game</button>
        </div>
        <!--
            - start with selecting board settings and whatnot
            - have a button to open the lobby to players, and display local IP address
            - display which players have joined, which bot they have selected, and whether the bot is online yet
            - button to start the game -->
            
            
            
        <p>Board: {{ r_gds.board_name }}</p>
        <button v-if="r_gds.setup_status != SetupPhase.Lobby" @click="openLobby">Start Lobby</button>
    </main>
</template>

<style scoped>
svg path {
    transform: scale(5.0);
    -ms-transform: scale(5.0);
    -webkit-transform: scale(5.0);
}
</style>