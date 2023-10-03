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
  employeeId: number[] | null
  departmentId: number[] | null
}

const { isDealer, user, getExpression } = useUserSession()
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
  employeeId: null,
  departmentId: null,
})
const plants = ref([])
const machines = ref([])
const categories = ref([])
const groups = ref([])
const items = ref([])
const departments = ref([])
const employees: Ref<any[]> = ref([])

const bindFilterModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data
    if (isDealer == false) {
      plants.value = plants.value.filter((d) => d.id == user.FactoryId)
    }

    if (plants.value.length == 1) filterModel.value.plantId = [plants.value[0].id]

    await bindCategories()
    await bindDepartments()
    await bindEmployees()
  } catch (error) { }
}

const bindMachines = async () => {
  if (filterModel.value.plantId) {
    try {
      machines.value = []
      filterModel.value.plantId.forEach(async (d: number) => {
        const plantMachines = (await api.get('Plant/' + d + '/Machines')).data
        if (plantMachines) machines.value = machines.value.concat(plantMachines)
      })
    } catch (error) { }
  }
}

const bindDepartments = async () => {
  try {
    if (filterModel.value.plantId) {
      departments.value = []
      filterModel.value.plantId.forEach(async (d: number) => {
        const plantDeps = (await api.get('Plant/' + d + '/Departments')).data
        if (plantDeps) departments.value = departments.value.concat(plantDeps)
      })
    } else departments.value = []
  } catch (error) { }
}

const bindEmployees = async () => {
  try {
    if (filterModel.value.plantId && filterModel.value.plantId.length > 0) {
      let empData: Array<any> = []
      employees.value = []

      for (let i = 0; i < filterModel.value.plantId.length; i++) {
        const d: number = filterModel.value.plantId[i]
        const plantEmps = (await api.get('Plant/' + d + '/Employees')).data
        if (plantEmps) empData = empData.concat(plantEmps)
      }

      if (filterModel.value.departmentId && filterModel.value.departmentId.length > 0) {
        for (let i = 0; i < filterModel.value.departmentId.length; i++) {
          const d: number = filterModel.value.departmentId[i]
          empData = empData.filter((d: any) =>
            filterModel.value.departmentId?.some(
              (m: any) => parseInt(d.departmentId) == parseInt(m)
            )
          )
        }
      }

      employees.value = empData
    } else employees.value = []
  } catch (error) { }
}

const bindCategories = async () => {
  try {
    categories.value = (await api.get('ItemCategory')).data
  } catch (error) { }
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
    } catch (error) { }
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
    } catch (error) { }
  }
}

const onChangePlant = async (plantId: any) => {
  filterModel.value.machineId = null
  filterModel.value.departmentId = null
  filterModel.value.employeeId = null
  filterModel.value.plantId = plantId
  await bindMachines()
  await bindCategories()
  await bindDepartments()
  await bindEmployees()
}

const onChangeCategory = async (categoryId: any) => {
  filterModel.value.groupId = null
  filterModel.value.itemId = null
  filterModel.value.categoryId = categoryId
  await bindGroups()
}

const onChangeDepartment = async (departmentId: any) => {
  filterModel.value.departmentId = departmentId
  await bindEmployees()
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
          <VDatePicker v-model="filterModel.startDate" mode="dateTime" is24hr
            :masks="{ inputDateTime24hr: 'DD.MM.YYYY HH:mm' }" trim-weeks>
            <template #default="{ inputValue, inputEvents }">
              <VField>
                <label>{{ getExpression('StartDate') }}</label>
                <VControl icon="feather:calendar">
                  <input class="input" type="text" placeholder="" :value="inputValue" v-on="inputEvents" />
                </VControl>
              </VField>
            </template>
          </VDatePicker>
        </VField>
      </div>

      <!-- end date -->
      <div class="column is-4">
        <VField>
          <VDatePicker v-model="filterModel.endDate" mode="dateTime" is24hr
            :masks="{ inputDateTime24hr: 'DD.MM.YYYY HH:mm' }" trim-weeks>
            <template #default="{ inputValue, inputEvents }">
              <VField>
                <label>{{ getExpression('EndDate') }}</label>
                <VControl icon="feather:calendar">
                  <input class="input" type="text" placeholder="" :value="inputValue" v-on="inputEvents" />
                </VControl>
              </VField>
            </template>
          </VDatePicker>
        </VField>
      </div>

      <!-- search button -->
      <div class="column is-4">
        <VButton color="primary" class="mt-5" icon="feather:search" raised @click="triggerForSearch">
          {{ getExpression('Search') }}
        </VButton>
      </div>

      <!-- plant -->
      <div class="column is-4">
        <VField>
          <label>{{ getExpression('Factory') }}</label>
          <VControl>
            <Multiselect v-model="filterModel.plantId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'plantName'" placeholder="" :searchable="true" :options="plants" @change="onChangePlant" />
          </VControl>
        </VField>
      </div>
      <div class="column is-4">
        <VField>
          <label>Departman</label>
          <VControl>
            <Multiselect v-model="filterModel.departmentId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'departmentName'" placeholder="" :searchable="true" :options="departments"
              @change="onChangeDepartment" />
          </VControl>
        </VField>
      </div>

      <!-- employees -->
      <div class="column is-4">
        <VField>
          <label>Personel</label>
          <VControl>
            <Multiselect v-model="filterModel.employeeId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'employeeName'" placeholder="" :searchable="true" :options="employees" />
          </VControl>
        </VField>
      </div>

      <!-- machine -->
      <!-- <div class="column is-4">
        <VField>
          <label>{{ getExpression('Automat') }}</label>
          <VControl>
            <Multiselect v-model="filterModel.machineId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'machineName'" placeholder="" :searchable="true" :options="machines" />
          </VControl>
        </VField>
      </div> -->
    </div>
    <div class="columns is-multiline">
      <!-- item category -->
      <div class="column is-4">
        <VField>
          <label>{{ getExpression('Category') }}</label>
          <VControl>
            <Multiselect v-model="filterModel.categoryId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'itemCategoryName'" placeholder="" :searchable="true" :options="categories"
              @change="onChangeCategory" />
          </VControl>
        </VField>
      </div>

      <!-- item group -->
      <div class="column is-4">
        <VField>
          <label>{{ getExpression('Group') }}</label>
          <VControl>
            <Multiselect v-model="filterModel.groupId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'itemGroupName'" placeholder="" :searchable="true" :options="groups" @change="onChangeGroup" />
          </VControl>
        </VField>
      </div>

      <!-- item -->
      <div class="column is-4">
        <VField>
          <label>{{ getExpression('Item') }}</label>
          <VControl>
            <Multiselect v-model="filterModel.itemId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'itemName'" placeholder="" :searchable="true" :options="items" />
          </VControl>
        </VField>
      </div>
    </div>
    <div class="columns is-multiline">
      <!-- departments -->
      <!-- <div class="column is-4">
        <VField>
          <label>Departman</label>
          <VControl>
            <Multiselect v-model="filterModel.departmentId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'departmentName'" placeholder="" :searchable="true" :options="departments"
              @change="onChangeDepartment" />
          </VControl>
        </VField>
      </div> -->

      <!-- employees -->
      <!-- <div class="column is-4">
        <VField>
          <label>Personel</label>
          <VControl>
            <Multiselect v-model="filterModel.employeeId" mode="tags" class="is-stacked" :value-prop="'id'"
              :label="'employeeName'" placeholder="" :searchable="true" :options="employees" />
          </VControl>
        </VField>
      </div> -->
    </div>
  </div>
</template>