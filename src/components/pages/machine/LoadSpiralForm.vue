<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useHelpers } from '/@src/utils/helpers'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const router = useRouter()
const helpers = useHelpers()
const api = useApi()
const notif = useNotyf()
const userSession = useUserSession()
const { getExpression } = useUserSession()
const { isDealer } = userSession

const isSpiralLoadVisible = ref(false)
const machineSpiralsVisible = ref(false)
const isSpiralDetailVisible = ref(false)
const selectedSpiralNo = ref(0)
const machineList = ref([])
const itemCategories = ref([])

const machineObject = ref({ id: 0, machineName: '', spirals: [] })

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

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    const data = await api.get('Machine')
    if (data.status === 200) machineList.value = data.data
    else machineList.value = []
  } catch (error) {}
}

const bindItemCategories = async () => {
  try {
    itemCategories.value = (
      await api.get('Plant/' + machineObject.value.plantId + '/ItemCategories')
    ).data
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Machine', machineObject.value)
    if (postResult.data.result) {
      //   notif.success(getExpression('SaveSuccess'))
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})

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
            machineObject.value.id +
            '/EmptySpiral/' +
            spiralModel.value.posOrders,
          {}
        )
      ).data
      if (postResult.result) {
        notif.success('Spiral boşaltıldı')
        await selectMachine(machineObject.value)
      } else notif.error(postResult.errorMessage)
    } catch (error: any) {
      notif.error(error?.message)
    }
  }
}

const onLoadSpiral = async (result: any) => {
  try {
    await saveModel()

    result.spiralNo = selectedSpiralNo.value
    result.itemCategoryId = spiralModel.value.itemCategoryId

    if (spiralModel.value.itemId != null && result.itemId != spiralModel.value.itemId) {
      notif.error('Bir spirale farklı stoklar yükleyemezsiniz.')
      return
    }

    const postResult = await api.post(
      'Machine/' + machineObject.value.id + '/LoadSpiral',
      result
    )
    if (postResult.data.result) {
      notif.success('Yükleme işlemi başarılı.')
      const newSpiralValue = (
        await api.get(
          'Machine/' + machineObject.value.id + '/Spirals/' + selectedSpiralNo.value
        )
      ).data
      spiralModel.value.activeQuantity = newSpiralValue.activeQuantity
      spiralModel.value.itemId = newSpiralValue.itemId
      spiralModel.value.itemName = newSpiralValue.itemName
      spiralModel.value.itemCategoryId = newSpiralValue.itemCategoryId

      const spiralNo = selectedSpiralNo.value

      bindingSpiral.value = true
      await selectMachine(machineObject.value)
      spiralModel.value = machineObject.value?.spirals.find(
        (d) => d.posOrders == spiralNo
      )
      selectedSpiralNo.value = spiralNo
      isSpiralDetailVisible.value = true
    } else notif.error('Hata: ' + postResult.data.errorMessage)
  } catch (error: any) {
    notif.error('Yükleme başarısız: ' + error)
  }

  isSpiralLoadVisible.value = false
}
const onCloseLoadSpiral = () => {
  isSpiralLoadVisible.value = false
  //   isSpiralDetailVisible.value = false
  //   selectedSpiralNo.value = 0
}

const fullAllSpirals = async () => {
  if (confirm('Tüm spiralleri doldurmak istediğinizden emin misiniz?')) {
    try {
      const postResult = (
        await api.post('Machine/' + machineObject.value.id + '/FullAllSpirals', {})
      ).data
      if (postResult.result) {
        notif.success('Otomatın tüm spiralleri dolduruldu.')
        await selectMachine(machineObject.value)
      } else notif.error(postResult.errorMessage)
    } catch (error: any) {
      notif.error(error?.message)
    }
  }
}

const bindingSpiral = ref(false)
const onChangeSpiral = async (spiralNo: any) => {
  selectedSpiralNo.value = spiralNo ?? 0
  spiralModel.value = machineObject.value?.spirals.find(
    (d) => d.posOrders == (spiralNo ?? 0)
  )
  if (spiralModel.value) {
    isSpiralDetailVisible.value = true
  } else isSpiralDetailVisible.value = false
}

