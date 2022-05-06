<script setup lang="ts">
import { ref } from 'vue'
import { useUserSession } from '/@src/stores/userSession'
const emit = defineEmits(['close'])
const openSubsidebarLinks = ref('')
const { hasAuth, isDealer } = useUserSession()
</script>

<template>
  <div class="sidebar-panel is-generic">
    <div class="subpanel-header">
      <h3 class="no-mb">Hareketler</h3>
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
        <!-- <li>
          <RouterLink :to="{ name: 'plant' }"> Satınalma </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'machine' }"> Makine Hareketleri </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'department' }"> Satış </RouterLink>
        </li> -->
        <li v-if="hasAuth('ConsumptionReport', 'Read')">
          <RouterLink :to="{ name: 'report-consume' }"> Tüketim Raporu </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
@import '../../scss/layout/sidebar-panel';
</style>
