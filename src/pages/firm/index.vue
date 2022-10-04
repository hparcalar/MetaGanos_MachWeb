<script setup lang="ts">
import { useHead } from '@vueuse/head'

import { useViewWrapper } from '/@src/stores/viewWrapper'

const viewWrapper = useViewWrapper()
viewWrapper.setPageTitle('Meta Ganos | Otomat Yönetim Sistemi')

useHead({
  title: 'Meta Ganos',
})
</script>
    
    <template>
  <div class="page-content-inner">
    <FirmList />
  </div>
</template>
    