<script setup lang="ts">
import { Character } from '../../main/models/player';
const props = defineProps<{
    robot: Character
}>()
import { useConnectionsStore } from '../stores/render_connections_store';

const r_cs = useConnectionsStore()

function reconnect() {
    r_cs.connectRobot(props.robot.id)
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