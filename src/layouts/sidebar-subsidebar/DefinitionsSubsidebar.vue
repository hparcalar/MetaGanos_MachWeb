<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits(['close'])
const openSubsidebarLinks = ref('')
</script>

<template>
  <div class="sidebar-panel is-generic">
    <div class="subpanel-header">
      <h3 class="no-mb">Tanımlar</h3>
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
          <RouterLink :to="{ name: 'plant' }"> Fabrika </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'machine' }"> Makine </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'department' }"> Departman </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'app' }"> Personel </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'app' }"> Kart </RouterLink>
        </li>

        <VCollapseLinks v-model:open="openSubsidebarLinks" collapse-id="personal">
          <template #header>
            Stok
            <i aria-hidden="true" class="iconify" data-icon="feather:chevron-right" />
          </template>

          <RouterLink :to="{ name: 'app' }" class="is-submenu">
            <i aria-hidden="true" class="lnil lnil-analytics-alt-1"></i>
            <span>Stok Tanım</span>
          </RouterLink>
          <RouterLink :to="{ name: 'app' }" class="is-submenu">
            <i aria-hidden="true" class="lnil lnil-pie-chart"></i>
            <span>Stok Kategorileri</span>
          </RouterLink>
          <RouterLink :to="{ name: 'app' }" class="is-submenu">
            <i aria-hidden="true" class="lnil lnil-stats-up"></i>
            <span>Stok Grupları</span>
          </RouterLink>
        </VCollapseLinks>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
@import '../../scss/layout/sidebar-panel';
</style>
