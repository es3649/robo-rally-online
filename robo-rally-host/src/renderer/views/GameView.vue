<script setup lang="ts">
import { useGameDataStore } from '../stores/game_data_store';
import PlayerDataBrief from '../components/shared/PlayerDataBrief.vue';
import GameEvents from '../components/shared/GameEvents.vue';

const game_data_store = useGameDataStore()

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
        <h1>Game on!</h1>
        <div class="left">
            <!-- Player info, incl names, checkpoints, a sprite of their bot,
             power status, etc -->
            <li>
                <ul v-for="[id, state] of game_data_store.player_states" :key="id">
                    <PlayerDataBrief :state="state"/>
                </ul>
            </li>
        </div>
        <div class="center">
            
        </div>
        <div class="right">
            <GameEvents :events="[]", :max_events="50"/>
        </div>
    </main>
</template>