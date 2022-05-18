<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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

const { hasAuth, isDealer } = useUserSession()
const api = useApi()
const notif = useNotyf()

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
const isSpiralDetailVisible = ref(false)
const isSpiralLoadVisible = ref(false)
const selectedSpiralNo = ref(-1)
const showOverallSaveInfo = ref(true)

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
      }

    plants.value = (await api.get('Plant')).data

    await bindCategories()

    if (modelObject.value.id > 0 && modelObject.value.startVideoPath != null) {
      liveVideoStream.value = await api.get('Machine/' + props.id + '/Video')
    }
  } catch (error) {}
}

const bindCategories = async () => {
  try {
    itemCategories.value = (
      await api.get('Plant/' + modelObject.value.plantId + '/ItemCategories')
    ).data
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Machine', modelObject.value)
    if (postResult.data.result) {
      if (showOverallSaveInfo.value) notif.success('Kayıt başarılı.')

      // upload video if any files are selected
      if (modelObject.value.startVideoData != null && postResult.data.recordId > 0) {
        let formData = new FormData()
        formData.append('videoData', modelObject.value.startVideoData)

        notif.info('Video yükleniyor...')

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
          notif.success('Video başarıyla yüklendi.')
        } else
          notif.error('Video yükleme işlemi başarısız oldu, lütfen tekrar deneyiniz.')
      }
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const showSpiralDetail = (spiralNo: number) => {
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

const onSpiralSizeChanged = () => {
  if (modelObject.value.rows > 0 && modelObject.value.cols > 0) {
    const newSpiralList = []
    for (let r = 1; r <= modelObject.value.rows; r++) {
      for (let c = 1; c < modelObject.value.cols + 1; c++) {
        const spiralNo: number =
          modelObject.value.spiralStartIndex - 1 + ((r - 1) * modelObject.value.cols + c)
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
  if (!spiralModel.value || !spiralModel.value.itemCategoryId) {
    notif.warning('Yükleme yapabilmek için bir stok kategorisi seçmelisiniz.')
    return
  }
  if (selectedSpiralNo.value > 0) {
    isSpiralLoadVisible.value = true
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

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})
</script>

<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left">
            <h3>Makine Tanımı</h3>
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
                Otomatı Tam Doldur
              </VButton>
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'machine' }"
                light
                dark-outlined
              >
                Liste
              </VButton>
              <VButton
                v-if="hasAuth('Machines', 'Write')"
                color="primary"
                icon="feather:save"
                raised
                @click="saveModel"
              >
                Kaydet
              </VButton>
            </div>
          </div>
        </div>
      </div>
      <div class="form-body">
        <div class="columns is-multiline">
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Makine bilgileri</h4>
                <p></p>
              </div>
              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Makine Kodu</label>
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
                    <label>Makine Adı</label>
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
                    <label>Envanter Kodu</label>
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
                    <label>Barkod</label>
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
                    <label>Özel Müşteri</label>
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
                          <label>Üretim Tarihi</label>
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
                          <label>Envantere Giriş Tarihi</label>
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
                    <label>Marka</label>
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
                    <label>Model</label>
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
                    <label>Açılış Videosu</label>
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
                    <h4>Lokasyon bilgileri</h4>
                    <p></p>
                  </div>

                  <div class="columns is-multiline">
                    <div class="column is-6">
                      <VField>
                        <label>Bölge</label>
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
                        <label>Şehir</label>
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
                        <label>Fabrika</label>
                        <VControl>
                          <Multiselect
                            v-model="modelObject.plantId"
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
                  <div
                    v-if="!isSpiralDetailVisible"
                    class="form-fieldset hk-slide-content"
                  >
                    <div class="fieldset-heading">
                      <h4>Spiral bilgileri</h4>
                      <p></p>
                    </div>

                    <div class="columns is-multiline">
                      <div class="column is-6">
                        <VField>
                          <label>Satır</label>
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
                          <label>Sütun</label>
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

                  <div
                    v-else-if="isSpiralDetailVisible"
                    class="form-fieldset hk-slide-content"
                  >
                    <div class="fieldset-heading">
                      <h4 class="spiral-header">Spiral: {{ selectedSpiralNo }}</h4>
                      <h4
                        v-if="
                          spiralModel.activeQuantity && spiralModel.activeQuantity > 0
                        "
                        class="spiral-header mt-2 mb-2"
                        style="background-color: var(--placeholder); color: var(--dark)"
                      >
                        {{ spiralModel.itemName }}: {{ spiralModel.activeQuantity }} adet
                      </h4>
                      <p></p>
                    </div>

                    <div class="columns is-multiline">
                      <div class="column is-12">
                        <VField>
                          <label>Stok Kategorisi</label>
                          <VControl>
                            <Multiselect
                              v-model="spiralModel.itemCategoryId"
                              :value-prop="'id'"
                              :label="'itemCategoryName'"
                              placeholder="Bir kategori seçiniz"
                              :searchable="true"
                              :options="itemCategories"
                            />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-12">
                        <VField>
                          <label>Kapasite</label>
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
                            Geri
                          </VButton>
                          <VButton
                            v-if="hasAuth('LoadMachine', 'Write')"
                            color="primary"
                            icon="feather:upload"
                            raised
                            @click="showSpiralLoadDialog()"
                          >
                            Yükleme Yap
                          </VButton>
                          <!-- <VButton
                            color="dark"
                            icon="feather:list"
                            raised
                            @click="showSpiralConsumeDialog()"
                          >
                            Tüketimler
                          </VButton> -->
                          <VSwitchBlock
                            v-if="hasAuth('Machines', 'Write')"
                            v-model="spiralModel.isEnabled"
                            class="ml-2"
                            label="Aktif"
                            color="success"
                          />
                          <VSwitchBlock
                            v-if="hasAuth('Machines', 'Write')"
                            v-model="spiralModel.isInFault"
                            class="ml-2"
                            label="Arızalı"
                            color="warning"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </div>
        <div v-if="modelObject.rows > 0 && modelObject.cols > 0">
          <div v-for="r in modelObject.rows" :key="r" class="columns is-multiline">
            <div
              v-for="c in modelObject.cols"
              :key="c"
              class="column"
              :style="{ width: 100 / modelObject.cols + '%', 'text-align': 'center' }"
            >
              <VButton
                :color="
                  isSpiralEnabled(
                    modelObject.spiralStartIndex - 1 + ((r - 1) * modelObject.cols + c)
                  )
                    ? isSpiralInFault(
                        modelObject.spiralStartIndex -
                          1 +
                          ((r - 1) * modelObject.cols + c)
                      )
                      ? 'warning'
                      : 'info'
                    : 'danger'
                "
                :rounded="true"
                :outlined="
                  isSpiralEnabled(
                    modelObject.spiralStartIndex - 1 + ((r - 1) * modelObject.cols + c)
                  ) &&
                  !isSpiralInFault(
                    modelObject.spiralStartIndex - 1 + ((r - 1) * modelObject.cols + c)
                  )
                "
                :bold="true"
                :fullwidth="true"
                raised
                @click="
                  showSpiralDetail(
                    modelObject.spiralStartIndex - 1 + ((r - 1) * modelObject.cols + c)
                  )
                "
              >
                {{ modelObject.spiralStartIndex - 1 + ((r - 1) * modelObject.cols + c) }}
                <p class="spiral-quantity-info">
                  {{
                    getSpiralQuantityInfo(
                      modelObject.spiralStartIndex - 1 + ((r - 1) * modelObject.cols + c)
                    )
                  }}
                </p>
              </VButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>

  <LoadMachineSpiral
    :item-category="{
      itemCategoryId: spiralModel.itemCategoryId,
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
</style>