<script setup lang="ts">
import { ref } from 'vue'
import { useHead } from '@vueuse/head'
import { useRoute, useRouter } from 'vue-router'
import { useViewWrapper } from '/@src/stores/viewWrapper'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Meta Ganos | Otomat Yönetim Sistemi')

const route = useRoute()
const currentId = ref((route.params?.slug as string) ?? '0')

useHead({
  title: 'Meta Ganos',
})
</script>

<template>
  <div class="page-content-inner">
    <DepartmentForm :id="parseInt(currentId)" />
  </div>
</template>
