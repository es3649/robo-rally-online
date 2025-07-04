<script setup lang="ts">
import { GamePhase } from '@/shared/models/game_data';
import { GameWindows, useGameStateStore } from '@/stores/client_game_state';

const c_gs = useGameStateStore()

function close() {
    c_gs.help_open = false
}
</script>

<template>
    <div>
        <button class="close" @click="close">Close</button>
        <div v-if="c_gs.game_display == GameWindows.UPGRADE">
            <p>Upgrades are a cool feature that are not implemented.</p>
            <p>
                Your equipped upgrades are displayed here, and if they support activation, you can tap one to activate it at the next available breakpoint for upgrades.
            </p>
        </div>
        <div v-else-if="c_gs.game_display == GameWindows.PLAYER_INFO">
            <p>Info about the other players is displayed here.</p>
            <p>
                For each player, their priority is displayed before their name, followed by their active status.
                A green dot (🟢) indicates that their bot is taking actions normally.
                A red dot (🔴) indicates that their bot is currently deactivated, either due to a manual shutdown or falling off the board.
                Their current checkpoint count is displayed next to the flag icon (🏁).
                The player's energy total is displayed next to the lightning symbol (⚡️).
            </p>
            <p>
                A list of recent actions taken by players is also displayed in a scrolling box, with the most recent events appearing at the top.
                This list will also include effects imposed on players by the board, or by their opponents.
                This action view also appears on the main screen during the activation phase.
            </p>
        </div>
        <div v-else-if="c_gs.game_display == GameWindows.SETTINGS">
            <p>
                Game settings are displayed here.
                Most of these are developer settings which are of little use to the player.
            </p>
            <p>
                The connection status can be viewed here as well.
                In the event of a disconnection, the "Reconnect" button will appear, allowing the player to attempt to reconnect to the server,
                however the system will typically attempt to reconnect automatically.
            </p>
        </div>
        <div v-else-if="c_gs.game_display == GameWindows.DEFAULT">
            <div v-if="c_gs.phase == GamePhase.Upgrade">
                <p>
                    Not implemented.
                </p>
                <p>New upgrades can be purchased for 1 energy each.</p>
        </div>
            <div v-else-if="c_gs.phase == GamePhase.Programming">
                <h3>Programming Dashboard</h3>
                <p>
                    Your Register array is displayed above your programming hand.
                    Drag a card from your programming hand to the register array to program it.
                    Drag the card back to your programming hand to remove it.
                    You can also use the "Clear" button to remove all currently programmed cards from your registers and return them to your hand.
                </p>
                <p>
                    If you would like to shutdown your bot for this round, check the "Shutdown" checkbox before submitting your program.
                    In this case, all cards in you registers will be cleared, and your robot will take no actions this round.
                </p>
                <p>
                    When your registers are all filled, use the "Submit" button (or the "Shutdown" button if the Shutdown box is checked) to submit the program.
                    At this point, the registers will be locked, and you will wait until other programs are submitted.
                </p>
            </div>
            <div v-else-if="c_gs.phase == GamePhase.Activation">
                <p>
                    The robots are executing their movement.
                    You may be required to give some sort of input, in which case you will be given a prompt to make a selection.
                    The prompt will have a time limit, so pay attention, and choose quickly!
                </p>
            </div>
        </div>
    </div>
</template>