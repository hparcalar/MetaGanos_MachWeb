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
        <h3>Hareketler</h3>
      </div>

      <ul class="submenu" data-simplebar>
        <li v-if="hasAuth('Warehouses', 'Write')">
          <RouterLink :to="{ name: 'wrmove' }"> Depo Giriş/Çıkış </RouterLink>
        </li>
        <li v-if="hasAuth('LoadMachine', 'Read')">
          <RouterLink :to="{ name: 'machine-load' }">
            {{ userSession.getExpression('LoadMachine') }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>
