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

function clear() {
    c_gs.clear_registers()
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
            <div v-if="c_gs.game_display == GameWindows.DEFAULT">
                <div v-if="c_gs.has_request" class="popup-fullscreen">
                    <GetInput :request="(c_gs.request as PendingActionChoice)" @selected="selection_made"/>
                </div>

                <!-- list upgrades -->
                <div v-if="c_gs.phase == GamePhase.Upgrade">
                    <UpgradeManager />
                </div>
                <div v-else>
                    <div class="gridded programming-grid">
                        <!-- programming registers -->
                        <RegisterArray class="reorder" :class="{'active-cards': c_gs.programming_enabled}"
                            :disabled="!c_gs.programming_enabled"/>
                        <div class="grid-2">
                            <!-- cards -->
                            <ProgrammingHand class="active-cards" v-if="c_gs.phase == GamePhase.Programming && c_gs.programming_enabled"/>
                            <GameEvents v-else :events="c_gs.action_log" :max_events="10" class="scroll-box events"/>
                        </div>
                    </div>
                    <div class="gridded control-grid" v-if="c_gs.phase == GamePhase.Programming && c_gs.programming_enabled">
                        <button :disabled="anyRegisterEmpty(c_gs.registers)" @click="finish">{{ shutdown ? "Shutdown" : "Complete" }}</button>
                        <button @click="clear">Clear</button>
                        <div class="text-center">
                            <input id="shutdown" type="checkbox" v-model="shutdown">
                            <label for="shutdown">Shutdown</label>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else-if="c_gs.game_display == GameWindows.UPGRADE">
                <UpgradeManager />
            </div>
            <div v-else-if="c_gs.game_display == GameWindows.PLAYER_INFO">
                <h2>Opponents</h2>
                <OpponentView />
                <h2>Events</h2>
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
    height: 100vh;
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
    z-index: 100;
    /* box-shadow: 0px 2px 5px var(--color-background-soft); */
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
    grid-template-columns: repeat(2, 1fr);
    gap: .5em;
}

.info-tray {
    font-size: 12pt;
    padding: 1%;
}

.reorder {
    order: 1;
    grid-column: -1;
}

.events {
    height: calc(5 * (var(--card-dim) + 2* var(--card-margin)))
}

.control-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: .5rem;
}

/* .control-grid * {
    margin: .25rem;
} */
</style>