<script setup lang="ts">
import type { Character, CharacterID } from '@/models/player';
import { useConnectionStore } from '@/stores/connection';
import { useGameStateStore } from '@/stores/game_state';
import { ref, type Ref } from 'vue';


const connection_store = useConnectionStore()
const game_state = useGameStateStore()
// when we load, request the available characters, and display them

const selecting = ref(false)

connection_store.getCharacters((result: Character[], available: CharacterID[]) => {
  for (const character of available) {
    game_state.available_characters.add(character)
  }
  game_state.all_characters = result
})

function select(character: Character) {
  selecting.value = true
  console.log("Selected: ", character)
  connection_store.selectCharacter(character.id, (message?: string) => {
    if (message) {
      console.log(message)
    } else {
      game_state.character = character
    }
    selecting.value = false
  }) 
}

</script>

<template>
  <main>
    <h2>Lobby</h2>
    <div v-if="game_state.character === undefined">
      <h4>Select a character:</h4>
      <li>
        <ul v-for="character of game_state.all_characters" :key="character.id">
          <img :src="character.sprite_small">
          <p>{{ character.name }}</p>
          <button :disabled="selecting || !game_state.available_characters.has(character.id)" @click="select(character)">Select</button>
        </ul>
      </li>
    </div>
    <div v-else>
      <h2>Waiting for the host to start the game</h2>
      <p>Character: {{ game_state.character.name }}</p>
      <img :src="game_state.character.sprite_large">
    </div>
  </main>
</template>