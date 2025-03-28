<script setup lang="ts">
// loads of stuff here
import { GameWindows, useGameStateStore } from '@/stores/client_game_state';
import { GamePhase, anyRegisterEmpty } from "@/shared/models/game_data"
import EnergyCounter from '@/components/game_elements/EnergyCounter.vue'
import CheckpointTracker from '@/components/game_elements/CheckpointTracker.vue'
import RegisterArray from '@/components/game_elements/RegisterArray.vue'
import ProgrammingHand from '@/components/game_elements/ProgrammingHand.vue'
import ActionWindow from '@/components/game_elements/ActionWindow.vue'
import PriorityTracker from '@/components/game_elements/PriorityTracker.vue'
import OpponentView from '@/components/game_elements/OpponentView.vue'
import UpgradeManager from '@/components/UpgradeManager.vue';
import { ref, type Ref } from 'vue';
import SettingsManager from '@/components/SettingsManager.vue';
import ConnectionStatus from '@/components/ConnectionStatus.vue';
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

function show_default() {
    c_gs.game_display = GameWindows.DEFAULT
}
function show_upgrades() {
    c_gs.game_display = GameWindows.UPGRADE
}
function show_player_info() {
    c_gs.game_display = GameWindows.PLAYER_INFO
}
function show_settings() {
    c_gs.game_display = GameWindows.SETTINGS
}
</script>

<template>
    <main>
        <div class="control">
            <button @click="c_gs.next_phase()">Next Phase (in {{ c_gs.phase }})</button>
            <button @click="c_gs.new_action()">New action</button>
        </div>
        <div class="side-nav">
            <button @click="show_default">Default</button>
            <img class="ico" src="@/assets/ico/wrench.svg" alt="Upgrades" @click="show_upgrades"/>
            <img class="ico" src="@/assets/ico/info.svg" alt="Player Info" @click="show_player_info"/>
            <img class="ico" src="@/assets/ico/settings.svg" alt="Settings" @click="show_settings"/>
            <CheckpointTracker />
            <EnergyCounter />
            <PriorityTracker />
            <ConnectionStatus />
        </div>
        <!-- checkpoints -->
        <div v-if="c_gs.game_display == GameWindows.DEFAULT">

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
        </div>
        <div v-else-if="c_gs.game_display == GameWindows.UPGRADE">
            <UpgradeManager />
        </div>
        <div v-else-if="c_gs.game_display == GameWindows.PLAYER_INFO">
            <OpponentView />
        </div>
        <div v-else-if="c_gs.game_display == GameWindows.SETTINGS">
            <SettingsManager />
        </div>
    </main>
</template>

<style scoped>
.ico:hover {
    background-color: #606060;
}
</style>