<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Ref } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false,
  },
  departmentId: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits({
  close: () => true,
  saved: (result: Boolean) => result,
})

const api = useApi()
const loadStep = ref(0)
const filters = ref('')
const selectedEmployees: Ref<any[]> = ref([])
const employees: Ref<any[]> = ref([])
const departmentModel: Ref<any> = ref({})
const filteredEmployees = computed(() => {
  if (!filters.value) {
    return employees.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return employees.value.filter((item) => {
      return (
        item.employeeCode?.match(filterRe) ||
        item.employeeName?.match(filterRe) ||
        item.plantName?.match(filterRe) ||
        item.employeeCardCode?.match(filterRe)
      )
    })
  }
})
const itemSelectionModel: Ref<any> = ref({
  itemCategoryId: null,
  itemGroupId: null,
  itemId: null,
})
const itemCategories: Ref<any[]> = ref([])
const itemGroups: Ref<any[]> = ref([])
const items: Ref<any[]> = ref([])
const makeSave = ref(false)

const notif = useNotyf()

const bindModel = async () => {
  try {
    departmentModel.value = (await api.get('Department/' + props.departmentId)).data

    employees.value = (
      await api.get('Department/' + props.departmentId + '/Employees')
    ).data

    selectedEmployees.value = employees.value.map((d: any) => {
      return {
        ...d,
      }
    })

    itemCategories.value = (
      await api.get('Plant/' + departmentModel.value.plantId + '/ItemCategories')
    ).data
  } catch (error) {}
}

const columns = {
  employeeCode: 'Personel Kodu',
  employeeName: 'Personel Adı',
  employeeCardCode: 'Kart No',
  actions: {
    label: '#',
    align: 'center',
  },
} as const

const onSelectEmployee = (employee: any, event: any) => {
  if (event.target.checked == true) {
    if (!selectedEmployees.value.some((d: any) => d.id == employee.id))
      selectedEmployees.value.push({ ...employee })
  } else {
    const currentEmployee = selectedEmployees.value.find((d: any) => d.id == employee.id)
    if (currentEmployee) {
      const currentIndex = selectedEmployees.value.indexOf(currentEmployee)
      selectedEmployees.value.splice(currentIndex, 1)
    }
  }
}

const isEmployeeSelected = (employeeId: number) => {
  return selectedEmployees.value.some((d: any) => d.id == employeeId)
}

const onItemCategoryChanged = async (categoryId: any) => {
  itemSelectionModel.value.itemCategoryId = categoryId
  itemSelectionModel.value.itemGroupId = null
  itemSelectionModel.value.itemId = null
  await bindItemGroups()
}

const onItemGroupChanged = async (groupId: any) => {
  itemSelectionModel.value.itemGroupId = groupId
  itemSelectionModel.value.itemId = null
  await bindItems()
}

const bindItemGroups = async () => {
  if (itemSelectionModel.value.itemCategoryId) {
    itemGroups.value = (
      await api.get('ItemCategory/' + itemSelectionModel.value.itemCategoryId + '/Groups')
    ).data
  } else itemGroups.value = []
}

const bindItems = async () => {
  if (itemSelectionModel.value.itemGroupId) {
    items.value = (
      await api.get('ItemGroup/' + itemSelectionModel.value.itemGroupId + '/Items')
    ).data
  } else items.value = []
}

const proceedStep = () => {
  if (loadStep.value == 0) {
    if (selectedEmployees.value.length == 0) {
      notif.error(
        'Devam edebilmek için bir veya daha fazla personel seçimi yapmalısınız.'
      )
      return
    }

    loadStep.value++
  } else if (loadStep.value == 1) {
    if (itemSelectionModel.value.itemCategoryId == null) {
      notif.error(
        'Devam edebilmek için bir kategori, grup veya stok seçimi yapmalısınız.'
      )
      return
    }

    loadStep.value++
  }
}

const saveLoad = async () => {
  makeSave.value = true
}

const onSaveComplete = () => {
  makeSave.value = false
  emit('saved', true)
}

const toggleEmployeeSelection = () => {
  if (selectedEmployees.value.length > 0) {
    selectedEmployees.value.splice(0, selectedEmployees.value.length)
  } else {
    selectedEmployees.value = [...employees.value]
  }
}

watch(
  () => props.visible,
  async () => {
    if (props.visible) {
      loadStep.value = 0
      await bindModel()
    }
  }
)
</script>

