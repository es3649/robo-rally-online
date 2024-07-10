<script setup lang="ts">
// loads of stuff here
import { useGameStateStore } from '@/stores/game_state';
import { GamePhase } from "@/models/game_data"
import EnergyCounter from '../components/game_elements/EnergyCounter.vue'
import CheckpointTracker from '../components/game_elements/CheckpointTracker.vue'
import RegisterArray from '../components/game_elements/RegisterArray.vue'
import ProgrammingHand from '../components/game_elements/ProgrammingHand.vue';

const game_state = useGameStateStore()
</script>

<template>
    <main>
        <div class="control">
            <button @click="game_state.next_phase()">Next Phase (in {{ game_state.phase }})</button>
        </div>
        <!-- checkpoints -->
        <CheckpointTracker />
        <!-- energy counter -->
        <EnergyCounter />
        <!-- list upgrades -->
         <div v-if="game_state.phase == GamePhase.Upgrade">

             <!-- current execution (register #, cur player, ) -->
             
        </div>
        <div v-else>
            <!-- programming registers -->
            <RegisterArray />
            <div v-if="game_state.phase == GamePhase.Programming">
                <!-- cards -->
                <ProgrammingHand />
            </div>
        </div>
    </main>
</template>