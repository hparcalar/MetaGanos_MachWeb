<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi, getApiBaseUrl } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useUserSession } from '/@src/stores/userSession'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const { hasAuth, isDealer, user, getExpression } = useUserSession()
const api = useApi()
const notif = useNotyf()

const spiralDialog = ref()
const spiralDialogX = ref(0)
const spiralDialogY = ref(0)

const modelObject = ref({
  id: 0,
  machineCode: '',
  machineName: '',
  specialCustomer: '',
  inventoryCode: '',
  plantId: null,
  barcode: '',
  productionDate: null,
  inventoryEntryDate: null,
  locationData: '',
  brand: '',
  brandModel: '',
  country: '',
  city: '',
  district: '',
  rows: 0,
  cols: 0,
  startVideoPath: '',
  spiralStartIndex: 10,
  startVideoData: null,
  isActive: true,
  createDate: null,
  spirals: [],
})
const spiralModel = ref({
  id: 0,
  itemCategoryId: null,
  posOrders: null,
  itemId: null,
  itemName: '',
  capacity: null,
  activeQuantity: 0,
  isEnabled: true,
  isInFault: false,
})
const liveVideoStream = ref(null)

const plants = ref([])
const itemCategories = ref([])
const items = ref([])
const machineTemplates = ref([])
const isSpiralDetailVisible = ref(false)
const isSpiralLoadVisible = ref(false)
const selectedSpiralNo = ref(-1)
const showOverallSaveInfo = ref(true)
const selectedTemplateId = ref(0)
const selectedTabPage: Ref<string> = ref('spirals')

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    if (modelObject.value.id == 0) modelObject.value.id = props.id

    const data = await api.get('Machine/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data

    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        machineCode: '',
        machineName: '',
        specialCustomer: '',
        inventoryCode: '',
        plantId: 0,
        barcode: '',
        productionDate: null,
        inventoryEntryDate: null,
        locationData: '',
        brand: '',
        brandModel: '',
        country: '',
        city: '',
        district: '',
        rows: 0,
        cols: 0,
        startVideoPath: '',
        spiralStartIndex: 10,
        startVideoData: null,
        isActive: true,
        createDate: null,
        spirals: [],
      }

    plants.value = (await api.get('Plant')).data

    try {
      if (!modelObject.value.plantId || modelObject.value.plantId == 0)
        modelObject.value.plantId = user.FactoryId
    } catch (error) {}

    await bindCategories()
    await bindMachineTemplates()

    if (modelObject.value.id > 0 && modelObject.value.startVideoPath != null) {
      bindVideo()
    }
  } catch (error) {}
}

const bindVideo = async () => {
  liveVideoStream.value = await api.get('Machine/' + modelObject.value.id + '/Video')
}

const bindCategories = async () => {
  try {
    itemCategories.value = (
      await api.get('Plant/' + modelObject.value.plantId + '/ItemCategories')
    ).data

    items.value = (await api.get('Item')).data
  } catch (error) {}
}

