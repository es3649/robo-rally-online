<script setup lang="ts">
import router from '../router'
import { SetupPhase, useGameDataStore } from '../stores/game_data_store';
import BoardComponent from '../components/Board.vue'

const game_data_store = useGameDataStore()

</script>

<template>
    <h1>Board Settings</h1>
    <button @click="router.replace('/lobby')">&lt;&nbsp;Back</button>
    <BoardComponent :editable="game_data_store.setup_status==SetupPhase.BoardSetup" :board="game_data_store.board" />
</template>