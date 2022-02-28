<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits(['close'])
const openSubsidebarLinks = ref('')
</script>

<template>
  <div class="sidebar-panel is-generic">
    <div class="subpanel-header">
      <h3 class="no-mb">Depo Yönetimi</h3>
      <div
        class="panel-close"
        tabindex="0"
        @keydown.space.prevent="emit('close')"
        @click="emit('close')"
      >
        <i aria-hidden="true" class="iconify" data-icon="feather:x"></i>
      </div>
    </div>
    <div class="inner" data-simplebar>
      <ul>
        <li>
          <RouterLink :to="{ name: 'plant' }"> Depo Tanımları </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'machine' }"> Depo Durumları </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
@import '../../scss/layout/sidebar-panel';
</style>
