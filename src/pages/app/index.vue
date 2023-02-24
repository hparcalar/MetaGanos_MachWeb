<script setup lang="ts">
import { useHead } from '@vueuse/head'

import { useViewWrapper } from '/@src/stores/viewWrapper'
import HomeDashboard from '/@src/components/pages/dashboards/business/HomeDashboard.vue'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Meta Ganos | Ürün Takip Sistemi')

useHead({
  title: 'Meta Ganos',
})
</script>

<template>
  <div class="page-content-inner">
    <HomeDashboard />
  </div>
</template>
