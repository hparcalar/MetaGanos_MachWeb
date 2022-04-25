<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'

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
        item.employeeCode.match(filterRe) ||
        item.employeeName.match(filterRe) ||
        item.plantName.match(filterRe) ||
        item.departmentName.match(filterRe) ||
        item.employeeCardCode.match(filterRe)
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
    await bindList()
  } catch (error) {}
})

const columns = {
  employeeCode: 'Personel Kodu',
  employeeName: 'Personel Adı',
  plantName: 'Fabrika',
  departmentName: 'Departman',
  employeeCardCode: 'Kart No',
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
          placeholder="Arama..."
        />
      </VControl>

      <VButton
        class="ml-5"
        :color="'success'"
        :raised="true"
        icon="feather:upload"
        @click="openFileDialog"
        >Dosyadan Yükle</VButton
      >

      <VButton :color="'info'" :raised="true" icon="feather:plus" @click="openDetail(0)"
        >Yeni Personel</VButton
      >
    </div>

    <div class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage
        v-if="!filteredData.length"
        title="Henüz bir personel tanımı mevcut değil."
        subtitle="Yeni bir personel tanımlayın."
        larger
      >
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="filteredData.length" class="tab-content is-active">
        <VFlexTable :data="filteredData" :columns="columns" rounded>
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
                <VFlexTableCell>
                  <span class="">{{ item.employeeCardCode }}</span>
                </VFlexTableCell>
                <VFlexTableCell :columns="{ align: 'end' }">
                  <button
                    class="button v-button has-dot dark-outlined is-warning is-pushed-mobile"
                    @click="openDetail(item.id)"
                  >
                    <i aria-hidden="true" class="fas fa-edit dot mr-2"></i>
                    Düzenle
                  </button>
                </VFlexTableCell>
              </div>
            </TransitionGroup>
          </template>
        </VFlexTable>

        <!--Table Pagination-->
        <VFlexPagination
          v-if="filteredData.length > 5"
          :item-per-page="10"
          :total-items="filteredData.length"
          :current-page="1"
          :max-links-displayed="10"
        />
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
