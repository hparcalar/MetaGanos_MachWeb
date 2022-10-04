<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

export type WarehouseItemStatusSearchFilter = {
  plantId: number[] | null
  categoryId: number[] | null
  groupId: number[] | null
  itemId: number[] | null
  warehouseId: number | null
}

const { isDealer, user, getExpression } = useUserSession()
const api = useApi()

const emit = defineEmits({
  searchTriggered: (filter: WarehouseItemStatusSearchFilter) => filter,
})

const filterModel: Ref<WarehouseItemStatusSearchFilter> = ref({
  plantId: null,
  categoryId: null,
  groupId: null,
  itemId: null,
  warehouseId: null,
})
const plants = ref([])
const machines = ref([])
const categories = ref([])
const groups = ref([])
const items = ref([])
const warehouses = ref([])

const bindFilterModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data
    if (isDealer == false) {
      plants.value = plants.value.filter((d) => d.id == user.FactoryId)
    }

    if (plants.value.length == 1) filterModel.value.plantId = [plants.value[0].id]

    categories.value = (await api.get('ItemCategory')).data
    warehouses.value = (await api.get('Warehouse')).data
  } catch (error) {}
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

  categories.value = (await api.get('ItemCategory')).data
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
  await bindFilterModel()
})

const triggerForSearch = () => {
  emit('searchTriggered', filterModel.value)
}
</script>
    
    <template>
  <div>
    <div class="columns is-multiline">
      <!-- plant -->
      <div class="column is-4">
        <VField>
          <label>{{ getExpression('Factory') }}</label>
          <VControl>
            <Multiselect
              v-model="filterModel.plantId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'plantName'"
              placeholder=""
              :searchable="true"
              :options="plants"
              @change="onChangePlant"
            />
          </VControl>
        </VField>
      </div>

      <!-- warehouse -->
      <!-- <div class="column is-4">
        <VField>
          <label>Depo</label>
          <VControl>
            <Multiselect
              v-model="filterModel.warehouseId"
              class="is-stacked"
              :value-prop="'id'"
              :label="'warehouseName'"
              placeholder=""
              :searchable="true"
              :options="warehouses"
              @change="triggerForSearch"
            />
          </VControl>
        </VField>
      </div> -->
      <!-- search button -->
      <div class="column is-4">
        <VButton
          color="primary"
          class="mt-5"
          icon="feather:search"
          raised
          @click="triggerForSearch"
        >
          {{ getExpression('Search') }}
        </VButton>
      </div>
    </div>
    <div class="columns is-multiline">
      <!-- item category -->
      <div class="column is-4">
        <VField>
          <label>{{ getExpression('Category') }}</label>
          <VControl>
            <Multiselect
              v-model="filterModel.categoryId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'itemCategoryName'"
              placeholder=""
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
          <label>{{ getExpression('Group') }}</label>
          <VControl>
            <Multiselect
              v-model="filterModel.groupId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'itemGroupName'"
              placeholder=""
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
          <label>{{ getExpression('Item') }}</label>
          <VControl>
            <Multiselect
              v-model="filterModel.itemId"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'itemName'"
              placeholder=""
              :searchable="true"
              :options="items"
            />
          </VControl>
        </VField>
      </div>
    </div>
  </div>
</template>