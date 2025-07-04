<script setup lang="ts">
// import JoinGame from '../components/JoinGame.vue'
import router from '@/router';
import { useConnectionStore } from '@/stores/client_connection';
import { ref } from 'vue';
import type { Ref } from 'vue';

const c_cs = useConnectionStore()

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
  c_cs.join(player_name.value, (message?: string) => {
    console.log('join request returned')
    // callback, process our results
    if (message === undefined || message === "") {
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
  <div class="flex flex-horiz-center">
    <div class="join-card">
      <h2 class="text-center">Join Game</h2>
      <div v-if="error" class="error banner">
        <p>{{ c_cs.join_req.response }}</p>
      </div>
      <form class="text-center" v-if="!loading" @submit.prevent="join()">
        <label for="player_name" class="space-after">Player Name</label>
        <input id="player_name" class="space-after" type="text" placeholder="name" maxlength="15" v-model="player_name" required>
        <span class="text-half-size">{{ player_name.length }}/15</span>
        <input type="submit" class="big-button">
      </form>
      <div v-if="loading" >
        <p class="text-center">Joining Game...</p>
      </div>
    </div>
  </div>
</template>

<style lang="css" scoped>
.join-card {
  margin: 0px 1em;
  margin-top: 20%;
  background-color: var(--color-background);
  border-radius: 4vh;
  padding: 1em;
}

@media screen and (min-width: 1080px) {
  .join-card {
    max-width: 540px;
    padding: 2em;
  }
}
</style>