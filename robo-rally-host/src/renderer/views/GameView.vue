<script setup lang="ts">
import { useGameDataStore } from '../stores/render_game_data_store';
import PlayerDataBrief from '../../shared/components/PlayerDataBrief.vue';
import GameEvents from '../../shared/components/GameEvents.vue';
import Timer from '../../shared/components/Timer.vue';
import GetInput from '../components/GetInput.vue';

const r_gds = useGameDataStore()
console.log("loading GameView")

// test data
if (r_gds.player_states.size === 0) {
    r_gds.player_states.set('saph1234', {
        name: "Gemma",
        active: true,
        checkpoints: 0,
        energy: 4,
        priority: 1
    })
    r_gds.player_states.set('emer1234', {
        name: "Fitz",
        active: false,
        checkpoints: 1,
        energy: 2, 
        priority: 2
    })
    r_gds.player_states.set('long_example', {
        name: "mmmmmmmmmmmmmmm",
        active: false,
        checkpoints: 10,
        energy: 10,
        priority: 6
    })
}

const time_up = () => console.log("Time's up")

</script>

<template>
    <!-- On in side we want some player data, and information about what
    phase it currently is 
    We also want an event-log, where we can see what actions were taken
    recently
    
    In the middle we probably want the current game status, perhaps a large
    info about the current phase, the GetInput vue when relevant, flash
    info when registers update, and when it's time to upgrade/program
    -->
    <main>
        <div class="left">
            <!-- Player info, incl names, checkpoints, a sprite of their bot,
            power status, etc -->
            <ul>
                <li v-for="[id, state] of r_gds.player_states" :key="id">
                    <PlayerDataBrief :state="state"/>
                </li>
            </ul>
        </div>
        <div v-if="r_gds.get_input.player !==  undefined" class="center">
            <GetInput />
        </div>
        <div class="right">
            <GameEvents :events="r_gds.game_events" :max_events="50"/>
        </div>
    </main>
</template>

<style lang="css" scoped>
main {
    display: flex;
    flex-direction: row;
}
/* .right {
    position: relative;
    float: right;
}

.center {
    position: relative;
}

.left {
    position: relative;
    float: left;
} */
</style>