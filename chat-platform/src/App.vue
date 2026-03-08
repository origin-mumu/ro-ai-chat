<script setup lang="ts">
import { RouterView } from "vue-router";
import { useChatStore } from './stores/chat';
import { onMounted, onUnmounted } from 'vue';

const chatStore = useChatStore();

const updateOnlineStatus = () => {
  chatStore.setOfflineStatus(!navigator.onLine);
};

onMounted(() => {
  chatStore.initStorage();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
});

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus);
  window.removeEventListener('offline', updateOnlineStatus);
});
</script>

<template>

  <RouterView />
</template>

<style></style>
