<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

const { getExpression, isDealer, hasAuth } = useUserSession()
const api = useApi()
const router = useRouter()
const currentPage = ref(0)

const filters = ref('')
const employees = ref([])
const pagedData = ref({ currentPage: 0, totalPages: 0, totalRecords: 0, data: [] })

const openDetail = (id: number) => {
  router.push({
    name: 'employee-slug',
    params: {
      slug: id,
    },
  })
}

const isFileDialogVisible = ref(false)
const isExportDialogVisible = ref(false)

const openFileDialog = () => {
  isFileDialogVisible.value = true
}

const openExportDialog = () => {
  isExportDialogVisible.value = true
}

const onUploadSucceed = async (result: Boolean) => {
  if (result) {
    isFileDialogVisible.value = false
    await bindList()
  }
}

const onExportSucceed = async (result: Boolean) => {
  if (result) {
    isExportDialogVisible.value = false
  }
}

const bindList = async () => {
  pagedData.value = (
    await api.get('Employee/ListByPage/' + currentPage.value + '?search=' + filters.value)
  ).data

  employees.value = pagedData.value.data
}

onMounted(async () => {
  try {
    if (!hasAuth('EmployeeCards', 'Read')) delete columns.employeeCardCode

    await bindList()
  } catch (error) {}
})

const onFilterChanged = async (event: any) => {
  filters.value = event.target.value
  currentPage.value = 0
  await bindList()
}

const onPageChanged = async (page: any) => {
  currentPage.value = page - 1
  await bindList()
}

const columns = {
  employeeCode: getExpression('EmployeeCode'),
  employeeName: getExpression('EmployeeName'),
  plantName: getExpression('Factory'),
  departmentName: getExpression('Department'),
  employeeCardCode: getExpression('CardNo'),
  actions: {
    label: '#',
    align: 'center',
  },
}
</script>

<template>
  <div>
    <div class="list-flex-toolbar is-reversed">
      <VControl icon="feather:search">
        <input
          v-model="filters"
          class="input custom-text-filter"
          :placeholder="getExpression('Search')"
          @change="onFilterChanged"
        />
      </VControl>

      <VButton
        class="ml-5"
        :color="'success'"
        :raised="true"
        icon="feather:upload"
        @click="openFileDialog"
        >{{ getExpression('ImportFromFile') }}</VButton
      >

      <VButton
        class="ml-5"
        :color="'info'"
        :raised="true"
        icon="feather:upload"
        @click="openExportDialog"
        >Dışarı Aktar</VButton
      >

      <VButton
        :color="'info'"
        :raised="true"
        icon="feather:plus"
        @click="openDetail(0)"
        >{{ getExpression('NewEmployee') }}</VButton
      >
    </div>

    <div class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage
        v-if="!employees"
        :title="getExpression('AnyDataDoesntExists')"
        subtitle=""
        larger
      >
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="employees" class="tab-content is-active">
        <VFlexTable :data="employees" :columns="columns" clickable compact separators>
          <template #body>
            <TransitionGroup name="list" tag="div" class="flex-list-inner">
              <!--Table item-->
              <div v-for="item in employees" :key="item.id" class="flex-table-item">
                <VFlexTableCell>
                  <span class="">{{ item.employeeCode }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.employeeName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.plantName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.departmentName }}</span>
                </VFlexTableCell>
                <VFlexTableCell v-if="hasAuth('EmployeeCards', 'Read')">
                  <span class="">{{ item.employeeCardCode }}</span>
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

        <!--Table Pagination-->
        <VFlexPagination
          v-if="pagedData.totalRecords > 10"
          :item-per-page="10"
          :total-items="pagedData.totalRecords"
          :current-page="currentPage + 1"
          :max-links-displayed="10"
          :no-router="true"
          @update:current-page="onPageChanged"
        />

        <VFlex class="mt-5">
          <VCard class="p-1">
            <VSnack
              :title="'Toplam: ' + pagedData.totalRecords + ' kayıt'"
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

  <UploadEmployeeData
    :visible="isFileDialogVisible"
    @file-saved="onUploadSucceed"
    @close="isFileDialogVisible = false"
  />

  <ExportEmployeeData
    :visible="isExportDialogVisible"
    @file-saved="onExportSucceed"
    @close="isExportDialogVisible = false"
  />
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