const bindMachineTemplates = async () => {
  try {
    machineTemplates.value = (await api.get('MachineTemplate')).data
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Machine', modelObject.value)
    if (postResult.data.result) {
      if (showOverallSaveInfo.value) notif.success(getExpression('SaveSuccess'))
      modelObject.value.id = postResult.data.recordId

      // upload video if any files are selected
      if (modelObject.value.startVideoData != null && postResult.data.recordId > 0) {
        let formData = new FormData()
        formData.append('videoData', modelObject.value.startVideoData)
        notif.properties().options.duration = 0
        notif.info('Video is uploading')

        const postVideoResult = await api.post(
          'Machine/' + postResult.data.recordId + '/UploadVideo',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        )

        if (postVideoResult.data.result) {
          notif.properties().dismissAll()
          notif.properties().options.duration = 2000
          notif.success('Video is uploaded successfuly.')
        } else notif.error('Video couldnt be loaded. Please try again later.')
      }
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const showSpiralDetail = (event: any, spiralNo: number) => {
  if (event.target) {
    const currentRow = parseInt(Math.floor(spiralNo / 10))

    if (currentRow > Math.ceil(modelObject.value.rows / 2)) {
      spiralDialogY.value = 40
    } else {
      spiralDialogY.value = -320
    }

    const currentCol = parseInt(spiralNo % 10)
    if (currentCol >= modelObject.value.cols / 2) {
      spiralDialogX.value = -420
    } else {
      spiralDialogX.value = 40
    }

    event.target.style.position = 'relative'
  }

  selectedSpiralNo.value = spiralNo
  isSpiralDetailVisible.value = true

  spiralModel.value = modelObject.value.spirals.find((d) => d.posOrders == spiralNo) || {
    id: 0,
    itemCategoryId: null,
    posOrders: null,
    itemId: null,
    itemName: '',
    capacity: null,
    activeQuantity: 0,
    isEnabled: true,
  }

  // event.target.appendChild(spiralDialog.value)
}

const isSpiralEnabled = (spiralNo: number) => {
  const currentSpiral = modelObject.value.spirals.find(
    (d: any) => d.posOrders == spiralNo
  )
  return currentSpiral != null ? currentSpiral.isEnabled : false
}

const isSpiralInFault = (spiralNo: number) => {
  const currentSpiral = modelObject.value.spirals.find(
    (d: any) => d.posOrders == spiralNo
  )
  return currentSpiral != null ? currentSpiral.isInFault : false
}

const getSpiralQuantityInfo = (spiralNo: number) => {
  const currentSpiral = modelObject.value.spirals.find(
    (d: any) => d.posOrders == spiralNo
  )

  if (currentSpiral) {
    return (
      (currentSpiral.activeQuantity ?? 0).toString() +
      ' / ' +
      (currentSpiral.capacity > 0 ? currentSpiral.capacity.toString() : '∞')
    )
  }

  return ''
}

const getSpiralItemInfo = (spiralNo: number) => {
  const currentSpiral = modelObject.value.spirals.find(
    (d: any) => d.posOrders == spiralNo
  )

  if (currentSpiral) {
    const currentItem = items.value.find((d) => d.id == currentSpiral.itemId)
    if (currentItem) return currentItem.itemName
  }

  return ''
}

const onSpiralSizeChanged = () => {
  if (modelObject.value.rows > 0 && modelObject.value.cols > 0) {
    const newSpiralList = []
    for (let r = 1; r <= modelObject.value.rows; r++) {
      for (let c = 1; c < modelObject.value.cols + 1; c++) {
        const spiralNo: number = getSpiralNo(r, c)
        //modelObject.value.spiralStartIndex - 1 + ((r - 1) * modelObject.value.cols + c)
        const existingSpiral = modelObject.value.spirals.find(
          (d) => d.posOrders == spiralNo
        )

        const newSpiral = {
          posOrders: spiralNo,
          isEnabled: true,
          isInFault: false,
        }
        if (existingSpiral) {
          newSpiral.itemCategoryId = existingSpiral.itemCategoryId
          newSpiral.itemName = existingSpiral.itemName
          newSpiral.itemId = existingSpiral.itemId
          newSpiral.activeQuantity = existingSpiral.activeQuantity
          newSpiral.capacity = existingSpiral.capacity
          newSpiral.isEnabled = existingSpiral.isEnabled
          newSpiral.isInFault = existingSpiral.isInFault
        }

        newSpiralList.push(newSpiral)
      }
    }

    modelObject.value.spirals = newSpiralList
  }
}

const onChangePlant = async (plantId: any) => {
  modelObject.value.plantId = plantId
  if (spiralModel.value) {
    spiralModel.value.itemCategoryId = null
    spiralModel.value.itemId = null
  }
  await bindCategories()
}

// #region SPIRAL LOADING FUNCTIONS
const showSpiralLoadDialog = () => {
  if (
    !spiralModel.value ||
    (!spiralModel.value.itemId && !spiralModel.value.itemCategoryId)
  ) {
    notif.warning('Yükleme yapabilmek için bir stok seçmelisiniz.')
    return
  }
  if (selectedSpiralNo.value > 0) {
    isSpiralLoadVisible.value = true
  }
}

const emptySpiral = async () => {
  if (!spiralModel.value || !spiralModel.value.itemCategoryId) {
    notif.warning('Boşaltmak için bir spiral seçmelisiniz.')
    return
  }

  if (confirm('Bu spiralin içerisini boşaltmak istediğinize emin misiniz?') == true) {
    try {
      const postResult = (
        await api.get(
          'Machine/' +
            modelObject.value.id +
            '/EmptySpiral/' +
            spiralModel.value.posOrders,
          {}
        )
      ).data
      if (postResult.result) {
        notif.success('Spiral boşaltıldı')
        await bindModel()
      } else notif.error(postResult.errorMessage)
    } catch (error: any) {
      notif.error(error?.message)
    }
  }
}

const onLoadSpiral = async (result: any) => {
  try {
    showOverallSaveInfo.value = false
    await saveModel()
    showOverallSaveInfo.value = true

    result.spiralNo = selectedSpiralNo.value
    result.itemCategoryId = spiralModel.value.itemCategoryId

    if (spiralModel.value.itemId != null && result.itemId != spiralModel.value.itemId) {
      notif.error('Bir spirale farklı stoklar yükleyemezsiniz.')
      return
    }

    const postResult = await api.post(
      'Machine/' + modelObject.value.id + '/LoadSpiral',
      result
    )
    if (postResult.data.result) {
      notif.success('Yükleme işlemi başarılı.')
      const newSpiralValue = (
        await api.get(
          'Machine/' + modelObject.value.id + '/Spirals/' + selectedSpiralNo.value
        )
      ).data
      spiralModel.value.activeQuantity = newSpiralValue.activeQuantity
      spiralModel.value.itemId = newSpiralValue.itemId
      spiralModel.value.itemName = newSpiralValue.itemName
      spiralModel.value.itemCategoryId = newSpiralValue.itemCategoryId

      await bindModel()
    } else notif.error('Hata: ' + postResult.data.errorMessage)
  } catch (error: any) {
    notif.error('Yükleme başarısız: ' + error)
  }

  isSpiralLoadVisible.value = false
  isSpiralDetailVisible.value = false
  selectedSpiralNo.value = -1
}
const onCloseLoadSpiral = () => {
  isSpiralLoadVisible.value = false
  isSpiralDetailVisible.value = false
  selectedSpiralNo.value = -1
}

const fullAllSpirals = async () => {
  if (confirm('Tüm spiralleri doldurmak istediğinizden emin misiniz?')) {
    try {
      const postResult = (
        await api.post('Machine/' + modelObject.value.id + '/FullAllSpirals', {})
      ).data
      if (postResult.result) {
        notif.success('Otomatın tüm spiralleri dolduruldu.')
        await bindModel()
      } else notif.error(postResult.errorMessage)
    } catch (error: any) {
      notif.error(error?.message)
    }
  }
}
// #endregion

// #region SPIRAL CONSUMING REPORT FUNCTIONS
const showSpiralConsumeDialog = () => {}
// #endregion

const onVideoSelected = async (event: any) => {
  if (event.target.files && event.target.files.length > 0) {
    const fileData: any = event.target.files[0]
    modelObject.value.startVideoData = fileData
  } else {
    modelObject.value.startVideoData = null
  }
}

const getSpiralNo = (r, c) => {
  if (modelObject.value.brandModel == 'Meta S350') {
    return r * 10 + c - 1
  } else {
    return r * 10 + c
  }
}

const reversedRows = computed(() =>
  [...Array(modelObject.value.rows + 1).keys()]
    .slice(1, modelObject.value.rows + 1)
    .reverse()
)

const onFormMouseDown = (event: any) => {
  if (isSpiralDetailVisible.value) {
    const dialogId = 'spiralDialogForm'
    let inSpiralDialog = false
    let pNode = event.target.parentNode
    while (pNode) {
      if (pNode.id == dialogId) {
        inSpiralDialog = true
        break
      }
      pNode = pNode.parentNode
    }

    if (!inSpiralDialog) {
      isSpiralDetailVisible.value = false
    }
  }
}

const applyTemplateForMachine = async () => {
  if (selectedTemplateId.value && selectedTemplateId.value > 0) {
    if (
      confirm(
        'Yeni bir şablon uygulamak istediğinizden emin misiniz? Uygulandığında spiral tanımları ve içerisindeki stoklar sıfırlanacaktır!'
      )
    ) {
      const macTemplate = machineTemplates.value.find(
        (d) => d.id == selectedTemplateId.value
      )
      if (macTemplate) {
        if (macTemplate.spiralConf && macTemplate.spiralConf.length > 0) {
          modelObject.value.rows = macTemplate.rows
          modelObject.value.cols = macTemplate.cols
          modelObject.value.brandModel = macTemplate.brandModel
          modelObject.value.spirals = JSON.parse(macTemplate.spiralConf)

          await saveModel()
        }
      }
    }
  } else {
    notif.error('Uygulamak için önce bir şablon seçmelisiniz.')
  }
}

watch(
  () => modelObject.value.rows,
  () => {
    onSpiralSizeChanged()
  },
  { deep: true }
)

watch(
  () => modelObject.value.cols,
  () => {
    onSpiralSizeChanged()
  },
  { deep: true }
)

watch(
  () => modelObject.value.spiralStartIndex,
  () => {
    onSpiralSizeChanged()
  },
  { deep: true }
)

const onTabPageChanged = (value: string) => {
  selectedTabPage.value = value
}

const { y } = useWindowScroll()

const printSpirals = () => {
  window.print()
}

const isStuck = computed(() => {
  return y.value > 30
})
</script>

<template>
  <form class="form-layout" @submit.prevent @mousedown="onFormMouseDown">
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header no-print">
        <div class="form-header-inner">
          <div class="left">
            <h3>{{ getExpression('MachineDefinitions') }}</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                v-if="hasAuth('LoadMachine', 'Write')"
                color="info"
                icon="feather:upload"
                raised
                @click="fullAllSpirals"
              >
                {{ getExpression('FillMachine') }}
              </VButton>
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'machine' }"
                light
                dark-outlined
              >
                {{ getExpression('List') }}
              </VButton>
              <VButton
                v-if="hasAuth('Machines', 'Write')"
                color="primary"
                icon="feather:save"
                raised
                @click="saveModel"
              >
                {{ getExpression('Save') }}
              </VButton>
            </div>
          </div>
        </div>
      </div>
      <div class="form-body">
        <div class="columns is-multiline no-print">
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>{{ getExpression('Machine') }}</h4>
                <p></p>
              </div>
              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('MachineCode') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.machineCode"
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
                    <label>{{ getExpression('MachineName') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.machineName"
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
                    <label>{{ getExpression('InventoryCode') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.inventoryCode"
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
                    <label>{{ getExpression('Barcode') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.barcode"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('SpecialCustomer') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.specialCustomer"
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
                    <VDatePicker
                      v-model="modelObject.productionDate"
                      :masks="{ input: 'DD.MM.YYYY' }"
                      trim-weeks
                    >
                      <template #default="{ inputValue, inputEvents }">
                        <VField>
                          <label>{{ getExpression('ProductionDate') }}</label>
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
                <div class="column is-6">
                  <VField>
                    <VDatePicker
                      v-model="modelObject.inventoryEntryDate"
                      :masks="{ input: 'DD.MM.YYYY' }"
                      trim-weeks
                    >
                      <template #default="{ inputValue, inputEvents }">
                        <VField>
                          <label>{{ getExpression('InventoryDate') }}</label>
                          <VControl icon="feather:calendar">
                            <input
                              class="input"
                              type="text"
                              placeholder=""
                              :value="inputValue"
                              v-on="inputEvents"
                            />
                          </VControl>
                        </VField>
                      </template>
                    </VDatePicker>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('Brand') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.brand"
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
                    <label>{{ getExpression('Model') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.brandModel"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>Video</label>
                    <VControl icon="feather:terminal">
                      <input
                        type="file"
                        class="input"
                        placeholder=""
                        autocomplete=""
                        accept="video/*"
                        @change="onVideoSelected"
                      />
                      <p v-if="liveVideoStream != null">
                        <video controls>
                          <source
                            :src="
                              getApiBaseUrl() + '/Machine/' + modelObject.id + '/Video'
                            "
                          />
                        </video>
                      </p>
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-6">
            <div class="columns is-multiline">
              <div class="column is-12">
                <!--Fieldset-->
                <div class="form-fieldset">
                  <div class="fieldset-heading">
                    <h4>{{ getExpression('LocationInformation') }}</h4>
                    <p></p>
                  </div>

                  <div class="columns is-multiline">
                    <div class="column is-6">
                      <VField>
                        <label>{{ getExpression('Region') }}</label>
                        <VControl icon="feather:terminal">
                          <input
                            v-model="modelObject.district"
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
                        <label>{{ getExpression('City') }}</label>
                        <VControl icon="feather:terminal">
                          <input
                            v-model="modelObject.city"
                            type="text"
                            class="input"
                            placeholder=""
                            autocomplete=""
                          />
                        </VControl>
                      </VField>
                    </div>
                    <div v-if="isDealer" class="column is-12">
                      <VField>
                        <label>{{ getExpression('Factory') }}</label>
                        <VControl>
                          <Multiselect
                            v-model="modelObject.plantId"
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
                  </div>
                </div>
              </div>

              <div
                class="column is-12"
                style="
                  display: flex;
                  align-items: stretch;
                  min-height: 200px;
                  margin-left: 15px;
                "
              >
                <Transition name="slide-up" mode="out-in">
                  <div class="form-fieldset hk-slide-content">
                    <div class="fieldset-heading">
                      <h4>{{ getExpression('SpiralInformation') }}</h4>
                      <p></p>
                    </div>

                    <div class="columns is-multiline">
                      <div class="column is-6">
                        <VField>
                          <label>Otomat Şablonu</label>
                          <VControl>
                            <Multiselect
                              v-model="selectedTemplateId"
                              :value-prop="'id'"
                              :label="'templateName'"
                              placeholder=""
                              :searchable="true"
                              :options="machineTemplates"
                            />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-6">
                        <VButton
                          v-if="hasAuth('Machines', 'Write')"
                          style="margin-top: 20px"
                          color="info"
                          icon="feather:check"
                          raised
                          @click="applyTemplateForMachine"
                        >
                          Şablon Uygula
                        </VButton>
                      </div>
                      <div class="column is-6">
                        <VField>
                          <label>{{ getExpression('Row') }}</label>
                          <VControl icon="feather:terminal">
                            <input
                              v-model="modelObject.rows"
                              type="number"
                              class="input"
                              placeholder=""
                              autocomplete=""
                              :readonly="!hasAuth('Machines', 'Write')"
                            />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-6">
                        <VField>
                          <label>{{ getExpression('Column') }}</label>
                          <VControl icon="feather:terminal">
                            <input
                              v-model="modelObject.cols"
                              type="number"
                              class="input"
                              placeholder=""
                              autocomplete=""
                              :readonly="!hasAuth('Machines', 'Write')"
                            />
                          </VControl>
                        </VField>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
        <VTabs
          :selected="selectedTabPage"
          :tabs="[
            { label: 'Otomat Görünümü', value: 'spirals' },
            { label: 'Liste Görünümü', value: 'listOfSpiral' },
          ]"
          @active-value-changed="onTabPageChanged"
        >
          <template #tab="{ activeValue }">
            <div v-if="activeValue === 'spirals'">
              <div v-if="modelObject.rows > 0 && modelObject.cols > 0">
                <div v-for="r in reversedRows" :key="r" class="columns is-multiline">
                  <div
                    v-for="c in modelObject.cols"
                    :key="c"
                    class="column"
                    :style="{
                      width: 100 / modelObject.cols + '%',
                      'text-align': 'center',
                    }"
                  >
                    <VButton
                      :color="
                        isSpiralEnabled(getSpiralNo(r, c))
                          ? isSpiralInFault(getSpiralNo(r, c))
                            ? 'warning'
                            : 'info'
                          : 'danger'
                      "
                      :rounded="true"
                      :outlined="
                        isSpiralEnabled(getSpiralNo(r, c)) &&
                        !isSpiralInFault(getSpiralNo(r, c))
                      "
                      :bold="true"
                      :fullwidth="true"
                      raised
                      @click="showSpiralDetail($event, getSpiralNo(r, c))"
                    >
                      {{ getSpiralNo(r, c) }}
                      <p class="spiral-quantity-info">
                        {{ getSpiralQuantityInfo(getSpiralNo(r, c)) }}
                      </p>
                      <div
                        v-if="
                          isSpiralDetailVisible && getSpiralNo(r, c) == selectedSpiralNo
                        "
                        id="spiralDialogForm"
                        ref="spiralDialog"
                        class="form-fieldset spiral-dialog-container"
                        :style="{ left: spiralDialogX + 'px', top: spiralDialogY + 'px' }"
                      >
                        <div class="fieldset-heading">
                          <h4 class="spiral-header">Spiral: {{ selectedSpiralNo }}</h4>
                          <h4
                            v-show="
                              spiralModel.activeQuantity && spiralModel.activeQuantity > 0
                            "
                            class="spiral-header mt-2 mb-2"
                            style="
                              background-color: var(--placeholder);
                              color: var(--dark);
                            "
                          >
                            {{ spiralModel.itemName }}:
                            {{ spiralModel.activeQuantity }} adet
                          </h4>
                          <p></p>
                        </div>

                        <div class="columns is-multiline">
                          <div class="column is-12">
                            <VField>
                              <label>Stok</label>
                              <VControl>
                                <Multiselect
                                  v-model="spiralModel.itemId"
                                  :value-prop="'id'"
                                  :label="'itemName'"
                                  placeholder=""
                                  :searchable="true"
                                  :options="items"
                                />
                              </VControl>
                            </VField>
                          </div>
                          <div class="column is-12">
                            <VField>
                              <label>{{ getExpression('Capacity') }}</label>
                              <VControl icon="feather:terminal">
                                <input
                                  v-model="spiralModel.capacity"
                                  type="number"
                                  class="input"
                                  placeholder=""
                                  autocomplete=""
                                />
                              </VControl>
                            </VField>
                          </div>
                          <div class="column is-12">
                            <div class="buttons">
                              <VButton
                                icon="lnir lnir-arrow-left rem-100"
                                light
                                dark-outlined
                                @click="isSpiralDetailVisible = false"
                              >
                                {{ getExpression('Back') }}
                              </VButton>
                              <VButton
                                v-show="hasAuth('LoadMachine', 'Write')"
                                color="primary"
                                icon="feather:upload"
                                raised
                                @click="showSpiralLoadDialog()"
                              >
                                {{ getExpression('LoadMachine') }}
                              </VButton>
                              <VButton
                                v-show="hasAuth('LoadMachine', 'Write')"
                                color="danger"
                                icon="feather:trash"
                                raised
                                @click="emptySpiral()"
                              >
                                {{ getExpression('Empty') }}
                              </VButton>
                              <!-- <VButton
                                  color="dark"
                                  icon="feather:list"
                                  raised
                                  @click="showSpiralConsumeDialog()"
                                >
                                  {{ getExpression('Consumptions') }}
                                </VButton> -->
                              <VSwitchBlock
                                v-show="hasAuth('Machines', 'Write')"
                                v-model="spiralModel.isEnabled"
                                class="ml-2"
                                :label="getExpression('Active')"
                                color="success"
                              />
                              <VSwitchBlock
                                v-show="hasAuth('Machines', 'Write')"
                                v-model="spiralModel.isInFault"
                                class="ml-2"
                                :label="getExpression('Faulty')"
                                color="warning"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </VButton>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="activeValue === 'listOfSpiral'">
              <div v-if="modelObject.rows > 0 && modelObject.cols > 0">
                <VButton
                  color="info"
                  icon="feather:printer"
                  raised
                  style="margin-bottom: 15px"
                  @click="printSpirals"
                >
                  Yazdır
                </VButton>
                <div
                  v-for="r in reversedRows"
                  :key="r"
                  class="columns is-multiline spiral-info-container"
                >
                  <div
                    v-for="c in modelObject.cols"
                    :key="c"
                    class="column"
                    :style="{
                      width: 100 / modelObject.cols + '%',
                      'text-align': 'center',
                      padding: '2px',
                    }"
                  >
                    <VButton
                      :color="
                        isSpiralEnabled(getSpiralNo(r, c))
                          ? isSpiralInFault(getSpiralNo(r, c))
                            ? 'warning'
                            : 'info'
                          : 'danger'
                      "
                      :outlined="
                        isSpiralEnabled(getSpiralNo(r, c)) &&
                        !isSpiralInFault(getSpiralNo(r, c))
                      "
                      :bold="true"
                      :fullwidth="true"
                      class="spiral-info-content"
                      raised
                    >
                      {{ getSpiralNo(r, c) }}
                      <div>{{ getSpiralItemInfo(getSpiralNo(r, c)) }}</div>
                    </VButton>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </VTabs>
      </div>
    </div>
  </form>

  <LoadMachineSpiral
    :item-category="{
      itemCategoryId: spiralModel.itemCategoryId,
      itemId: spiralModel.itemId,
      itemName: spiralModel.itemName,
      spiralNo: selectedSpiralNo,
      activeQuantity: spiralModel.activeQuantity,
    }"
    :visible="isSpiralLoadVisible"
    @load-spiral="onLoadSpiral"
    @close="onCloseLoadSpiral"
  />
</template>

<style lang="scss">
@import '../../../scss/abstracts/mixins';

.is-navbar {
  .form-layout {
    margin-top: 30px;
  }
}

.spiral-dialog-container {
  position: absolute;
  background-color: #efefef;
  width: 400px;
  z-index: 9 !important;
  border-radius: 5px;
  padding: 10px;
  -webkit-box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.75);
  box-shadow: 0px 0px 7px 0px rgba(0, 0, 0, 0.75);
}

.spiral-header {
  background-color: var(--blue);
  padding: 5px;
  border-radius: 5px;
  color: var(--smoke-white);
}

.spiral-quantity-info {
  color: var(--purple);
  font-weight: bold;
}

.hk-slide-content {
  padding-top: 0px !important;
}

.form-layout {
  //   max-width: 740px;
  margin: 0 auto;

  .form-outer {
    @include vuero-s-card;

    padding: 0;

    .form-header {
      padding: 12px 20px;
      border-bottom: 1px solid var(--fade-grey-dark-3);
      transition: all 0.3s; // transition-all test

      &.is-stuck {
        background: var(--white);
        padding-right: 80px;
        border-left: 1px solid var(--fade-grey-dark-3);
      }

      .form-header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .left {
        h3 {
          font-family: var(--font-alt);
          font-size: 1.2rem;
          font-weight: 600;
          line-height: 1.3;
        }

        p {
          font-size: 0.95rem;
        }
      }
    }

    .form-body {
      padding: 20px 40px 40px;
    }
  }
}

.is-dark {
  .form-layout {
    .form-outer {
      @include vuero-card--dark;

      .form-header {
        border-color: var(--dark-sidebar-light-12);

        &.is-stuck {
          background: var(--dark-sidebar);
          border-color: var(--dark-sidebar-light-6);
        }

        .left {
          h3 {
            color: var(--dark-dark-text);
          }
        }
      }

      .form-body {
        .field {
          .control {
            .input,
            .textarea {
              &:focus {
                border-color: var(--primary);
              }
            }
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .form-layout {
    .form-outer {
      .form-header {
        .form-header-inner {
          flex-direction: column;

          .left {
            text-align: center;
            margin-bottom: 12px;
          }

          .right {
            width: 100%;

            .buttons {
              display: flex;
              justify-content: space-between;
              margin: 0;

              .button {
                margin: 0;
                width: 49%;
              }
            }
          }
        }
      }
    }
  }
}

.spiral-info-content {
  margin: 2px !important;
  overflow-wrap: break-word;
  height: 80px !important;
}

.spiral-info-content div {
  color: #333 !important;
  overflow-wrap: break-word;
  word-wrap: break-all;
  white-space: normal;
  display: block;
  font-size: small;
  width: 100%;
  height: 50px;
}

.spiral-info-container {
  margin-bottom: 5px !important;
}

@media print {
  .no-print,
  .no-print * {
    display: none !important;
  }
}
</style>