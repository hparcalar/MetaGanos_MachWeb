<script setup lang="ts">
import { useHead } from '@vueuse/head'
import { useUserSession } from '/@src/stores/userSession'
import { useViewWrapper } from '/@src/stores/viewWrapper'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Meta Ganos | Ürün Takip Sistemi')

const userSession = useUserSession()

useHead({
  title: 'Meta Ganos',
})
</script>

<template>
  <div class="page-content-inner">
    <UserSettings />
  </div>
</template>
