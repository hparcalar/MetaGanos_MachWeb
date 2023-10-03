<script setup lang="ts">
import moment from 'moment'
import { computed, ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { ConsumptionSearchFilter } from '/@src/components/partials/filters/ConsumptionFilter.vue'
import { useApi } from '/@src/composable/useApi'
import { dateToStr, timeToStr, removeTime } from '/@src/composable/useHelpers'
import { useUserSession } from '/@src/stores/userSession'
import EditConsume from '../../partials/employee/EditConsume.vue'
import pdfMake from 'pdfmake/build/pdfmake'
// import pdfFonts from 'pdfmake/build/vfs_fonts'
import { pdfVfs as pdfCustomFonts } from '/@src/composable/pdfMakeFont'

const { getExpression } = useUserSession()
const api = useApi()

const filters = ref('')
const reportData = ref([])
const startDate: Ref<Date | null> = ref(null)
const endDate: Ref<Date | null> = ref(null)
const reportIsBeingFetched = ref(false)

const isConsumeDialogOpen = ref(false)
const consumeModel = ref({ id: 0 })

const filteredData = computed(() => {
  if (!filters.value) {
    return reportData.value
  } else {
    const filterRe = new RegExp(filters.value.replace('İ', 'i'), 'i')

    return reportData.value.filter((item: any) => {
      return (
        item.itemName?.match(filterRe) ||
        item.itemCategoryName?.match(filterRe) ||
        item.itemGroupName?.match(filterRe) ||
        item.machineName?.match(filterRe) ||
        item.employeeCode?.match(filterRe) ||
        item.departmentName?.match(filterRe) ||
        item.employeeName?.match(filterRe)
      )
    })
  }
})

const lastFilterModel: Ref<any> = ref(null)

onMounted(async () => {
  pdfMake.fonts = {
    RobotoItalic: {
      normal: 'Roboto-Italic.ttf',
      bold: 'Roboto-Italic.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-Italic.ttf',
    },
  }
  pdfMake.vfs = pdfCustomFonts
  await getReportData()
})

const getReportData = async (filterModel: ConsumptionSearchFilter | null = null) => {
  reportIsBeingFetched.value = true
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

    lastFilterModel.value = filterModel

    const filterPrm = {
      ...filterModel,
      startDate: moment(filterModel.startDate).format('yyyy-MM-DDTHH:mm:SS.000Z'),
      endDate: moment(filterModel.endDate).format('yyyy-MM-DDTHH:mm:SS.000Z'),
    }

    reportData.value.splice(0, reportData.value.length)
    reportData.value = (await api.post('Return/ReturnReport', filterPrm)).data
  } catch (error) {
    console.error(error)
  }

  reportIsBeingFetched.value = false
}

const exportToExcel = async () => {
  if (!lastFilterModel.value) {
    lastFilterModel.value = {
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

    startDate.value = lastFilterModel.value.startDate
    endDate.value = lastFilterModel.value.endDate
  }

  const filterPrm = {
    ...lastFilterModel.value,
    startDate: moment(lastFilterModel.value.startDate).format('yyyy-MM-DDTHH:mm:SS.000Z'),
    endDate: moment(lastFilterModel.value.endDate).format('yyyy-MM-DDTHH:mm:SS.000Z'),
  }

  const bs64Str = (await api.post('Return/ExcelReturnReport', filterPrm)).data
  downloadFile(bs64Str)
}

const exportToPdf = async () => {
  var data = []
  data.push([
    'Tarih',
    'Saat',
    'Personel Kodu',
    'Sicil Kodu',
    'Personel',
    'Dpt. Kodu',
    'Dpt. Adı',
    'Kategori',
    'Stok',
    'Miktar',
  ])

  filteredData.value.forEach((item: any) => {
    data.push([
      dateToStr(item.returnDate) ?? '',
      timeToStr(item.returnDate) ?? '',
      item.employeeCode ?? '',
      item.employeeCardCode ?? '',
      item.employeeName ?? '',
      item.departmentCode ?? '',
      item.departmentName ?? '',
      item.itemCategoryName ?? '',
      item.itemName ?? '',
      item.quantity ?? '',
    ])
  })
  let docDefinition = {
    pageOrientation: 'landscape',
    pageSize: 'A4',
    defaultStyle: {
      fontSize: 10,
      bold: false,
      font: 'RobotoItalic',
    },
    pageMargins: [15, 25, 15, 25],
    content: [
      {
        layout: 'lightHorizontalLines', // optional
        table: {
          headerRows: 1,
          body: filteredData.value.length > 0 ? data : [['Veri Bulunamadı']],
        },
      },
    ],
  }
  const pdf = pdfMake.createPdf(docDefinition)
  pdf.download('Tuketim Raporu.pdf')
}

const showEditConsumeForm = async (id: any) => {
  consumeModel.value.id = id
  isConsumeDialogOpen.value = true
}

const onConsumeDialogSubmit = async () => {
  await getReportData(lastFilterModel.value)
  isConsumeDialogOpen.value = false
}

const downloadFile = function (base64: any) {
  let bytes = base64ToByteArray(base64)

  let blob = new Blob([bytes], { type: 'application/octet-stream' })
  let link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)

  let fileName = 'iade_raporu.xlsx'
  link.download = fileName
  link.click()
}

