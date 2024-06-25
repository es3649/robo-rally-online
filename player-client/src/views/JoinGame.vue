<script setup lang="ts">
// import JoinGame from '../components/JoinGame.vue'
import { ref } from 'vue';

// define component data
const room_code = ref("")
const player_name = ref("")
const joined = ref(false)

function join() : undefined {
  // make the server request
  alert(`Joined lobby ${room_code.value}`)
  room_code.value = ""
}
</script>

<template>
  <main>
    <h2>Join Game</h2>
    <form @submit.prevent="join()">
      <label for="room_code">Room Code</label>
      <input name="room_code" type="text" placeholder="code" v-model="room_code"> <br/>
      <label for="player_name">Player Name</label>
      <input name="player_name" type="text" placeholder="name" v-model="player_name"> <br/>
      <input type="submit">
    </form>
  </main>
</template>