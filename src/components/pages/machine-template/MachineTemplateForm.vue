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

const { hasAuth, isDealer, user, getExpression } = useUserSession()
const api = useApi()
const notif = useNotyf()

const spiralDialog = ref()
const spiralDialogX = ref(0)
const spiralDialogY = ref(0)

const modelObject = ref({
  id: 0,
  templateName: '',
  brandModel: '',
  rows: 0,
  cols: 0,
  spiralStartIndex: 10,
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

const isSpiralDetailVisible = ref(false)
const isSpiralLoadVisible = ref(false)
const selectedSpiralNo = ref(-1)

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    if (modelObject.value.id == 0) modelObject.value.id = props.id

    const data = await api.get('MachineTemplate/' + modelObject.value.id)
    if (data.status === 200) {
      //   modelObject.value.spirals = JSON.parse(data.data.spiralConf)
      modelObject.value = {
        ...data.data,
        spirals: JSON.parse(data.data.spiralConf),
      }
    }

    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        templateName: '',
        brandModel: '',
        rows: 0,
        cols: 0,
        spirals: [],
      }
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('MachineTemplate', {
      ...modelObject.value,
      spiralConf: JSON.stringify(modelObject.value.spirals),
    })
    if (postResult.data.result) {
      notif.success(getExpression('SaveSuccess'))
      modelObject.value.id = postResult.data.recordId

      bindModel()
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
      spiralDialogY.value = -175
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
      'Kapasite: ' +
      (currentSpiral.capacity > 0 ? currentSpiral.capacity.toString() : '∞')
    )
  } else {
    const newSpiral = {
      posOrders: spiralNo,
      isEnabled: true,
      isInFault: false,
      capacity: null,
    }

    modelObject.value.spirals.push(newSpiral)
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
        if (modelObject.value.spirals) {
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
    }

    modelObject.value.spirals = newSpiralList
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

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})
</script>

<template>
  <form class="form-layout" @submit.prevent @mousedown="onFormMouseDown">
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left">
            <h3>Otomat Şablonları</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'machine-template' }"
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
        <div class="columns is-multiline">
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
                    <label>Şablon Adı</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.templateName"
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
              </div>
            </div>
          </div>
          <div class="column is-6">
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>{{ getExpression('SpiralInformation') }}</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
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
          </div>
        </div>
        <div v-if="modelObject.rows > 0 && modelObject.cols > 0">
          <div v-for="r in reversedRows" :key="r" class="columns is-multiline">
            <div
              v-for="c in modelObject.cols"
              :key="c"
              class="column"
              :style="{ width: 100 / modelObject.cols + '%', 'text-align': 'center' }"
            >
              <VButton
                :color="'info'"
                :rounded="true"
                :outlined="true"
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
                  v-if="isSpiralDetailVisible && getSpiralNo(r, c) == selectedSpiralNo"
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
                      style="background-color: var(--placeholder); color: var(--dark)"
                    >
                      {{ spiralModel.itemName }}: {{ spiralModel.activeQuantity }} adet
                    </h4>
                    <p></p>
                  </div>

                  <div class="columns is-multiline">
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
                      </div>
                    </div>
                  </div>
                </div>
              </VButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
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
</style>