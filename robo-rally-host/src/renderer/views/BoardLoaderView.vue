<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useGameDataStore } from '../stores/game_data_store';
import BoardComponent from '../components/Board.vue'
import router from '../router';
import { Board } from '../../main/game_server/board';

const gds = useGameDataStore()
const board_name = ref('')
const board_list: Ref<string[]> = ref([])
const board: Ref<Board|undefined> = ref(undefined)
const add = ref(true)

if (gds.loadable_boards.length === 0) {
    gds.listBoards().then(() => {
        board_list.value = gds.loadable_boards
    })
}

async function load() {
    // load the named board
    if (!board_name.value) {
        console.log('No board selected')
        return
    }
    console.log(board_name.value)
    await gds.loadBoard(board_name.value)
    board.value = gds.board as Board
    console.log(board.value)
}

function finish() {
    router.replace('/lobby')
}

</script>

<template>
    <main>
        <div v-if="add">
            <select id="board_select" v-model="board_name">
                <option value="" default disabled>Choose a Board</option>
                <option value="_serial" disabled>From Serial</option>
                <option v-if="!board_list" disabled>Loading...</option>
                <option v-for="b of board_list" :value="b">{{ b }}</option>
            </select>
        </div>
        <button @click="load" :disabled="!board_name">Load Selected</button>
        <!-- position buttons above, below, L, and R of the guy to extend the board
         re-evaluate the board data type before writing extend method
          -->
        <BoardComponent :editable="true" :board="board"/>
        <button @click="finish">Finish</button>
    </main>
</template>