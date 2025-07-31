<script setup lang="ts">
import router from '../router'
import { SetupPhase, useGameDataStore } from '../stores/render_game_data_store';
import BoardComponent from '../components/Board.vue'

const r_gds = useGameDataStore()

</script>

<template>
    <h1>Board Settings</h1>
    <BoardComponent :editable="r_gds.setup_status==SetupPhase.BoardSetup" :board="r_gds.board" />
    <p v-if="r_gds.board !== undefined">Board: {{ r_gds.board_name }}</p>
    <div v-else>    
        <button @click="router.push('/board-loader')">Select Board</button>
    </div>
</template>