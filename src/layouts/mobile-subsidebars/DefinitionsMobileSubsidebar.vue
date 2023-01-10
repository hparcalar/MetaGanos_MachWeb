<script setup lang="ts">
import { useUserSession } from '/@src/stores/userSession'
import { ref } from 'vue'

const userSession = useUserSession()
const openSubsidebarLinks = ref('')
const { hasAuth, isDealer } = userSession
</script>
<template>
  <div class="mobile-subsidebar">
    <div class="inner">
      <div class="sidebar-title">
        <h3>Tanımlar</h3>
      </div>

      <ul class="submenu" data-simplebar>
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
        <li v-if="hasAuth('Employees', 'Delete')">
          <RouterLink :to="{ name: 'employee-non-active' }">
            Ayrılan Personeller
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
          <!-- <RouterLink :to="{ name: 'unit' }" class="is-submenu">
            <span>{{ userSession.getExpression('Units') }}</span>
          </RouterLink> -->
        </VCollapseLinks>
      </ul>
    </div>
  </div>
</template>
