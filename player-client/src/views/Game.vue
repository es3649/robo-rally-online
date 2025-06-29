<script setup lang="ts">
import { GameWindows, useGameStateStore } from '@/stores/client_game_state';
import { GamePhase, anyRegisterEmpty } from "@/shared/models/game_data"
import EnergyCounter from '@/components/game_elements/EnergyCounter.vue'
import CheckpointTracker from '@/components/game_elements/CheckpointTracker.vue'
import RegisterArray from '@/components/game_elements/RegisterArray.vue'
import ProgrammingHand from '@/components/game_elements/ProgrammingHand.vue'
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
        <div class="gridded nav">
            <CheckpointTracker class="tracker" />
            <EnergyCounter class="tracker" />
            <PriorityTracker class="tracker" />
            <ConnectionStatus class="tracker" />
            <img class="ico" :class="{active: c_gs.game_display==GameWindows.DEFAULT}" src="@/assets/ico/home.svg" alt="Default" @click="show_default">
            <img class="ico" :class="{active: c_gs.game_display==GameWindows.UPGRADE}" src="@/assets/ico/wrench.svg" alt="Upgrades" @click="show_upgrades"/>
            <img class="ico" :class="{active: c_gs.game_display==GameWindows.PLAYER_INFO}" src="@/assets/ico/info.svg" alt="Player Info" @click="show_player_info"/>
            <img class="ico" :class="{active: c_gs.game_display==GameWindows.SETTINGS}" src="@/assets/ico/settings.svg" alt="Settings" @click="show_settings"/>
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
                <div v-if="c_gs.has_request" class="popup-fullscreen">
                    <GetInput :request="(c_gs.request as PendingActionChoice)" @selected="selection_made"/>
                </div>

                <div v-if="c_gs.phase == GamePhase.Activation">
                    <GameEvents :events="c_gs.action_log" :max_events="10" />
                </div>
                <!-- list upgrades -->
                <div v-if="c_gs.phase == GamePhase.Upgrade">
                    <UpgradeManager />
                </div>
                <div v-else class="gridded programming-grid">
                    <!-- programming registers -->
                    <RegisterArray :disabled="!c_gs.programming_enabled"/>
                    <div v-if="c_gs.phase == GamePhase.Programming && c_gs.programming_enabled">
                        <!-- cards -->
                        <ProgrammingHand />
                    </div>
                    <label for="shutdown">Shutdown</label>
                    <input id="shutdown" type="checkbox" v-model="shutdown">
                    <button :disabled="anyRegisterEmpty(c_gs.registers)" @click="finish">{{ shutdown ? "Shutdown" : "Complete" }}</button>
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
        <HelpInfo v-if="c_gs.help_open" class="right-tray"/>
    </main>
</template>

<style scoped>
main {
    width: 100vw;
}
.ico {
    width: 100%;
    flex: 1;
    max-height: 3rem;
    padding: .5rem;
    border-bottom-right-radius: .25em;
    border-bottom-left-radius: .25em;
    border-style: solid;
    border-color: var(--color-background-soft);
    background-color: var(--primary);
    z-index: 1;
}

@media screen and (min-width: 720px) {
    /* hover supercedes active/focus, so we define this one here */
    .ico:hover {
        background-color: var(--secondary);
        /* border-radius: 5px; */
    }
}

.active,
.ico:focus,
.ico:active {
    border-bottom-right-radius: .5em;
    border-bottom-left-radius: .5em;
    /* padding-top: .25rem; */
    /* border-color: var(--primary); */
    background-color: var(--accent);
}

.body-content {
    margin: 8px;
}

.nav {
    position: sticky;
    top: 0px;
    grid-template-columns: repeat(4, 1fr);
    box-shadow: 0px 2px 5px var(--color-background-soft);
}

.tracker {
    /* padding-top: 1em;
    margin-top: -1em; */
    display: inline;
    text-align: center;
    border-style: solid;
    background-color: var(--secondary);
    border-color: var(--color-background-mute);
    /* border-bottom-right-radius: .25em;
    border-bottom-left-radius: .25em; */
}

.programming-grid {
    grid-template-columns: 2fr 1fr;
}

.info-tray {
    font-size: 12pt;
    padding: 1%;
}


</style>