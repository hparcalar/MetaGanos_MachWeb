<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

const { getExpression, isDealer, hasAuth } = useUserSession()
const api = useApi()
const router = useRouter()

const filters = ref('')
const employees = ref([])

const filteredData = computed(() => {
  if (!filters.value) {
    return employees.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return employees.value.filter((item) => {
      return (
        item.employeeCode?.match(filterRe) ||
        item.employeeName?.match(filterRe) ||
        item.plantName?.match(filterRe) ||
        item.departmentName?.match(filterRe) ||
        item.employeeCardCode?.match(filterRe)
      )
    })
  }
})

const openDetail = (id: number) => {
  router.push({
    name: 'employee-slug',
    params: {
      slug: id,
    },
  })
}

const isFileDialogVisible = ref(false)
const openFileDialog = () => {
  isFileDialogVisible.value = true
}
const onUploadSucceed = async (result: Boolean) => {
  if (result) {
    isFileDialogVisible.value = false
    await bindList()
  }
}

const bindList = async () => {
  employees.value = (await api.get('Employee')).data
}

onMounted(async () => {
  try {
    if (!hasAuth('EmployeeCards', 'Read')) delete columns.employeeCardCode

    await bindList()
  } catch (error) {}
})

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
        v-if="!filteredData.length"
        :title="getExpression('AnyDataDoesntExists')"
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

        <VFlex class="mt-5">
          <VCard class="p-1">
            <VSnack
              :title="filteredData.length + ' ' + getExpression('RecordsDisplayed')"
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