const base64ToByteArray = function (base64: any) {
  let binaryString = window.atob(base64)
  let len = binaryString.length

  let bytes = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const columns = {
  returnDate: getExpression('Date'),
  returnTime: getExpression('Hour'),
  employeeCode: 'Personel Kodu',
  employeeCardCode: 'Sicil Kodu',
  employeeName: getExpression('Employee'),
  departmentCode: 'Dpt. Kodu',
  departmentName: 'Dpt. Adı',
  machineName: getExpression('MachineOrWarehouse'),
  itemCategoryName: getExpression('Category'),
  itemName: getExpression('Item'),
  quantity: getExpression('Quantity'),
  buttons: '#',
} as const
</script>

<template>
  <div>
    <div>
      <h1 class="title is-narrow mb-5">{{ getExpression('ReturnReport') }}</h1>
      <ReturnFilter class="mb-5" :start-date="startDate" :end-date="endDate" @search-triggered="getReportData" />
    </div>
    <div class="list-flex-toolbar is-reversed">
      <VControl icon="feather:search">
        <input v-model="filters" class="input custom-text-filter" :placeholder="getExpression('Search')" />
      </VControl>

      <VButton color="success" icon="feather:download" raised @click="exportToExcel">
        {{ getExpression('Export') }}
        <!-- <vue3-json-excel
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
        type="xls"
        name="tuketim-raporu.xls"
        header="Tüketim Raporu"
        >Dışarı Aktar</vue3-json-excel -->
        <!-- > -->
      </VButton>
      <VButton color="danger" icon="feather:download" raised :style="{ 'margin-right': '5px' }" @click="exportToPdf">
        <!-- {{ getExpression('ExportPDF') }} -->
        PDF Aktar
      </VButton>
    </div>

    <div id="divToPrint" class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage v-if="reportIsBeingFetched" :title="'Yükleniyor'" subtitle="" larger>
      </VPlaceholderPage>

      <VPlaceholderPage v-else-if="!filteredData.length" :title="getExpression('AnyDataDoesntExists')" subtitle="" larger>
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="filteredData.length" class="tab-content is-active">
        <VFlexTable id="reportTable" :data="filteredData" :columns="columns" clickable compact separators>
          <template #body>
            <TransitionGroup name="list" tag="div" class="flex-list-inner flex-list-small">
              <!--Table item-->
              <div v-for="item in filteredData" :key="item" class="flex-table-item">
                <VFlexTableCell>
                  <span class="">{{ dateToStr(item.returnDate) }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ timeToStr(item.returnDate) }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.employeeCode }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.employeeCardCode }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.employeeName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.departmentCode }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.departmentName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{
                    item.machineName && item.machineName.length > 0
                    ? item.machineName
                    : item.warehouseName
                  }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.itemCategoryName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.itemName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.quantity }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <VButton color="warning" icon="feather:edit" raised @click="showEditConsumeForm(item.id)"></VButton>
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

            <VSnack
              :title="'Toplam Tüketim: ' + filteredData.map((m: any) => m.quantity).reduce((a, b) => a + b) + ' ADET'"
              size="small" solid class="mt-2 ml-2 mr-2" style="float: right" color="info" icon="feather:wind">
            </VSnack>
          </VCard>
        </VFlex>
      </div>
    </div>

    <VModal :open="isConsumeDialogOpen" :title="'Tüketim Bilgisi'" size="big" actions="right" :cancel-label="'Vazgeç'"
      @close="isConsumeDialogOpen = false">
      <template #content>
        <EditConsume :params="consumeModel" @submit="onConsumeDialogSubmit" />
      </template>
      <template #action>
        <span />
      </template>
    </VModal>
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
