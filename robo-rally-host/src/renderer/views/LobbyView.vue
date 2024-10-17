<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useConnectionsStore } from '../stores/connections_store'
import router from '../router';
import qrcodegen from 'nayuki-qr-code-generator';
import { toSvgString } from '../qr';

const connections_store = useConnectionsStore()

const boards: Ref<string[]> = ref([])

window.mainAPI.listBoards().then((listed: string[]) => {
    boards.value = listed
})

const board: Ref<string> = ref("")
const lobby_open: Ref<boolean> = ref(false)
const ip = ref('')
const view_box = ref('')
const svg_path = ref('')

async function openLobby(): Promise<void> {
    lobby_open.value = true
    ip.value = await connections_store.getIP()
    const qr0 = qrcodegen.QrCode.encodeText(`http://${ip}`, qrcodegen.QrCode.Ecc.MEDIUM)
    view_box.value = `0 0 ${qr0.size + 4} ${qr0.size +4}`
    svg_path.value = toSvgString(qr0)
}
</script>

<template>
    <main>
        <p v-if="lobby_open">Join IP: <span>{{ ip }}</span></p>
        <!-- <svg xmlns="http://www.w3.org/2000/svg" version="1.1" :view-box=view_box, stroke="none">
            <rect width="100%" height="100%" fill="#ffffff"/>
            <path :d=svg_path fill="#000000" />
        </svg> -->
        <!--
        - start with selecting board settings and whatnot
        - have a button to open the lobby to players, and display local IP address
        - display which players have joined, which bot they have selected, and whether the bot is online yet
        - button to start the game -->
        
        
        <p>{{ board }}</p>
        <button v-if="!lobby_open" @click="openLobby">Start Lobby</button>
    </main>
</template>