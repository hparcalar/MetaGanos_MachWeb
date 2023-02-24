<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useHelpers } from '/@src/utils/helpers'
import { useUserSession } from '/@src/stores/userSession'
import moment from 'moment'
import { dateToStr, timeToStr, removeTime } from '/@src/composable/useHelpers'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const helpers = useHelpers()
const api = useApi()
const notif = useNotyf()
const userSession = useUserSession()
const { getExpression } = useUserSession()
const { isDealer } = userSession

const modelObject = ref({
  id: 0,
  receiptNo: '',
  documentNo: '',
  loadType: 1,
  loadOfficerId: null,
  explanation: '',
  warehouseId: null,
  firmId: null,
  plantId: 0,
  details: [],
})

const plants: Ref<any[]> = ref([])

const items = ref([])
const firms = ref([])
const warehouses = ref([])
const loadTypes = ref([
  { id: 1, text: 'Depo Giriş Fişi' },
  { id: 2, text: 'Depo Çıkış Fişi' },
])

onMounted(async () => {
  await bindModel()
})

const onChangePlant = async (plantId: any) => {
  modelObject.value.plantId = plantId
  await updateSelectables()
}

const bindModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data

    if (modelObject.value.id == 0 && props.id > 0) modelObject.value.id = props.id

    const data = await api.get('WarehouseLoad/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data

    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        receiptNo: '',
        documentNo: '',
        loadType: 1,
        loadOfficerId: null,
        explanation: '',
        warehouseId: null,
        firmId: null,
        plantId: 0,
        details: [],
      }

    if (modelObject.value.id <= 0) {
      modelObject.value.loadType = 1
      modelObject.value.loadDate = removeTime(moment().toDate())
    }

    if (
      !(modelObject.value.plantId || modelObject.value.plantId == 0) &&
      plants.value.length == 1
    )
      modelObject.value.plantId = plants.value[0].id
    else if (!modelObject.value.plantId || modelObject.value.plantId == 0)
      modelObject.value.plantId = userSession.user.FactoryId

    await updateSelectables()
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('WarehouseLoad', modelObject.value)
    if (postResult.data.result) {
      notif.success(getExpression('SaveSuccess'))
      modelObject.value.id = postResult.data.recordId
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const updateSelectables = async () => {
  try {
    if (isDealer == true) {
      items.value = (await api.get('Item')).data.filter(
        (d: any) => d.plantId == modelObject.value.plantId
      )
      firms.value = (await api.get('Firm')).data.filter(
        (d: any) => d.plantId == modelObject.value.plantId
      )
      warehouses.value = (await api.get('Warehouse')).data.filter(
        (d: any) => d.plantId == modelObject.value.plantId
      )
    } else {
      items.value = (await api.get('Item')).data
      firms.value = (await api.get('Firm')).data
      warehouses.value = (await api.get('Warehouse')).data
    }
  } catch (error) {}
}

const addDetail = () => {
  modelObject.value.details.push({
    id: 0,
    itemId: null,
    quantity: null,
  })
}

const removeDetail = (item: any) => {
  try {
    const rowIndex = modelObject.value.details.indexOf(item)
    if (rowIndex > -1) {
      modelObject.value.details.splice(rowIndex, 1)
    }
  } catch (error) {}
}

const columns = {
  lineNumber: 'Sıra',
  itemId: { label: 'Stok', scrollY: false },
  quantity: 'Miktar',
  actions: {
    label: '#',
    align: 'center',
  },
} as const

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
            <h3>Depo Hareket Fişi</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'wrmove' }"
                light
                dark-outlined
              >
                {{ getExpression('List') }}
              </VButton>
              <VButton color="primary" icon="feather:save" raised @click="saveModel">
                {{ getExpression('Save') }}
              </VButton>
            </div>
          </div>
        </div>
      </div>
      <div class="form-body">
        <!-- HEADER REGION -->
        <div class="columns is-multiline">
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Hareket Türü</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.loadType"
                        :disabled="modelObject.id > 0"
                        :value-prop="'id'"
                        :label="'text'"
                        placeholder=""
                        :searchable="true"
                        :options="loadTypes"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Fiş No</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.receiptNo"
                        readonly
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
                    <label>Depo</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.warehouseId"
                        :value-prop="'id'"
                        :label="'warehouseName'"
                        placeholder=""
                        :searchable="true"
                        :options="warehouses"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Belge No</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.documentNo"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div :class="{ 'is-4': isDealer, 'is-6': !isDealer }" class="column">
                  <VField>
                    <VDatePicker
                      v-model="modelObject.loadDate"
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
                <div :class="{ 'is-4': isDealer, 'is-6': !isDealer }" class="column">
                  <VField>
                    <label>Firma</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.firmId"
                        :value-prop="'id'"
                        :label="'firmName'"
                        placeholder=""
                        :searchable="true"
                        :options="firms"
                      />
                    </VControl>
                  </VField>
                </div>
                <div v-if="isDealer" class="column is-4">
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
          <div class="column is-6">
            <div class="form-fieldset">
              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>Açıklama</label>
                    <VControl icon="feather:terminal">
                      <textarea
                        v-model="modelObject.explanation"
                        class="input"
                        placeholder=""
                        autocomplete=""
                        style="height: 110px"
                      ></textarea>
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DETAIL REGION -->
        <div class="columns is-multiline">
          <div class="column is-12">
            <div>
              <VButton
                class="ml-2"
                color="info"
                icon="feather:plus"
                raised
                @click="addDetail"
              >
                Yeni Satır
              </VButton>
            </div>
            <div class="flex-list-wrapper flex-list-v3 mt-4">
              <div class="tab-content is-active">
                <VFlexTable
                  :data="modelObject.details"
                  :columns="columns"
                  clickable
                  compact
                  separators
                >
                  <template #body>
                    <TransitionGroup
                      name="list"
                      tag="div"
                      class="flex-list-inner"
                      style="overflow-y: visible"
                    >
                      <!--Table item-->
                      <div
                        v-for="(item, itemIndex) in modelObject.details"
                        :key="item"
                        class="flex-table-item"
                      >
                        <VFlexTableCell>
                          <span class=""
                            ><b>{{ itemIndex + 1 }}</b></span
                          >
                        </VFlexTableCell>
                        <VFlexTableCell>
                          <VControl>
                            <Multiselect
                              v-model="item.itemId"
                              style="flex: 1 !important"
                              :value-prop="'id'"
                              :label="'itemName'"
                              placeholder=""
                              :searchable="true"
                              :options="items"
                            />
                          </VControl>
                        </VFlexTableCell>
                        <VFlexTableCell>
                          <VControl icon="feather:terminal">
                            <input
                              v-model="item.quantity"
                              type="number"
                              class="input"
                              placeholder=""
                              autocomplete=""
                            />
                          </VControl>
                        </VFlexTableCell>
                        <VFlexTableCell :columns="{ align: 'end' }">
                          <button
                            class="button v-button has-dot dark-outlined is-danger mx-1 is-pushed-mobile py-0 px-2"
                            @click="removeDetail(item)"
                          >
                            <i aria-hidden="true" class="fas fa-trash dot"></i>
                          </button>
                        </VFlexTableCell>
                      </div>
                    </TransitionGroup>
                  </template>
                </VFlexTable>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>
    
    <style lang="scss">
@import '../../../scss/abstracts/mixins';

.selected-row,
.selected-row .flex-table-cell {
  background-color: #cccccc !important;
}

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

.flex-table-cell .control {
  flex: 1;
}

.vc-popover-content-wrapper {
  z-index: 9999999 !important;
}
</style>