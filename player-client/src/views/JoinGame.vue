<script setup lang="ts">
// import JoinGame from '../components/JoinGame.vue'
import router from '@/router';
import { useConnectionStore } from '@/stores/connection';
import { ref } from 'vue';
import type { Ref } from 'vue';

const connectionStore = useConnectionStore()

// define component data
const room_code: Ref<string> = ref("")
const player_name: Ref<string> = ref("")
const loading: Ref<boolean> = ref(false)
const failed: Ref<boolean> = ref(false)
const error_msg: Ref<string> = ref('')
const joined: Ref<boolean> = ref(false)

/**
 * invoke the join method on the connection store
 */
async function join() {
  loading.value = true
  const result: string|undefined = await connectionStore.join(player_name.value, room_code.value)
  if (result != undefined) {
    error_msg.value = result,
    failed.value = true
  } else {
    joined.value = true
    router.push('/lobby')
    router.forward()
  }
  loading.value = false
}
</script>

<template>
  <main>
    <h2>Join Game</h2>
    <div v-if="failed" class="error banner">
      <p>{{ error_msg }}</p>
    </div>
    <form v-if="!joined && !loading" @submit.prevent="join()">
      <label for="room_code">Room Code</label>
      <input id="room_code" type="text" placeholder="code" v-model="room_code" required> <br/>
      <label for="player_name">Player Name</label>
      <input id="player_name" type="text" placeholder="name" v-model="player_name" required> <br/>
      <input type="submit">
    </form>
    <div v-if="loading">

    </div>
  </main>
</template>