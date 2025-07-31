<script setup lang="ts">
import { ref } from 'vue';
import { Character } from '../../shared/models/player';
const props = defineProps<{
    robot: Character
}>()
import { useConnectionsStore } from '../stores/render_connections_store';

const r_cs = useConnectionsStore()

const symbol = ref('bt_unk')
let upping = true

function reconnect() {
    symbol.value = "bt_connecting0"
    const load_img = setInterval(() => {
        if (symbol.value.endsWith('0')) {
            upping = true
            symbol.value = 'bt_connecting1'
        } else if (symbol.value.endsWith('2')) {
            upping = false
            symbol.value = 'bt_connecting1'
        } else {
            if (upping) {
                symbol.value = "bt_connecting2"
            } else {
                symbol.value = "bt_connecting0"
            }
        }
    }, 1000)
    r_cs.connectRobot(props.robot.id).then((value: boolean) => {
        clearInterval(load_img)
        symbol.value = value ? 'bt_connected' : 'bt_disconnected'
    }).catch((reason) => {
        console.warn(`Failed to connect ${props.robot.name}`, reason)
        clearInterval(load_img)
        symbol.value = 'bt_unk'
    })
}
</script>

<template>
    <main class="gridded robot-card-grid">
        <img :src="robot.sprite_small" class="sprite" />
        <div>
            <p>{{ robot.name }}</p>
            <img :src="`res://icons/${symbol}.svg`"></img>
            <div :style="false"></div>
            <button @click="reconnect()">Connect</button>
        </div>
    </main>
</template>

<style lang="css" scoped>
.robot-card-grid {
    grid-template-columns: 1fr 2fr;
}
</style>