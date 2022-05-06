<script setup lang="ts">
import moment from 'moment'
import { computed, ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { ConsumptionSearchFilter } from '/@src/components/partials/filters/ConsumptionFilter.vue'
import { useApi } from '/@src/composable/useApi'
import { dateToStr, timeToStr, removeTime } from '/@src/composable/useHelpers'

const api = useApi()

const filters = ref('')
const reportData = ref([])
const startDate: Ref<Date | null> = ref(null)
const endDate: Ref<Date | null> = ref(null)

const filteredData = computed(() => {
  if (!filters.value) {
    return reportData.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return reportData.value.filter((item: any) => {
      return (
        item.itemName?.match(filterRe) ||
        item.itemCategoryName?.match(filterRe) ||
        item.itemGroupName?.match(filterRe) ||
        item.machineName?.match(filterRe) ||
        item.employeeName?.match(filterRe)
      )
    })
  }
})

onMounted(async () => {
  await getReportData()
})

const getReportData = async (filterModel: ConsumptionSearchFilter | null = null) => {
  try {
    if (!filterModel) {
      filterModel = {
        startDate: removeTime(moment().toDate()),
        endDate: moment(removeTime(moment().toDate()))
          .add(23, 'hour')
          .add(59, 'minute')
          .toDate(),
        machineId: null,
        plantId: null,
        categoryId: null,
        groupId: null,
        itemId: null,
      }

      startDate.value = filterModel.startDate
      endDate.value = filterModel.endDate
    }

    reportData.value = (await api.post('Machine/ConsumeReport', filterModel)).data
  } catch (error) {}
}

const columns = {
  consumedDate: 'Tarih',
  consumedTime: 'Saat',
  employeeName: 'Personel',
  machineName: 'Makine',
  itemCategoryName: 'Kategori',
  itemName: 'Stok',
  totalConsumed: 'Miktar',
} as const
</script>

<template>
  <div>
    <div>
      <h1 class="title is-narrow mb-5">Tüketim Raporu</h1>
      <ConsumptionFilter
        class="mb-5"
        :start-date="startDate"
        :end-date="endDate"
        @search-triggered="getReportData"
      />
    </div>
    <div class="list-flex-toolbar is-reversed">
      <VControl icon="feather:search">
        <input
          v-model="filters"
          class="input custom-text-filter"
          placeholder="Arama..."
        />
      </VControl>

      <VButton color="success" icon="feather:download" raised>
        <vue3-json-excel
          :json-data="reportData"
          :fields="{
            Tarih: 'consumedDate',
            Saat: 'consumedDate',
            Personel: 'employeeName',
            Otomat: 'machineName',
            Kategori: 'itemCategoryName',
            Stok: 'itemName',
            Miktar: 'totalConsumed',
          }"
          type="xlsx"
          name="tuketim-raporu.xlsx"
          header="Tüketim Raporu"
          >Dışarı Aktar</vue3-json-excel
        >
      </VButton>
    </div>

    <div class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage
        v-if="!filteredData.length"
        title="Henüz bir tüketim verisi mevcut değil."
        subtitle=""
        larger
      >
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="filteredData.length" class="tab-content is-active">
        <VFlexTable
          id="reportTable"
          :data="filteredData"
          :columns="columns"
          clickable
          compact
          separators
        >
          <template #body>
            <TransitionGroup
              name="list"
              tag="div"
              class="flex-list-inner flex-list-small"
            >
              <!--Table item-->
              <div v-for="item in filteredData" :key="item" class="flex-table-item">
                <VFlexTableCell>
                  <span class="">{{ dateToStr(item.consumedDate) }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ timeToStr(item.consumedDate) }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.employeeName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.machineName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.itemCategoryName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.itemName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.totalConsumed }}</span>
                </VFlexTableCell>
              </div>
            </TransitionGroup>
          </template>
        </VFlexTable>

        <VFlex class="mt-5">
          <VCard class="p-1">
            <VSnack
              :title="filteredData.length + ' kayıt görüntüleniyor'"
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
