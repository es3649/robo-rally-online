<script setup lang="ts">
// import JoinGame from '../components/JoinGame.vue'
import router from '@/router';
import { useConnectionStore } from '@/stores/connection';
import { ref } from 'vue';
import type { Ref } from 'vue';

const connectionStore = useConnectionStore()

// define component data
const player_name: Ref<string> = ref("")
const error: Ref<boolean> = ref(false)
const loading: Ref<boolean> = ref(false)

/**
 * invoke the join method on the connection store
 */
async function join() {
  // we are loading now
  loading.value = true
  // make the call on the connStore
  connectionStore.join(player_name.value, () => {
    // callback, process our results
    if (connectionStore.join_req.response === "") {
      // success, goto lobby
      router.push('/lobby')
      router.forward()
    } else {
      // error
      error.value = true
    }
    loading.value = false
  })
}
</script>

<template>
  <main>
    <h2>Join Game</h2>
    <div v-if="error" class="error banner">
      <p>{{ connectionStore.join_req.response }}</p>
    </div>
    <form v-if="!loading" @submit.prevent="join()">
      <label for="player_name">Player Name</label>
      <input id="player_name" type="text" placeholder="name" v-model="player_name" required> <br/>
      <input type="submit">
    </form>
    <div v-if="loading">
      <p>Joining Game</p>
    </div>
  </main>
</template>