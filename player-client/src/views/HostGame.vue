<script setup lang="ts">
import type { games_POST_req, games_POST_res } from '@/models/api_models';
import router from '@/router';
import { useConnectionStore } from '@/stores/connection';
import axios, { AxiosError, type AxiosResponse } from 'axios';
import { ref } from 'vue'

const connectionStore = useConnectionStore()

const game_type = ref("")
const player_name = ref("")
const loading = ref(false)
const failed = ref(false)
const error_msg = ref("")

async function host() {
  // reset the error related store values
  loading.value = true
  failed.value = false
  error_msg.value = ""

  // build the request
  const req: games_POST_req = {
    game_type: game_type.value,
    player_name: player_name.value
  }

  let response: AxiosResponse
  try {
    // try to make the request
    response = await axios.post("http://localhost/API/games", req)
  } catch (error: any) {
    // log error
    console.error("games request failed")
    console.log(error)
    try {
      // try to get error code from response
      const e = error as AxiosError
      error_msg.value = e.response?.data as string
    } catch {
      // default error message
      error_msg.value = "Failed to create lobby"
    } finally {
      // reset request-related store values
      loading.value = false
      failed.value = true
      return
    }
  }

  // parse the response
  var data: games_POST_res
  try {
    data = response.data
  } catch {
    failed.value = true
    error_msg.value = "Failed to parse server response"
    return
  }

  // join the room
  const join_res = await connectionStore.join(player_name.value, data.room_code, data.host_code)

  // check the response
  if (join_res === undefined) {
    // we good, move to the lobby
    loading.value = false
    router.push('/lobby')
    router.forward()
  } else {
    // display error status
    failed.value = true
    error_msg.value = join_res
    loading.value = false
  }
}
</script>

<template>
  <main>
    <div class="error" v-if="failed">
      <p>{{ error_msg }}</p>
    </div>
    <h2>Create Lobby</h2>
    <div v-if="!loading">
      <form @submit.prevent="host()">
        <label for="player_name">Name</label>
        <input id="player_name" v-model="player_name" required><br/>
        <label for="game_medium">Game Type</label>
        <select id="game_type" v-model="game_type" required>
          <option disabled value="">select</option>
          <option value="virtual">Virtual</option>
          <option value="live">Live</option>
        </select> <br/>
        <input type="submit">
      </form>
    </div>
    <div v-else>
      Loading game...
    </div>
  </main>
</template>