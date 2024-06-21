<script setup lang="ts">
import { ref } from 'vue'

// define a basic player class. Consider moving the elsewhere later as needed
declare class Player {
  name: string
  avatar?: string
  robot?: string
}

const game_medium = ref("")
const game_mode = ref("")
const room_code = ref("")
const lobby_started = ref(false);
let players: Player[] = []

function get_game_code(): string {
  // TODO make API calls and create a lobby
  return 'ABCD'
}

function start_lobby() {
  // validate
  if (!game_mode.value || !game_medium.value) {
    alert("Please select values")
    return
  }
  
  room_code.value = get_game_code()
  lobby_started.value = true
  players = [{ name: "Chuck", robot: "Twonky"}, {name: "Channing"}]
}

function start_game() {
  if (!confirm("Are you ready to start the game?")) {
    return
  }
}
</script>

<template>
  <main v-if="!lobby_started">
    <h2>Create Lobby</h2>
    <form @submit.prevent="start_lobby()">
      <label for="game_mode">Game Mode</label>
      <select name="game_mode" v-model="game_mode">
        <option disabled value="">select</option>
        <option value="classic">Classic</option>
        <option disabled value="battle">Battle</option>
      </select> <br/>
      <label for="game_medium">Game Type</label>
      <select name="game_medium" v-model="game_medium">
        <option disabled value="">select</option>
        <option value="virtual">Virtual</option>
        <option value="live">Live</option>
      </select> <br/>
      <input type="submit">
    </form>
  </main>
  <main v-else>
    <h2>Lobby</h2>
    <p>Room Code: <code>{{ room_code }}</code></p>
    <p>Game Mode: <code>{{ game_mode }}</code></p>
    <p>Game Type: <code>{{ game_medium }}</code></p>
    <h3>Players</h3>
    <ul>
      <li v-for="player in players">{{ player.name }} (<i>{{ player.robot ? player.robot : "character select" }}</i>)</li>
    </ul>
    <button @click="start_game()">Start</button>
  </main>
</template>