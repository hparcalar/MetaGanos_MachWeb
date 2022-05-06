<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { creditRangeOption } from '/@src/shared-types'
import type { CreditRangeType } from '/@src/shared-types'
import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
import moment from 'moment'

export type LoadCreditParams = {
  creditId: number
  employeeId: number
  itemCategoryId: number
  itemGroupId: number | null
  itemId: number | null
  employees: any[] | undefined
}

const props = defineProps({
  params: {
    type: Object as PropType<LoadCreditParams>,
    required: true,
  },
  isBulk: {
    type: Boolean,
    default: false,
  },
  showHeaders: {
    type: Boolean,
    default: true,
  },
  triggerSave: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits({
  submit: () => true,
})

const api = useApi()
const userSession = useUserSession()
const notif = useNotyf()

onMounted(async () => {
  creditTypes.value.forEach((c: CreditRangeType) => {
    c.value = userSession.getExpression(c.value)
  })

  await bindCreditModel()
})

const modelDefaults: Ref<any> = ref({
  id: 0,
  employeeId: 0,
  itemCategoryId: props?.params?.itemCategoryId,
  itemGroupId: props?.params?.itemGroupId,
  itemId: props?.params?.itemId,
  activeCredit: 0,
  rangeCredit: 0,
  rangeIndex: 0,
  rangeLength: 1,
  rangeType: 4,
  creditByRange: 0,
  creditLoadDate: moment().toDate(),
  creditStartDate: null,
  creditEndDate: null,
  productIntervalType: null,
  productIntervalTime: null,
  specificRangeDates: null,
})

const modelObject: Ref<any> = ref({ ...modelDefaults.value })

const rangeLimits: Ref<any> = ref({
  startDate: null,
  endDate: null,
})

const modelIsBinding = ref(false)
const itemCategories: Ref<any[]> = ref([])
const schedulerDates: Ref<any[]> = ref([])
const itemGroups: Ref<any[]> = ref([])
const items: Ref<any[]> = ref([])
const creditTypes: Ref<CreditRangeType[]> = ref(creditRangeOption)
const productIntervalTypes = ref([
  { id: 1, name: 'Saat' },
  // { id: 2, name: 'Gün' },
])

const bindCreditModel = async () => {
  modelIsBinding.value = true
  if (modelObject.value.id == 0 && props.params.creditId > 0)
    modelObject.value.id = props.params.creditId

  if (props.params.employeeId > 0 || props.params.employees?.length > 0) {
    const empId =
      props.params.employeeId > 0 ? props.params.employeeId : props.params?.employees[0]
    const empData = (await api.get('Employee/' + empId)).data
    if (empData) {
      itemCategories.value = (
        await api.get('Plant/' + empData.plantId + '/ItemCategories')
      ).data
    }
  }

  if (modelObject.value.id > 0) {
    const existingData = (
      await api.get(
        'Employee/' + props.params.employeeId + '/Credits/' + modelObject.value.id
      )
    ).data
    if (existingData) {
      modelObject.value = existingData
    } else {
      modelObject.value = { ...modelDefaults.value }
      modelObject.value.itemCategoryId = props.params.itemCategoryId
      modelObject.value.itemGroupId = props.params.itemGroupId
      modelObject.value.itemId = props.params.itemId
    }
  } else if (
    props.isBulk &&
    props.params.employees &&
    props.params.employees.length > 0
  ) {
    const properBulkData = (
      await api.post('Employee/BulkLoadInfo', {
        employees: props.params.employees,
        itemCategoryId: props.params.itemCategoryId,
        itemGroupId: props.params.itemGroupId,
        itemId: props.params.itemId,
      })
    ).data
    if (properBulkData) modelObject.value = properBulkData
    else {
      modelObject.value = { ...modelDefaults.value }
      modelObject.value.itemCategoryId = props.params.itemCategoryId
      modelObject.value.itemGroupId = props.params.itemGroupId
      modelObject.value.itemId = props.params.itemId
    }
  } else {
    modelObject.value = {
      ...modelDefaults.value,
    }
    modelObject.value.itemCategoryId = props.params.itemCategoryId
    modelObject.value.itemGroupId = props.params.itemGroupId
    modelObject.value.itemId = props.params.itemId

    // if (props.params.itemCategoryId > 0) bindCategoryDefaults(props.params.itemCategoryId)
  }

  if (
    modelObject.value.specificRangeDates &&
    modelObject.value.specificRangeDates.length > 0
  ) {
    schedulerDates.value = JSON.parse(modelObject.value.specificRangeDates).map(
      (d: any) => moment(d).toDate()
    )
  }

  await updateGroupList(modelObject.value.itemCategoryId ?? 0)
  await updateItems()
  calculateRangeLimits()
  modelIsBinding.value = false
}

const updateGroupList = async (categoryId: any) => {
  if (categoryId && categoryId > 0) {
    try {
      const relatedGroups = await api.get('ItemCategory/' + categoryId + '/Groups')
      itemGroups.value = relatedGroups.data
    } catch (error) {}
  } else itemGroups.value = []
}

const bindCategoryDefaults = (categoryId: number | null) => {
  if (categoryId) {
    const catObj = itemCategories.value.find((d) => d.id === categoryId)
    if (catObj) {
      modelObject.value.creditByRange = catObj.creditByRange
      modelObject.value.rangeType = catObj.creditRangeType
      modelObject.value.rangeLength = catObj.creditRangeLength
    }
  }
}

const onChangeItemCategory = async (categoryId: any) => {
  // bindCategoryDefaults(categoryId)
  modelObject.value.itemGroupId = null
  await updateGroupList(categoryId)
}

const onChangeItemGroup = async (groupId: any) => {
  modelObject.value.itemGroupId = groupId
  modelObject.value.itemId = null
  await updateItems()
}

const updateItems = async () => {
  if (modelObject.value.itemGroupId) {
    items.value = (
      await api.get('ItemGroup/' + modelObject.value.itemGroupId + '/Items')
    ).data
  } else items.value = []
}

const saveCreditModel = async () => {
  try {
    if (props.isBulk) {
      modelObject.value.bulkList = props.params.employees
      modelObject.value.specificRangeDates = JSON.stringify(schedulerDates.value)
      modelObject.value.activeCredit = modelObject.value.creditByRange

      const postResult: any = (await api.post('Employee/BulkLoad', modelObject.value))
        .data
      if (postResult && postResult.result) {
        notif.success(postResult.infoMessage)
        emit('submit')
      } else throw postResult ? postResult.errorMessage : 'İşlem başarısız oldu'
    } else {
      modelObject.value.specificRangeDates = JSON.stringify(schedulerDates.value)
      modelObject.value.activeCredit = modelObject.value.creditByRange

      let postResult: any = null
      if (modelObject.value.id > 0)
        postResult = (await api.post('Employee/EditCredit', modelObject.value)).data
      else postResult = (await api.post('Employee/LoadCredit', modelObject.value)).data

      if (postResult && postResult.result) {
        notif.success('İşlem başarılı')
        modelObject.value.id = postResult.recordId
        await bindCreditModel()
        emit('submit')
      } else throw postResult ? postResult.errorMessage : 'İşlem başarısız oldu'
    }
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const calculateRangeLimits = () => {
  try {
    let schedulerEndDate: any = null
    if (modelObject.value.rangeType == 1)
      schedulerEndDate = moment(modelObject.value.creditLoadDate).add(
        modelObject.value.rangeLength ?? 1,
        'day'
      )
    else if (modelObject.value.rangeType == 2)
      schedulerEndDate = moment(modelObject.value.creditLoadDate).add(
        modelObject.value.rangeLength ?? 1,
        'week'
      )
    else if (modelObject.value.rangeType == 3)
      schedulerEndDate = moment(modelObject.value.creditLoadDate).add(
        modelObject.value.rangeLength ?? 1,
        'month'
      )
    else schedulerEndDate = modelObject.value.creditLoadDate

    rangeLimits.value.startDate = moment(modelObject.value.creditLoadDate).toDate()
    rangeLimits.value.endDate = moment(schedulerEndDate).toDate()
  } catch (error) {}
}

const calculateScheduler = () => {
  schedulerDates.value = []

  let schedulerEndDate: any = null
  if (modelObject.value.rangeType == 1)
    schedulerEndDate = moment(modelObject.value.creditLoadDate).add(
      modelObject.value.rangeLength ?? 1,
      'day'
    )
  else if (modelObject.value.rangeType == 2)
    schedulerEndDate = moment(modelObject.value.creditLoadDate).add(
      modelObject.value.rangeLength ?? 1,
      'week'
    )
  else if (modelObject.value.rangeType == 3)
    schedulerEndDate = moment(modelObject.value.creditLoadDate).add(
      modelObject.value.rangeLength ?? 1,
      'month'
    )
  else schedulerEndDate = modelObject.value.creditLoadDate

  if (schedulerEndDate) {
    let currentSelectionDate = moment(modelObject.value.creditLoadDate)
    while (currentSelectionDate < schedulerEndDate) {
      schedulerDates.value.push(currentSelectionDate.toDate())
      currentSelectionDate = currentSelectionDate.add(1, 'day')
    }
  }

  calculateRangeLimits()
}

const removeTime = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const onDayClick = (dayInfo: any) => {
  if (dayInfo && dayInfo.date) {
    if (
      schedulerDates.value.some(
        (d: Date) => removeTime(d).getTime() === removeTime(dayInfo.date).getTime()
      )
    ) {
      const foundDate = schedulerDates.value.find(
        (d: Date) => removeTime(d).getTime() === removeTime(dayInfo.date).getTime()
      )
      const foundIndex = schedulerDates.value.indexOf(foundDate)
      schedulerDates.value.splice(foundIndex, 1)
    } else {
      if (rangeLimits.value.startDate && rangeLimits.value.endDate) {
        if (
          removeTime(rangeLimits.value.startDate).getTime() >
            removeTime(dayInfo.date).getTime() ||
          removeTime(rangeLimits.value.endDate).getTime() <
            removeTime(dayInfo.date).getTime()
        ) {
          notif.error('Belirtilen aralığın dışında bir tarih seçemezsiniz')
          return
        }
      }
      schedulerDates.value.push(removeTime(dayInfo.date))
    }
  }
}

/* WATCHERS */
watch(
  () => props.params.employeeId,
  async () => {
    await bindCreditModel()
  },
  { deep: true }
)

watch(
  () => props.params.creditId,
  async () => {
    await bindCreditModel()
  },
  { deep: true }
)

watch(
  () => props.params.itemCategoryId,
  async () => {
    if (props.isBulk) await bindCreditModel()
  },
  { deep: true }
)

watch(
  () => props.params.itemGroupId,
  async () => {
    if (props.isBulk) await bindCreditModel()
  },
  { deep: true }
)

watch(
  () => props.params.itemId,
  async () => {
    if (props.isBulk) await bindCreditModel()
  },
  { deep: true }
)

watch(
  () => props.params.employees,
  async () => {
    if (props.isBulk) await bindCreditModel()
  },
  { deep: true }
)

watch(
  () => modelObject.value.creditLoadDate,
  () => {
    if (modelIsBinding.value == false) {
      calculateScheduler()
    }
  },
  {
    deep: true,
  }
)

watch(
  () => modelObject.value.rangeType,
  () => {
    if (modelIsBinding.value == false) calculateScheduler()
  },
  {
    deep: true,
  }
)

watch(
  () => modelObject.value.rangeLength,
  () => {
    if (modelIsBinding.value == false) calculateScheduler()
  },
  {
    deep: true,
  }
)

watch(
  () => props.triggerSave,
  async () => {
    if (props.triggerSave) await saveCreditModel()
  }
)
</script>

<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div v-if="props.showHeaders" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left">
            <h3>&nbsp;</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                color="primary"
                icon="feather:save"
                raised
                @click="saveCreditModel"
              >
                Kaydet
              </VButton>
            </div>
          </div>
        </div>
      </div>
      <div class="form-body" :class="{ 'p-0': props.showHeaders == false }">
        <div class="columns is-multiline">
          <div class="column is-12">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div v-if="props.showHeaders" class="fieldset-heading">
                <h4>Yükleme bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-4">
                  <VField>
                    <label>Stok Kategorisi</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.itemCategoryId"
                        :value-prop="'id'"
                        :label="'itemCategoryName'"
                        placeholder="Bir kategori seçiniz"
                        :searchable="true"
                        :options="itemCategories"
                        @change="onChangeItemCategory"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-4">
                  <VField>
                    <label>Stok Grubu</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.itemGroupId"
                        :value-prop="'id'"
                        :label="'itemGroupName'"
                        placeholder="Bir grup seçiniz"
                        :searchable="true"
                        :options="itemGroups"
                        @change="onChangeItemGroup"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-4">
                  <VField>
                    <label>Stok</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.itemId"
                        :value-prop="'id'"
                        :label="'itemName'"
                        placeholder="Bir stok seçiniz"
                        :searchable="true"
                        :options="items"
                      />
                    </VControl>
                  </VField>
                </div>

                <!-- <div class="column is-12">
                  <VField>
                    <label>Toplam Kredi</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.activeCredit"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div> -->
                <div class="column is-4">
                  <VField>
                    <label>Yükleme periyodu</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.rangeType"
                        :value-prop="'key'"
                        :label="'value'"
                        placeholder="Bir periyot seçiniz"
                        :searchable="true"
                        :options="creditTypes"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-4">
                  <VField>
                    <label>Periyot süresi</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.rangeLength"
                        type="number"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-4">
                  <VField>
                    <label>Periyodik Kredi</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.creditByRange"
                        type="number"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>İki ürün arası minimum süre</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.productIntervalType"
                        :value-prop="'id'"
                        :label="'name'"
                        placeholder="Süre türü"
                        :searchable="true"
                        :options="productIntervalTypes"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Süre değeri</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.productIntervalTime"
                        type="number"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <VDatePicker
                      v-model="modelObject.creditLoadDate"
                      :masks="{ input: 'DD.MM.YYYY' }"
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
                <div class="column is-12">
                  <VField>
                    <label>Çalışma takvimi</label>
                    <VControl>
                      <VCalendar
                        :from-date="moment(modelObject.creditLoadDate).toDate()"
                        :attributes="[
                          {
                            highlight: true,
                            dates: schedulerDates,
                          },
                        ]"
                        @dayclick="onDayClick"
                      />
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>