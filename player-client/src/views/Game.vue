<script setup lang="ts">
// loads of stuff here
import { useGameStateStore } from '@/stores/game_state';
import { GamePhase, anyRegisterEmpty } from "@/models/game_data"
import EnergyCounter from '../components/game_elements/EnergyCounter.vue'
import CheckpointTracker from '../components/game_elements/CheckpointTracker.vue'
import RegisterArray from '../components/game_elements/RegisterArray.vue'
import ProgrammingHand from '../components/game_elements/ProgrammingHand.vue'
import ActionWindow from '../components/game_elements/ActionWindow.vue'
import PriorityTracker from '../components/game_elements/PriorityTracker.vue'
import OpponentView from '../components/game_elements/OpponentView.vue'
import { ref, type Ref } from 'vue';
const game_state = useGameStateStore()

const shutdown:Ref<boolean> = ref(false)

/**
 * finish the programming phase
 */
function finish(): void {
    // if we're shutting down...
    if (shutdown.value) {
        // ...for now, just do nothing
        shutdown.value = false
    }
    // move to next phase
    game_state.next_phase()
}
</script>

<template>
    <main>
        <div class="control">
            <button @click="game_state.next_phase()">Next Phase (in {{ game_state.phase }})</button>
            <button @click="game_state.new_action()">New action</button>
        </div>
        <!-- checkpoints -->
        <CheckpointTracker />
        <!-- energy counter -->
        <EnergyCounter />
        <PriorityTracker />
        <br>
        <OpponentView />
        <div v-if="game_state.phase == GamePhase.Activation">
            <ActionWindow />
        </div>
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
                <label for="shutdown">Shutdown</label>
                <input id="shutdown" type="checkbox" v-model="shutdown">
                <button :disabled="anyRegisterEmpty(game_state.registers)" @click="finish">{{ shutdown ? "Shutdown" : "Complete" }}</button>
            </div>
        </div>
    </main>
</template>