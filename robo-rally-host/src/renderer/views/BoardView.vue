<script setup lang="ts">
import router from '../router'
import { SetupPhase, useGameDataStore } from '../stores/render_game_data_store';
import BoardComponent from '../components/Board.vue'

const r_gds = useGameDataStore()

</script>

<template>
    <h1>Board Settings</h1>
    <button @click="router.back()">&lt;&nbsp;Back</button>
    <BoardComponent :editable="r_gds.setup_status==SetupPhase.BoardSetup" :board="r_gds.board" />
</template>