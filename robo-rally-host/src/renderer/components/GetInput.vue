<script setup lang="ts">
import Timer from '../../shared/components/Timer.vue';
import { useGameDataStore } from '../stores/render_game_data_store';

const r_gds = useGameDataStore()

function finish() {
    console.log("Time is up")
    // this should remove the component until we get a new notification
    r_gds.get_input.player = undefined
}

</script>

<template>
    <main>
        <h3>Input Required!</h3>
        <p>Waiting for {{ r_gds.players.get(r_gds.get_input.player) }}</p>
        <h4>Time Remaining: <Timer :timeout="r_gds.get_input.timeout" @time-up="finish" /></h4>
    </main>
</template>