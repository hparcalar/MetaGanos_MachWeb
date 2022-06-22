<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

export type ConsumptionSearchFilter = {
  startDate: Date | null
  endDate: Date | null
  machineId: number[] | null
  plantId: number[] | null
  categoryId: number[] | null
  groupId: number[] | null
  itemId: number[] | null
}

const { isDealer, user } = useUserSession()
const api = useApi()

const props = defineProps({
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
})

const emit = defineEmits({
  searchTriggered: (filter: ConsumptionSearchFilter) => filter,
})

const filterModel: Ref<ConsumptionSearchFilter> = ref({
  startDate: null,
  endDate: null,
  machineId: null,
  plantId: null,
  categoryId: null,
  groupId: null,
  itemId: null,
})
const plants = ref([])
const machines = ref([])
const categories = ref([])
const groups = ref([])
const items = ref([])

const bindFilterModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data
    if (isDealer == false) {
      plants.value = plants.value.filter((d) => d.id == user.FactoryId)
    }
    categories.value = (await api.get('ItemCategory')).data
  } catch (error) {}
}

const bindMachines = async () => {
  if (filterModel.value.plantId) {
    try {
      machines.value = []
      filterModel.value.plantId.forEach(async (d: number) => {
        const plantMachines = (await api.get('Plant/' + d + '/Machines')).data
        if (plantMachines) machines.value = machines.value.concat(plantMachines)
      })
    } catch (error) {}
  }
}

const bindGroups = async () => {
  if (filterModel.value.categoryId) {
    try {
      groups.value = []
      filterModel.value.categoryId.forEach(async (d: number) => {
        const categoryGroups = (await api.get('ItemCategory/' + d + '/Groups')).data
        if (categoryGroups) groups.value = groups.value.concat(categoryGroups)
      })

      await bindItems()
    } catch (error) {}
  }
}

const bindItems = async () => {
  if (filterModel.value.categoryId) {
    try {
      items.value = []
      filterModel.value.categoryId.forEach(async (d: number) => {
        const properItems = (await api.get('ItemCategory/' + d + '/Items')).data
        if (properItems) {
          if (filterModel.value.groupId?.some((m: any) => m.itemCategoryId == d)) {
            const filteredGroups = filterModel.value.groupId?.filter(
              (m: any) => m.itemCategoryId == d
            )
            const groupedProperItems = properItems.filter((m: any) =>
              filteredGroups.some((h: any) => h.id == m.itemGroupId)
            )
            if (groupedProperItems) items.value = items.value.concat(groupedProperItems)
          } else {
            items.value = items.value.concat(properItems)
          }
        }
      })
    } catch (error) {}
  }
}

const onChangePlant = async (plantId: any) => {
  filterModel.value.machineId = null
  filterModel.value.plantId = plantId
  await bindMachines()
}

const onChangeCategory = async (categoryId: any) => {
  filterModel.value.groupId = null
  filterModel.value.itemId = null
  filterModel.value.categoryId = categoryId
  await bindGroups()
}

const onChangeGroup = async (groupId: any) => {
  filterModel.value.itemId = null
  filterModel.value.groupId = groupId
  await bindItems()
}

onMounted(async () => {
  filterModel.value.startDate = props.startDate
  filterModel.value.endDate = props.endDate
  await bindFilterModel()
})

const triggerForSearch = () => {
  emit('searchTriggered', filterModel.value)
}

watch(
  () => props.startDate,
  () => {
    if (props.startDate) filterModel.value.startDate = props.startDate
  }
)

watch(
  () => props.endDate,
  () => {
    if (props.endDate) filterModel.value.endDate = props.endDate
  }
)
</script>

<template>
  <div>
    <div class="columns is-multiline">
      <!-- start date -->
      <div class="column is-4">
        <VField>
          <VDatePicker
            v-model="filterModel.startDate"
            mode="dateTime"
            is24hr
            :masks="{ inputDateTime24hr: 'DD.MM.YYYY HH:mm' }"
            trim-weeks
          >
            <template #default="{ inputValue, inputEvents }">
              <VField>
                <label>Başlangıç Tarihi</label>
                <VControl icon="feather:calendar">
                  <input
                    class="input"
                    type="text"
                    placeholder="Bir tarih seçin"
                    :value="inputValue"
                    v-on="inputEvents"
                  />
                </VControl>
              </VField>
            </template>
          </VDatePicker>
        </VField>
      </div>

      <!-- end date -->
      <div class="column is-4">
        <VField>
          <VDatePicker
            v-model="filterModel.endDate"
            mode="dateTime"
            is24hr
            :masks="{ inputDateTime24hr: 'DD.MM.YYYY HH:mm' }"
            trim-weeks
          >
            <template #default="{ inputValue, inputEvents }">
              <VField>
                <label>Bitiş Tarihi</label>
                <VControl icon="feather:calendar">
                  <input
                    class="input"
                    type="text"
                    placeholder="Bir tarih seçin"
                    :value="inputValue"
                    v-on="inputEvents"
                  />
                </VControl>
              </VField>
            </template>
          </VDatePicker>
        </VField>
      </div>

      <!-- search button -->
      <div class="column is-4">
        <VButton
          color="primary"
          class="mt-5"
          icon="feather:search"
          raised
          @click="triggerForSearch"
        >
          Ara
        </VButton>
      </div>

      <!-- plant -->
      <div class="column is-4">
        <VField>
          <label>Fabrika</label>
          <VControl>
            <Multiselect
              v-model="filterModel.plantId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'plantName'"
              placeholder="Bir fabrika seçiniz"
              :searchable="true"
              :options="plants"
              @change="onChangePlant"
            />
          </VControl>
        </VField>
      </div>

      <!-- machine -->
      <div class="column is-4">
        <VField>
          <label>Otomat</label>
          <VControl>
            <Multiselect
              v-model="filterModel.machineId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'machineName'"
              placeholder="Bir otomat seçiniz"
              :searchable="true"
              :options="machines"
            />
          </VControl>
        </VField>
      </div>
    </div>
    <div class="columns is-multiline">
      <!-- item category -->
      <div class="column is-4">
        <VField>
          <label>Kategori</label>
          <VControl>
            <Multiselect
              v-model="filterModel.categoryId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'itemCategoryName'"
              placeholder="Bir kategori seçiniz"
              :searchable="true"
              :options="categories"
              @change="onChangeCategory"
            />
          </VControl>
        </VField>
      </div>

      <!-- item group -->
      <div class="column is-4">
        <VField>
          <label>Grup</label>
          <VControl>
            <Multiselect
              v-model="filterModel.groupId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'itemGroupName'"
              placeholder="Bir grup seçiniz"
              :searchable="true"
              :options="groups"
              @change="onChangeGroup"
            />
          </VControl>
        </VField>
      </div>

      <!-- item -->
      <div class="column is-4">
        <VField>
          <label>Stok</label>
          <VControl>
            <Multiselect
              v-model="filterModel.itemId"
              mode="tags"
              class="is-stacked"
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
  </div>
</template>