<template>
  <VModal
    :open="props.visible"
    title="Toplu Kredi Yükleme"
    size="large"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <div class="columns is-multiline">
          <div class="column is-12">
            <VMessage v-show="loadStep < 2" color="info">
              <i class="iconify" data-icon="feather:info" aria-hidden="true"></i>
              <span class="ml-2">{{
                loadStep == 0
                  ? 'Yükleme işlemine başlamak için personel seçimini onaylayın.'
                  : 'Stok seçimini belirleyin.'
              }}</span>
            </VMessage>

            <!-- EMPLOYEE SELECTION TABLE -->
            <div v-show="loadStep == 0" class="list-flex-toolbar is-reversed">
              <VControl icon="feather:search">
                <input
                  v-model="filters"
                  class="input custom-text-filter"
                  placeholder="Arama..."
                />
              </VControl>
              <VButton
                icon="feather:check"
                class="mt-1 mr-2"
                color="info"
                raised
                @click="toggleEmployeeSelection()"
              >
                Tümünü Seç / Kaldır
              </VButton>
            </div>

            <div v-show="loadStep == 0" class="flex-list-wrapper flex-list-v3">
              <!--List Empty Search Placeholder -->
              <VPlaceholderPage
                v-if="!filteredEmployees.length"
                title="Herhangi bir veri görüntülenemiyor."
                subtitle=""
                larger
              >
              </VPlaceholderPage>

              <!--Active Tab-->
              <div v-else-if="filteredEmployees.length" class="tab-content is-active">
                <VFlexTable
                  :data="filteredEmployees"
                  :columns="columns"
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
                      <div
                        v-for="item in filteredEmployees"
                        :key="item.id"
                        class="flex-table-item"
                        :class="{ 'selected-row': isEmployeeSelected(item.id) }"
                      >
                        <VFlexTableCell>
                          <span class="">{{ item.employeeCode }}</span>
                        </VFlexTableCell>
                        <VFlexTableCell>
                          <span class="">{{ item.employeeName }}</span>
                        </VFlexTableCell>
                        <VFlexTableCell>
                          <span class="">{{ item.employeeCardCode }}</span>
                        </VFlexTableCell>
                        <VFlexTableCell :columns="{ align: 'end' }">
                          <VCheckbox
                            :checked="isEmployeeSelected(item.id)"
                            color="info"
                            @change="onSelectEmployee(item, $event)"
                          />
                        </VFlexTableCell>
                      </div>
                    </TransitionGroup>
                  </template>
                </VFlexTable>
              </div>
            </div>

            <!-- ITEM SELECTION -->
            <div v-show="loadStep == 1" class="columns is-multiline">
              <div class="column is-12">
                <VField>
                  <label>Stok Kategorisi</label>
                  <VControl>
                    <Multiselect
                      v-model="itemSelectionModel.itemCategoryId"
                      :value-prop="'id'"
                      :label="'itemCategoryName'"
                      placeholder="Bir kategori seçiniz"
                      :searchable="true"
                      :options="itemCategories"
                      @change="onItemCategoryChanged"
                    />
                  </VControl>
                </VField>
              </div>
              <div class="column is-12">
                <VField>
                  <label>Stok Grubu</label>
                  <VControl>
                    <Multiselect
                      v-model="itemSelectionModel.itemGroupId"
                      :value-prop="'id'"
                      :label="'itemGroupName'"
                      placeholder="Bir grup seçiniz"
                      :searchable="true"
                      :options="itemGroups"
                      @change="onItemGroupChanged"
                    />
                  </VControl>
                </VField>
              </div>
              <div class="column is-12">
                <VField>
                  <label>Stok</label>
                  <VControl>
                    <Multiselect
                      v-model="itemSelectionModel.itemId"
                      :value-prop="'id'"
                      :label="'itemName'"
                      placeholder="Bir stok seçiniz"
                      :searchable="true"
                      :options="items"
                    />
                  </VControl>
                </VField>
              </div>
            </div>

            <!-- LOAD CREDIT PARAMS -->
            <div v-show="loadStep == 2">
              <LoadCredit
                :params="{
                  creditId: 0,
                  employeeId: 0,
                  itemCategoryId: itemSelectionModel.itemCategoryId,
                  itemGroupId: itemSelectionModel.itemGroupId,
                  itemId: itemSelectionModel.itemId,
                  employees: selectedEmployees.map((d: any) => d.id)
                }"
                :is-bulk="true"
                :show-headers="false"
                :trigger-save="makeSave"
                @submit="onSaveComplete"
              />
            </div>

            <!-- STATUS INFORMATION PANEL -->
            <VFlex class="mt-2">
              <VCard class="p-1">
                <VSnack
                  v-show="loadStep == 0"
                  :title="filteredEmployees.length + ' kayıt görüntüleniyor'"
                  size="small"
                  solid
                  class="mt-2 ml-2"
                  color="info"
                  icon="feather:info"
                >
                </VSnack>
                <VSnack
                  :title="selectedEmployees.length + ' kayıt seçildi'"
                  size="small"
                  solid
                  class="mt-2 ml-2"
                  color="success"
                  icon="feather:check"
                >
                </VSnack>

                <VButton
                  v-show="loadStep < 2"
                  icon="feather:arrow-right"
                  class="mt-1 mr-2"
                  style="float: right"
                  color="info"
                  raised
                  @click="proceedStep()"
                >
                  İleri
                </VButton>
                <VButton
                  v-show="loadStep > 0"
                  icon="feather:arrow-left"
                  class="mt-1 mr-2"
                  style="float: right"
                  color="info"
                  raised
                  @click="loadStep--"
                >
                  Geri
                </VButton>
              </VCard>
            </VFlex>
          </div>
        </div>
      </form>
    </template>
    <template #action>
      <VButton v-show="loadStep == 2" color="primary" raised @click="saveLoad()"
        >Kaydet</VButton
      >
    </template>
  </VModal>
</template>
<style lang="scss">
.transfer-template-heading {
  color: #037003 !important;
  border: 1px solid green;
  padding-top: 10px !important;
  margin: 2px !important;
  border-radius: 5px;
}
.selected-row,
.selected-row:hover {
  background-color: #ddfcdd !important;
}
</style>