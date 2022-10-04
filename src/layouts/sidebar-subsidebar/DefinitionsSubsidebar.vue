<script setup lang="ts">
import { ref } from 'vue'
import { useUserSession } from '/@src/stores/userSession'
const emit = defineEmits(['close'])
const openSubsidebarLinks = ref('')
const userSession = useUserSession()
const { hasAuth, isDealer } = userSession
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
        <li v-if="isDealer">
          <RouterLink :to="{ name: 'plant' }">
            {{ userSession.getExpression('Factories') }}
          </RouterLink>
        </li>
        <li v-if="hasAuth('Machines', 'Read')">
          <RouterLink :to="{ name: 'machine' }">
            {{ userSession.getExpression('Machines') }}
          </RouterLink>
        </li>
        <li v-if="hasAuth('Departments', 'Read')">
          <RouterLink :to="{ name: 'department' }">
            {{ userSession.getExpression('Departments') }}
          </RouterLink>
        </li>
        <li v-if="hasAuth('Employees', 'Read')">
          <RouterLink :to="{ name: 'employee' }">
            {{ userSession.getExpression('Employees') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'warehouse' }">
            {{ userSession.getExpression('Warehouses') }}
          </RouterLink>
        </li>
        <li>
          <RouterLink :to="{ name: 'firm' }"> Firmalar </RouterLink>
        </li>
        <!-- <li v-if="hasAuth('Cards', 'Read')">
          <RouterLink :to="{ name: 'card' }">
            {{ userSession.getExpression('Cards') }}
          </RouterLink>
        </li> -->

        <VCollapseLinks
          v-if="
            hasAuth('Items', 'Read') ||
            hasAuth('ItemCategories', 'Read') ||
            hasAuth('ItemGroups', 'Read')
          "
          v-model:open="openSubsidebarLinks"
          collapse-id="personal"
        >
          <template #header>
            {{ userSession.getExpression('Item') }}
            <i aria-hidden="true" class="iconify" data-icon="feather:chevron-right" />
          </template>

          <RouterLink
            v-if="hasAuth('Items', 'Read')"
            :to="{ name: 'item-definition' }"
            class="is-submenu"
          >
            <span>{{ userSession.getExpression('Items') }}</span>
          </RouterLink>
          <RouterLink
            v-if="hasAuth('ItemCategories', 'Read')"
            :to="{ name: 'item-category' }"
            class="is-submenu"
          >
            <span>{{ userSession.getExpression('ItemCategories') }}</span>
          </RouterLink>
          <RouterLink
            v-if="hasAuth('ItemGroups', 'Read')"
            :to="{ name: 'item-group' }"
            class="is-submenu"
          >
            <span>{{ userSession.getExpression('ItemGroups') }}</span>
          </RouterLink>
          <RouterLink :to="{ name: 'unit' }" class="is-submenu">
            <span>{{ userSession.getExpression('Units') }}</span>
          </RouterLink>
        </VCollapseLinks>

        <li>
          <RouterLink :to="{ name: 'language' }">
            {{ userSession.getExpression('LanguageSettings') }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
@import '../../scss/layout/sidebar-panel';
</style>
