<script setup lang="ts">
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
import HelpInfo from '@/components/HelpInfo.vue';
import GetInput from '@/components/GetInput.vue';
import type { PendingActionChoice } from '@/shared/models/connection';
import GameEvents from '@/shared/components/GameEvents.vue';
const c_gs = useGameStateStore()

const shutdown:Ref<boolean> = ref(false)

/**
 * finish the programming phase
 */
function finish(): void {
    // submit program, disable programming, reset values
    c_gs.submitProgram(shutdown.value)
    c_gs.programming_enabled = false
    shutdown.value = false
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

function programming() {
  c_gs.programming_enabled = true
  c_gs.phase = GamePhase.Programming
}

function upgrade() {
  c_gs.phase = GamePhase.Upgrade
}

function activation() {
  c_gs.phase = GamePhase.Activation
}

function show_help() {
    c_gs.help_open = true
}

function get_input() {
    c_gs.request = {
        prompt: "Choose one of these bodacious options",
        options: [
            "Battleship",
            "Clue",
            "Electric Football",
            "Twister"
        ],
        expiration: 30
    }
    c_gs.game_display = GameWindows.DEFAULT
}

function selection_made(selection:string) {
    console.log('Caught selection:', selection)
    c_gs.request = undefined
}
</script>

<template>
    <main>
        <div class="side-nav">
            <img class="ico" src="@/assets/ico/home.svg" alt="Default" @click="show_default"><br/>
            <img class="ico" src="@/assets/ico/wrench.svg" alt="Upgrades" @click="show_upgrades"/><br />
            <img class="ico" src="@/assets/ico/info.svg" alt="Player Info" @click="show_player_info"/><br />
            <div class="nav-footer">
                <CheckpointTracker /><br />
                <EnergyCounter /><br />
                <PriorityTracker /><br />
                <ConnectionStatus /><br />
                <img class="ico" src="@/assets/ico/settings.svg" alt="Settings" @click="show_settings"/><br />
            </div>
        </div>
        <div class="body-content">
            <button @click="upgrade">Upgrade</button>
            <button @click="programming">Programming</button>
            <button @click="activation">Activation</button>
            <div class="control">
                <button @click="c_gs.next_phase()">Next Phase (in {{ c_gs.phase }})</button>
                <button @click="c_gs.new_action()">New action</button>
                <button @click="show_help()">Show help</button>
                <button @click="get_input">Get Input</button>
            </div>
            <div v-if="c_gs.game_display == GameWindows.DEFAULT">
                <div v-if="c_gs.has_request">
                    <GetInput :request="(c_gs.request as PendingActionChoice)" @selected="selection_made"/>
                </div>

                <div v-if="c_gs.phase == GamePhase.Activation">
                    <GameEvents :events="c_gs.action_log" :max_events="10" />
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
                <GameEvents :events="c_gs.action_log" :max_events="10" />
            </div>
            <div v-else-if="c_gs.game_display == GameWindows.SETTINGS">
                <SettingsManager />
            </div>
        </div>
        <HelpInfo v-if="c_gs.help_open" class="info-tray"/>
    </main>
</template>

<style scoped>
.ico {
    width: 100%;
    margin-top: 2%;
}

.ico:hover {
    background-color: #606060;
}

.body-content {
    height: 100%;
    width: 90%;
    position: fixed;
    top: 0;
    left: 10%;
    padding: 3%;
}

.side-nav {
    height: 100%;
    width: 5%;
    position: fixed;
    top: 0;
    left: 0;
    overflow-x: hidden;
    font-size: 18pt;
    padding: 0.5%;
}

.nav-footer {
    position: fixed;
    bottom: 0;
}

.info-tray {
    height: 100%;
    width: 20%;
    position: fixed;
    top: 0;
    right: 0;
    font-size: 12pt;
    padding: 1%;
}
</style>