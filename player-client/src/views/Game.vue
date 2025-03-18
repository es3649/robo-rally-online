<script setup lang="ts">
// loads of stuff here
import { useGameStateStore } from '@/stores/client_game_state';
import { GamePhase, anyRegisterEmpty } from "@/shared/models/game_data"
import EnergyCounter from '@/components/game_elements/EnergyCounter.vue'
import CheckpointTracker from '@/components/game_elements/CheckpointTracker.vue'
import RegisterArray from '@/components/game_elements/RegisterArray.vue'
import ProgrammingHand from '@/components/game_elements/ProgrammingHand.vue'
import ActionWindow from '@/components/game_elements/ActionWindow.vue'
import PriorityTracker from '@/components/game_elements/PriorityTracker.vue'
import OpponentView from '@/components/game_elements/OpponentView.vue'
import { ref, type Ref } from 'vue';
import UpgradeManager from '@/components/UpgradeManager.vue';
const c_gs = useGameStateStore()

const shutdown:Ref<boolean> = ref(false)

/**
 * finish the programming phase
 */
function finish(): void {
    // if we're shutting down...
    if (shutdown.value) {
        // submit program, disable programming, reset values
        c_gs.submitProgram(shutdown.value)
        c_gs.programming_enabled = false
        shutdown.value = false
    }
}
</script>

<template>
    <main>
        <div class="control">
            <button @click="c_gs.next_phase()">Next Phase (in {{ c_gs.phase }})</button>
            <button @click="c_gs.new_action()">New action</button>
        </div>
        <!-- checkpoints -->
        <CheckpointTracker />
        <!-- energy counter -->
        <EnergyCounter />
        <PriorityTracker />
        <br>
        <OpponentView />
        <div v-if="c_gs.phase == GamePhase.Activation">
            <ActionWindow />
        </div>
        <!-- list upgrades -->
         <div v-if="c_gs.phase == GamePhase.Upgrade">
            <UpgradeManager />
        </div>
        <div v-else>
            <!-- programming registers -->
            <RegisterArray :disabled="!c_gs.programming_enabled"/>
            <div v-if="c_gs.phase == GamePhase.Programming && c_gs.programming_enabled">
                <!-- cards -->
                <ProgrammingHand />
                <label for="shutdown">Shutdown</label>
                <input id="shutdown" type="checkbox" v-model="shutdown">
                <button :disabled="anyRegisterEmpty(c_gs.registers)" @click="finish">{{ shutdown ? "Shutdown" : "Complete" }}</button>
            </div>
        </div>
    </main>
</template>