<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useHelpers } from '/@src/utils/helpers'
import { useRouter } from 'vue-router'
import { useUserSession } from '/@src/stores/userSession'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const { getExpression, hasAuth } = useUserSession()
const router = useRouter()
const helpers = useHelpers()
const api = useApi()
const notif = useNotyf()

const dialogItemCategory = ref(false)
const dialogItemGroup = ref(false)

const modelObject = ref({
  id: 0,
  itemCode: '',
  itemName: '',
  itemImage: '',
  alternatingCode1: '',
  alternatingCode2: '',
  criticalMax: null,
  criticalMin: null,
  price1: null,
  price2: null,
  explanation: '',
  viewOrder: 0,
  unitTypeId: null,
  barcode1: '',
  barcode2: '',
  itemGroupId: null,
  itemCategoryId: null,
  isActive: true,
})

const categories = ref([])
const groups = ref([])
const unitTypes = ref([])

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    if (modelObject.value.id == 0) modelObject.value.id = props.id
    const data = await api.get('Item/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data

    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        itemCode: '',
        itemName: '',
        itemImage: '',
        alternatingCode1: '',
        alternatingCode2: '',
        criticalMax: null,
        criticalMin: null,
        price1: null,
        price2: null,
        explanation: '',
        viewOrder: 0,
        unitTypeId: null,
        barcode1: '',
        barcode2: '',
        itemGroupId: null,
        itemCategoryId: null,
        isActive: true,
      }

    categories.value = (await api.get('ItemCategory')).data
    unitTypes.value = (await api.get('UnitType')).data
    await updateGroupList(modelObject.value.itemCategoryId)
  } catch (error) { }
}

const updateCategoryList = async () => {
  categories.value = (await api.get('ItemCategory')).data
}

const deleteModel = async () => {
  try {
    const delResult = await api.delete('Item/' + modelObject.value.id)
    if (delResult.data.result) {
      modelObject.value.id = 0
      notif.success(getExpression('SaveSuccess'))
      router.push({ name: 'item' })
    } else notif.error(delResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const onIconSelected = async (event: any) => {
  if (event.target.files && event.target.files.length > 0) {
    const base64Str: string = await helpers.blobToBase64(event.target.files[0])
    modelObject.value.itemImage = base64Str
  } else {
    modelObject.value.itemImage = ''
  }
}

const updateGroupList = async (categoryId: any) => {
  if (categoryId && categoryId > 0) {
    try {
      const relatedGroups = await api.get('ItemCategory/' + categoryId + '/Groups')
      groups.value = relatedGroups.data
    } catch (error) { }
  } else groups.value = []
}

const onChangeCategory = async (categoryId: any) => {
  modelObject.value.itemGroupId = null
  await updateGroupList(categoryId)
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Item', modelObject.value)
    if (postResult.data.result) {
      modelObject.value.id = postResult.data.recordId
      notif.success(getExpression('SaveSuccess'))
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const newItemCategory = () => {
  dialogItemCategory.value = true
}
const newItemGroup = () => {
  if (!modelObject.value.itemCategoryId || modelObject.value.itemCategoryId == 0) {
    notif.error('Önce kategoriyi seçmelisiniz.')
    return
  }

  dialogItemGroup.value = true
}

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})

const dlgItemCategoryClosed = () => {
  dialogItemCategory.value = false
}

const dlgItemCategorySaved = async (categoryId: any) => {
  dialogItemCategory.value = false
  modelObject.value.itemCategoryId = categoryId
  await updateCategoryList()
}

const dlgItemGroupClosed = () => {
  dialogItemGroup.value = false
}

const dlgItemGroupSaved = async (itemGroupId) => {
  dialogItemGroup.value = false
  modelObject.value.itemGroupId = itemGroupId
  await updateGroupList(modelObject.value.itemCategoryId)
}
</script>

<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left">
            <h3>{{ getExpression('ItemDefinitions') }}</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton icon="lnir lnir-arrow-left rem-100" :to="{ name: 'item-definition' }" light dark-outlined>
                {{ getExpression('List') }}
              </VButton>
              <VButton v-if="hasAuth('Items', 'Write')" color="primary" icon="feather:save" raised @click="saveModel">
                {{ getExpression('Save') }}
              </VButton>
              <VButton v-if="hasAuth('Items', 'Delete')" color="danger" icon="feather:trash" raised @click="deleteModel">
                {{ getExpression('Delete') }}
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
                <h4>{{ getExpression('ItemInformation') }}</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('ItemCode') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.itemCode" type="text" class="input" placeholder="" autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('ItemName') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.itemName" type="text" class="input" placeholder="" autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <label class="expanded-label">{{ getExpression('Category') }}</label>
                  <VField addons>
                    <Multiselect v-model="modelObject.itemCategoryId" :value-prop="'id'" :label="'itemCategoryName'"
                      placeholder="" :searchable="true" :options="categories" @change="onChangeCategory" />
                    <VControl>
                      <VButton :color="'info'" :raised="true" icon="feather:plus" @click="newItemCategory"></VButton>
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <label class="expanded-label">{{ getExpression('Group') }}</label>
                  <VField addons>
                    <Multiselect v-model="modelObject.itemGroupId" :value-prop="'id'" :label="'itemGroupName'"
                      placeholder="" :searchable="true" :options="groups" />
                    <VControl>
                      <VButton :color="'info'" :raised="true" icon="feather:plus" @click="newItemGroup"></VButton>
                    </VControl>
                  </VField>
                </div>
                <!-- <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('Unit') }}</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.unitTypeId"
                        :value-prop="'id'"
                        :label="'unitTypeName'"
                        placeholder=""
                        :searchable="true"
                        :options="unitTypes"
                      />
                    </VControl>
                  </VField>
                </div> -->
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('Explanation') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.explanation" type="text" class="input" placeholder="" autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>Logo</label>
                    <VControl icon="feather:terminal">
                      <input type="file" class="input" placeholder="" autocomplete="" accept="image/*"
                        @change="onIconSelected" />
                      <p v-if="modelObject.itemImage && modelObject.itemImage.length > 0">
                        <img alt="" :src="modelObject.itemImage" width="150" />
                      </p>
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
                <h4>{{ getExpression('OtherInformation') }}</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('Price') }}-1</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.price1" type="number" class="input" placeholder="" autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('Price') }}-2</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.price2" type="number" class="input" placeholder="" autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('MinimumStock') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.criticalMin" type="number" class="input" placeholder=""
                        autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('MaximumStock') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.criticalMax" type="number" class="input" placeholder=""
                        autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('VisualOrder') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.viewOrder" type="number" class="input" placeholder="" autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('Barcode') }}-1</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.barcode1" type="text" class="input" placeholder="" autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('Barcode') }}-2</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.barcode2" type="text" class="input" placeholder="" autocomplete="" />
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

  <ItemCategoryDialog v-if="dialogItemCategory" :id="0" :visible="dialogItemCategory" @close="dlgItemCategoryClosed"
    @on-saved="dlgItemCategorySaved" />
  <ItemGroupDialog v-if="dialogItemGroup" :id="0" :category-id="modelObject.itemCategoryId ?? 0"
    :visible="dialogItemGroup" @close="dlgItemGroupClosed" @on-saved="dlgItemGroupSaved" />
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