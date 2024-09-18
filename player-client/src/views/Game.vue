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
        // submit program, disable programming, reset values
        game_state.submitProgram(shutdown.value)
        game_state.programming_enabled = false
        shutdown.value = false
    }
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
            <button @click="game_state.draw_upgrade" 
                :disabled="game_state.energy < 1"
                :title="game_state.energy < 1 ? 'Insufficient energy' : undefined"
            >Draw Upgrade (1 Energy)</button>
        </div>
        <div v-else>
            <!-- programming registers -->
            <RegisterArray :disabled="!game_state.programming_enabled"/>
            <div v-if="game_state.phase == GamePhase.Programming && game_state.programming_enabled">
                <!-- cards -->
                <ProgrammingHand />
                <label for="shutdown">Shutdown</label>
                <input id="shutdown" type="checkbox" v-model="shutdown">
                <button :disabled="anyRegisterEmpty(game_state.registers)" @click="finish">{{ shutdown ? "Shutdown" : "Complete" }}</button>
            </div>
        </div>
    </main>
</template>