<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useHelpers } from '/@src/utils/helpers'
import { useUserSession } from '/@src/stores/userSession'

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
  warehouseCode: '',
  warehouseName: '',
  isActive: true,
  plantId: 0,
  hotSalesCategories: [],
})

const hotSalesModel = ref({
  id: 0,
  itemCategoryId: null,
  itemGroupId: null,
  itemId: null,
  itemText: '',
})

const plants: Ref<any[]> = ref([])

const itemCategories = ref([])
const itemGroups = ref([])
const items = ref([])

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data

    if (modelObject.value.id == 0 && props.id > 0) modelObject.value.id = props.id

    const data = await api.get('Warehouse/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data

    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        warehouseCode: '',
        warehouseName: '',
        isActive: true,
        plantId: 0,
        hotSalesCategories: [],
      }

    if (
      !(modelObject.value.plantId || modelObject.value.plantId == 0) &&
      plants.value.length == 1
    )
      modelObject.value.plantId = plants.value[0].id
    else if (!modelObject.value.plantId || modelObject.value.plantId == 0)
      modelObject.value.plantId = userSession.user.FactoryId

    await updateCategoryList()
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Warehouse', modelObject.value)
    if (postResult.data.result) {
      notif.success(getExpression('SaveSuccess'))
      modelObject.value.id = postResult.data.recordId
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const updateCategoryList = async () => {
  itemCategories.value = (
    await api.get('Plant/' + modelObject.value.plantId + '/ItemCategories')
  ).data
}

const updateGroupList = async (categoryId: any) => {
  if (categoryId && categoryId > 0) {
    try {
      const relatedGroups = await api.get('ItemCategory/' + categoryId + '/Groups')
      itemGroups.value = relatedGroups.data
    } catch (error) {}
  } else itemGroups.value = []
}

const updateItems = async () => {
  if (hotSalesModel.value.itemGroupId) {
    items.value = (
      await api.get('ItemGroup/' + hotSalesModel.value.itemGroupId + '/Items')
    ).data
  } else items.value = []
}

const onChangeItemCategory = async (categoryId: any) => {
  hotSalesModel.value.itemGroupId = null
  await updateGroupList(categoryId)
}

const onChangeItemGroup = async (groupId: any) => {
  hotSalesModel.value.itemGroupId = groupId
  hotSalesModel.value.itemId = null
  await updateItems()
}

const deleteHotCategory = (item: any) => {
  try {
    const itemIndex = modelObject.value.hotSalesCategories.indexOf(item)
    if (itemIndex > -1) {
      modelObject.value.hotSalesCategories.splice(itemIndex, 1)

      newHotCategory()
    }
  } catch (error) {}
}

const saveHotCategory = () => {
  try {
    if (hotSalesModel.value.itemId && hotSalesModel.value.itemId > 0) {
      const fItem = items.value.find((d) => d.id == hotSalesModel.value.itemId)
      hotSalesModel.value.itemText = fItem?.itemName
    } else if (hotSalesModel.value.itemGroupId && hotSalesModel.value.itemGroupId > 0) {
      const fItem = itemGroups.value.find((d) => d.id == hotSalesModel.value.itemGroupId)
      hotSalesModel.value.itemText = fItem?.itemGroupName
    } else if (
      hotSalesModel.value.itemCategoryId &&
      hotSalesModel.value.itemCategoryId > 0
    ) {
      const fItem = itemCategories.value.find(
        (d) => d.id == hotSalesModel.value.itemCategoryId
      )
      hotSalesModel.value.itemText = fItem?.itemCategoryName
    }
  } catch (error) {}

  if (modelObject.value.hotSalesCategories.indexOf(hotSalesModel.value) <= -1) {
    if (
      modelObject.value.hotSalesCategories.some(
        (d) =>
          d.itemCategoryId == hotSalesModel.value.itemCategoryId &&
          d.itemGroupId == hotSalesModel.value.itemGroupId &&
          d.itemId == hotSalesModel.value.itemId
      )
    ) {
      notif.error('Bu seçimlerin aynısı zaten mevcut.')
    } else modelObject.value.hotSalesCategories.push(hotSalesModel.value)
  }

  newHotCategory()
}

const newHotCategory = () => {
  hotSalesModel.value = {
    id: 0,
    itemCategoryId: null,
    itemGroupId: null,
    itemId: null,
    itemText: '',
  }
}

const columns = {
  itemText: 'Ürün Başlığı',
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
            <h3>{{ getExpression('WarehouseDefinitions') }}</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'warehouse' }"
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
        <div class="columns is-multiline">
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>{{ getExpression('WarehouseInformation') }}</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('WarehouseCode') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.warehouseCode"
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
                    <label>{{ getExpression('WarehouseName') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.warehouseName"
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
                      />
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
          </div>
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Teslim Edilebilir Ürünler</h4>
                <p></p>
              </div>
              <div class="columns is-multiline">
                <div class="column is-12">
                  <div class="form-fieldset">
                    <div class="columns is-multiline">
                      <div class="column is-6">
                        <VField>
                          <label>{{ getExpression('Category') }}</label>
                          <VControl>
                            <Multiselect
                              v-model="hotSalesModel.itemCategoryId"
                              :value-prop="'id'"
                              :label="'itemCategoryName'"
                              placeholder=""
                              :searchable="true"
                              :options="itemCategories"
                              @change="onChangeItemCategory"
                            />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-6">
                        <VField>
                          <label>{{ getExpression('Group') }}</label>
                          <VControl>
                            <Multiselect
                              v-model="hotSalesModel.itemGroupId"
                              :value-prop="'id'"
                              :label="'itemGroupName'"
                              placeholder=""
                              :searchable="true"
                              :options="itemGroups"
                              @change="onChangeItemGroup"
                            />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-6">
                        <VField>
                          <label>{{ getExpression('Item') }}</label>
                          <VControl>
                            <Multiselect
                              v-model="hotSalesModel.itemId"
                              :value-prop="'id'"
                              :label="'itemName'"
                              placeholder=""
                              :searchable="true"
                              :options="items"
                            />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-6">
                        <div class="flex mt-5">
                          <VButton
                            color="primary"
                            icon="feather:save"
                            raised
                            @click="saveHotCategory"
                          >
                            {{ getExpression('Save') }}
                          </VButton>
                          <VButton
                            class="ml-2"
                            color="info"
                            icon="feather:plus"
                            raised
                            @click="newHotCategory"
                          >
                            {{ getExpression('New') }}
                          </VButton>
                        </div>
                      </div>
                      <div class="column is-12">
                        <div class="flex-list-wrapper flex-list-v3">
                          <div class="tab-content is-active">
                            <VFlexTable
                              :data="modelObject.hotSalesCategories"
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
                                >
                                  <!--Table item-->
                                  <div
                                    v-for="item in modelObject.hotSalesCategories"
                                    :key="item"
                                    class="flex-table-item"
                                    :class="{ 'selected-row': item == hotSalesModel }"
                                  >
                                    <VFlexTableCell>
                                      <span class=""
                                        ><b>{{ item.itemText }}</b></span
                                      >
                                    </VFlexTableCell>
                                    <VFlexTableCell :columns="{ align: 'end' }">
                                      <button
                                        class="button v-button has-dot dark-outlined is-info mx-1 is-pushed-mobile py-0 px-2"
                                        @click="hotSalesModel = item"
                                      >
                                        <i aria-hidden="true" class="fas fa-edit dot"></i>
                                      </button>
                                      <button
                                        class="button v-button has-dot dark-outlined is-danger mx-1 is-pushed-mobile py-0 px-2"
                                        @click="deleteHotCategory(item)"
                                      >
                                        <i
                                          aria-hidden="true"
                                          class="fas fa-trash dot"
                                        ></i>
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
</style>