<script setup lang="ts">
import router from '../router'
import Robot from '../components/Robot.vue'

import { BOTS } from '../../shared/data/robots';
import { onBeforeUnmount } from 'vue';
import { useGameDataStore } from '../stores/render_game_data_store';

const r_gds = useGameDataStore()

const refresher = setInterval(() => {
    // call the main process back to get the status of this robot, and see if anyone is using it
    r_gds.getBotConnectionStatuses()
}, 2000) // every 2s

// add an execution hook to disable the timeout just before we navigate away from this element
onBeforeUnmount(() => {
    clearInterval(refresher)
})
</script>

<template>
    <h1>Robot Settings</h1>

    <div class="flex flex-rows">
        <div v-for="bot of BOTS" class="robot-card">
            <Robot :robot="bot" />
        </div>
    </div>
</template>

<style lang="css" scoped>
.robot-card {
    width: 20em;
}
</style>