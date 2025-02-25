<script setup lang="ts">
import { Character } from '../../main/models/player';
const props = defineProps<{
    robot: Character
}>()
import { useConnectionsStore } from '../stores/connections_store';

const connections_store = useConnectionsStore()

function reconnect() {
    window.mainAPI.connectRobot(props.robot.name)
}
</script>


<template>
    <main>
        <img src="" class="sprite" />
        <p>{{ robot.name }}</p>
        <div :style="false"></div>
        <button @click="reconnect()">Connect</button>
    </main>
</template>