const selectMachine = async (machine: any) => {
  try {
    selectedSpiralNo.value = 0
    const macData = (await api.get('Machine/' + machine.id)).data
    machineObject.value = {
      ...macData,
      spirals: macData.spirals.sort((a, b) => a.posOrders - b.posOrders),
    }
    machineSpiralsVisible.value = true

    await bindItemCategories()
  } catch (error) {}
}

const backToMachineList = () => {
  machineObject.value = { id: 0, machineName: '', spirals: [] }
  isSpiralDetailVisible.value = false
  machineSpiralsVisible.value = false
}
// #endregion
</script>
    
<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left">
            <h3>
              {{
                machineObject.id > 0
                  ? machineObject.machineName
                  : getExpression('LoadMachine')
              }}
            </h3>
          </div>
          <div class="right">
            <div class="buttons"></div>
          </div>
        </div>
      </div>
      <div class="form-body">
        <div class="columns is-multiline">
          <div class="column is-12">
            <div v-if="machineSpiralsVisible == false">
              <div class="columns is-multiline">
                <div v-for="item in machineList" :key="item" class="column is-6">
                  <VButton
                    style="width: 100%"
                    color="primary"
                    icon="feather:check"
                    raised
                    @click="selectMachine(item)"
                  >
                    {{ item.machineName }}
                  </VButton>
                </div>
              </div>
            </div>
            <div v-else>
              <div class="columns">
                <div class="column is-6">
                  <VButton
                    style="width: 100%; margin-top: 18px"
                    color="primary"
                    icon="lnir lnir-arrow-left rem-100"
                    raised
                    @click="backToMachineList"
                  >
                    Makine Seçimine Dön
                  </VButton>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('Spiral') }}</label>
                    <VControl>
                      <Multiselect
                        v-model="selectedSpiralNo"
                        :value-prop="'posOrders'"
                        :label="'posOrders'"
                        placeholder=""
                        :searchable="true"
                        :options="machineObject.spirals"
                        @change="onChangeSpiral"
                      />
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
            <div v-if="isSpiralDetailVisible" class="form-fieldset">
              <div class="fieldset-heading">
                <h4
                  v-if="spiralModel.activeQuantity && spiralModel.activeQuantity > 0"
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
                    <label>{{ getExpression('Category') }}</label>
                    <VControl>
                      <Multiselect
                        v-model="spiralModel.itemCategoryId"
                        :value-prop="'id'"
                        :label="'itemCategoryName'"
                        placeholder=""
                        :searchable="true"
                        :options="itemCategories"
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
                    <!-- <VButton
                      icon="lnir lnir-arrow-left rem-100"
                      light
                      dark-outlined
                      @click="isSpiralDetailVisible = false"
                    >
                      {{ getExpression('Back') }}
                    </VButton> -->
                    <VButton
                      v-if="userSession.hasAuth('LoadMachine', 'Write')"
                      color="primary"
                      icon="feather:upload"
                      raised
                      @click="showSpiralLoadDialog()"
                    >
                      {{ getExpression('LoadMachine') }}
                    </VButton>
                    <VButton
                      v-if="userSession.hasAuth('LoadMachine', 'Write')"
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
                    <!-- <VSwitchBlock
                      v-if="userSession.hasAuth('Machines', 'Write')"
                      v-model="spiralModel.isEnabled"
                      class="ml-2"
                      :label="getExpression('Active')"
                      color="success"
                    /> -->
                    <!-- <VSwitchBlock
                      v-if="userSession.hasAuth('Machines', 'Write')"
                      v-model="spiralModel.isInFault"
                      class="ml-2"
                      :label="getExpression('Faulty')"
                      color="warning"
                    /> -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoadMachineSpiral
      :item-category="{
        itemCategoryId: spiralModel?.itemCategoryId,
        itemId: spiralModel?.itemId,
        itemName: spiralModel?.itemName,
        spiralNo: selectedSpiralNo,
        activeQuantity: spiralModel?.activeQuantity,
      }"
      :visible="isSpiralLoadVisible"
      @load-spiral="onLoadSpiral"
      @close="onCloseLoadSpiral"
    />
  </form>
</template>
    
    <style lang="scss">
@import '../../../scss/abstracts/mixins';

.is-navbar {
  .form-layout {
    margin-top: 30px;
  }
}

.form-layout {
  // max-width: 740px;
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