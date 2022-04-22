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
}

const props = defineProps({
  params: {
    type: Object as PropType<LoadCreditParams>,
    required: true,
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

const modelObject: Ref<any> = ref({
  id: 0,
  employeeId: 0,
  itemCategoryId: null,
  itemGroupId: null,
  activeCredit: 0,
  rangeCredit: 0,
  rangeIndex: 0,
  rangeLength: 1,
  rangeType: 4,
  creditByRange: 0,
  creditLoadDate: moment().toDate(),
  creditStartDate: null,
  creditEndDate: null,
})

const itemCategories: Ref<any[]> = ref([])
const itemGroups: Ref<any[]> = ref([])
const creditTypes: Ref<CreditRangeType[]> = ref(creditRangeOption)

const bindCreditModel = async () => {
  itemCategories.value = (await api.get('ItemCategory')).data

  if (props.params.creditId > 0) {
    const existingData = (
      await api.get(
        'Employee/' + props.params.employeeId + '/Credits/' + props.params.creditId
      )
    ).data
    if (existingData) {
      modelObject.value = existingData
    }
  } else {
    modelObject.value = {
      id: 0,
      employeeId: props.params.employeeId,
      itemCategoryId: props.params.itemCategoryId,
      itemGroupId: null,
      activeCredit: 0,
      rangeCredit: 0,
      rangeIndex: 0,
      rangeLength: 1,
      rangeType: 4,
      creditByRange: 0,
      creditLoadDate: moment().toDate(),
      creditStartDate: null,
      creditEndDate: null,
    }

    if (props.params.itemCategoryId > 0) bindCategoryDefaults(props.params.itemCategoryId)
  }

  await updateGroupList(modelObject.value.itemCategoryId ?? 0)
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
  bindCategoryDefaults(categoryId)
  modelObject.value.itemGroupId = null
  await updateGroupList(categoryId)
}

const saveCreditModel = async () => {
  try {
    let postResult: any = null
    if (modelObject.value.id > 0)
      postResult = (await api.post('Employee/EditCredit', modelObject.value)).data
    else postResult = (await api.post('Employee/LoadCredit', modelObject.value)).data

    if (postResult && postResult.result) {
      notif.success('İşlem başarılı')
      await bindCreditModel(postResult.recordId)
      emit('submit')
    } else throw postResult ? postResult.errorMessage : 'İşlem başarısız oldu'
  } catch (error) {
    notif.error(error.message)
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
</script>

<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div class="form-header stuck-header">
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
      <div class="form-body">
        <div class="columns is-multiline">
          <div class="column is-12">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Yükleme bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
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
                <div class="column is-6">
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
                <div class="column is-12">
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
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
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
                </div>
                <div class="column is-6">
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
                <div class="column is-6">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>