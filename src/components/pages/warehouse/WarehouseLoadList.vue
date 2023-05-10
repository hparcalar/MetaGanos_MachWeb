<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'
import { dateToStr } from '/@src/composable/useHelpers'

const { getExpression } = useUserSession()
const api = useApi()
const router = useRouter()

const filters = ref('')
const data = ref([])

const filteredData = computed(() => {
  if (!filters.value) {
    return data.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return data.value.filter((item) => {
      return (
        item.receiptNo?.match(filterRe) ||
        item.warehouseName?.match(filterRe) ||
        item.firmName?.match(filterRe) ||
        item.plantName?.match(filterRe) ||
        item.explanation?.match(filterRe) ||
        item.loadDate?.match(filterRe)
      )
    })
  }
})

const openDetail = (id: number) => {
  router.push({
    name: 'wrmove-slug',
    params: {
      slug: id,
    },
  })
}

onMounted(async () => {
  try {
    data.value = (await api.get('WarehouseLoad/ListAll')).data
  } catch (error) { }
})

const columns = {
  receiptNo: 'Fiş No',
  loadDate: 'Tarih',
  loadTypeText: 'Hareket Türü',
  firmName: 'Firma',
  warehouseName: getExpression('WarehouseName'),
  plantName: getExpression('Factory'),
  explanation: 'Açıklama',
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
        <input v-model="filters" class="input custom-text-filter" :placeholder="getExpression('Search')" />
      </VControl>

      <VButton :color="'info'" :raised="true" icon="feather:plus" @click="openDetail(0)">Yeni</VButton>
    </div>

    <div class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage v-if="!filteredData.length" :title="getExpression('AnyDataDoesntExists')" subtitle="" larger>
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="filteredData.length" class="tab-content is-active">
        <VFlexTable :data="filteredData" :columns="columns" clickable compact separators>
          <template #body>
            <TransitionGroup name="list" tag="div" class="flex-list-inner">
              <!--Table item-->
              <div v-for="item in filteredData" :key="item.id" class="flex-table-item">
                <VFlexTableCell>
                  <span class="">{{ item.receiptNo }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ dateToStr(item.loadDate) }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.loadTypeText }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.firmName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{
                    item.loadType != 3 ? item.warehouseName : '-'
                  }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.plantName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.explanation }}</span>
                </VFlexTableCell>
                <VFlexTableCell :columns="{ align: 'end' }">
                  <button class="button v-button has-dot dark-outlined is-info is-pushed-mobile mx-auto"
                    @click="openDetail(item.id)">
                    <i aria-hidden="true" class="fas fa-search dot mr-0"></i>
                  </button>
                </VFlexTableCell>
              </div>
            </TransitionGroup>
          </template>
        </VFlexTable>

        <VFlex class="mt-5">
          <VCard class="p-1">
            <VSnack :title="filteredData.length + ' ' + getExpression('RecordsDisplayed')" size="small" solid
              class="mt-2 ml-2" color="info" icon="feather:info">
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
    