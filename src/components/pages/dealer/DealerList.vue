<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { onceImageErrored } from '/@src/utils/via-placeholder'
import { useUserSession } from '/@src/stores/userSession'

const userSession = useUserSession()
const api = useApi()
const router = useRouter()

const filters = ref('')
const dealers = ref([])

const filteredData = computed(() => {
  if (!filters.value) {
    return dealers.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return dealers.value.filter((item) => {
      return (
        item.plantCode?.match(filterRe) ||
        item.plantName?.match(filterRe) ||
        item.explanation?.match(filterRe) ||
        item.dealerCode?.match(filterRe) ||
        item.dealerName?.match(filterRe)
      )
    })
  }
})

const openDetail = (id: number) => {
  router.push({
    name: 'dealer-slug',
    params: {
      slug: id,
    },
  })
}

onMounted(async () => {
  try {
    dealers.value = (await api.get('Dealer')).data
  } catch (error) {}
})

const columns = {
  dealerCode: 'Bayi Kodu',
  dealerName: 'Bayi Adı',
  parentDealerName: 'Üst Bayi',
  explanation: 'Açıklama',
  isActive: 'Aktif',
  actions: {
    label: '#',
    align: 'center',
  },
} as const
</script>

<template>
  <div>
    <div class="list-flex-toolbar is-reversed">
      <VControl icon="feather:search">
        <input
          v-model="filters"
          class="input custom-text-filter"
          :placeholder="userSession.getExpression('Search')"
        />
      </VControl>

      <VButton :color="'info'" :raised="true" icon="feather:plus" @click="openDetail(0)"
        >Yeni Bayi</VButton
      >
    </div>

    <div class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage
        v-if="!filteredData.length"
        :title="'Gösterilecek bir veri bulunamadı.'"
        subtitle=""
        larger
      >
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="filteredData.length" class="tab-content is-active">
        <VFlexTable :data="filteredData" :columns="columns" clickable compact separators>
          <template #body>
            <TransitionGroup name="list" tag="div" class="flex-list-inner">
              <!--Table item-->
              <div v-for="item in filteredData" :key="item.id" class="flex-table-item">
                <VFlexTableCell>
                  <span class="">{{ item.dealerCode }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.dealerName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.parentDealerName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.explanation }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.isActive ? 'Evet' : 'Hayır' }}</span>
                </VFlexTableCell>
                <VFlexTableCell :columns="{ align: 'end' }">
                  <button
                    class="button v-button has-dot dark-outlined is-info is-pushed-mobile mx-auto"
                    @click="openDetail(item.id)"
                  >
                    <i aria-hidden="true" class="fas fa-search dot mr-0"></i>
                  </button>
                </VFlexTableCell>
              </div>
            </TransitionGroup>
          </template>
        </VFlexTable>

        <VFlex class="mt-5">
          <VCard class="p-1">
            <VSnack
              :title="
                filteredData.length + ' ' + userSession.getExpression('RecordsDisplayed')
              "
              size="small"
              solid
              class="mt-2 ml-2"
              color="info"
              icon="feather:info"
            >
            </VSnack>
          </VCard>
        </VFlex>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.has-top-nav {
  .flex-list-wrapper,
  .list-flex-toolbar {
    max-width: 880px;
    margin-right: auto;
    margin-left: auto;
  }
}
</style>
