<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useHelpers } from '/@src/utils/helpers'
import { creditRangeOption, controlTimeOption } from '/@src/shared-types'
import type { CreditRangeType, ControlTimeType } from '/@src/shared-types'
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

const modelObject = ref({
  id: 0,
  itemCategoryCode: '',
  itemCategoryName: '',
  categoryImage: '',
  viewOrder: null,
  isActive: true,
  creditRangeType: 4,
  creditByRange: 0,
  creditRangeLength: 1,
  itemChangeTime: 0,
  controlTimeType: 0,
  plantId: 0,
})

const creditTypes: Ref<CreditRangeType[]> = ref(creditRangeOption)
const controlTypes: Ref<ControlTimeType[]> = ref(controlTimeOption)
const plants: Ref<any[]> = ref([])

onMounted(async () => {
  creditTypes.value.forEach((c: CreditRangeType) => {
    c.value = userSession.getExpression(c.value)
  })
  controlTypes.value.forEach((c: ControlTimeType) => {
    c.value = userSession.getExpression(c.value)
  })

  await bindModel()
})

const bindModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data

    if (modelObject.value.id == 0 && props.id > 0) modelObject.value.id = props.id

    const data = await api.get('ItemCategory/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data

    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        itemCategoryCode: '',
        itemCategoryName: '',
        categoryImage: '',
        viewOrder: null,
        isActive: true,
        creditRangeType: 4,
        creditByRange: 0,
        creditRangeLength: 1,
        itemChangeTime: null,
        controlTimeType: null,
        plantId: 0,
      }

    if (
      !(modelObject.value.plantId || modelObject.value.plantId == 0) &&
      plants.value.length == 1
    )
      modelObject.value.plantId = plants.value[0].id
    else if (!modelObject.value.plantId || modelObject.value.plantId == 0)
      modelObject.value.plantId = userSession.user.FactoryId
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('ItemCategory', modelObject.value)
    if (postResult.data.result) {
      notif.success(getExpression('SaveSuccess'))
      modelObject.value.id = postResult.data.recordId
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const deleteModel = async () => {
  try {
    const delResult = await api.delete('ItemCategory/' + modelObject.value.id)
    if (delResult.data.result) {
      modelObject.value.id = 0
      notif.success(getExpression('SaveSuccess'))
      router.push({ name: 'item-category' })
    } else notif.error(delResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const onIconSelected = async (event: any) => {
  if (event.target.files && event.target.files.length > 0) {
    const base64Str: string = await helpers.blobToBase64(event.target.files[0])
    modelObject.value.categoryImage = base64Str
  } else {
    modelObject.value.categoryImage = ''
  }
}

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
            <h3>{{ getExpression('ItemCategoryDefinition') }}</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'item-category' }"
                light
                dark-outlined
              >
                {{ getExpression('List') }}
              </VButton>
              <VButton color="primary" icon="feather:save" raised @click="saveModel">
                {{ getExpression('Save') }}
              </VButton>
              <VButton color="danger" icon="feather:trash" raised @click="deleteModel">
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
                <h4>{{ getExpression('CategoryInformation') }}</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('CategoryCode') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.itemCategoryCode"
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
                    <label>{{ getExpression('CategoryName') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.itemCategoryName"
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
                <div class="column is-12">
                  <VField>
                    <label>{{ getExpression('VisualOrder') }}</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.viewOrder"
                        type="number"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <!-- <div class="column is-6">
                  <VField>
                    <label>İstihkak Periyodu</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.creditRangeType"
                        :value-prop="'key'"
                        :label="'value'"
                        placeholder="Bir istihkak periyodu seçiniz"
                        :searchable="true"
                        :options="creditTypes"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Periyot Süresi</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.creditRangeLength"
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
                    <label>İsihkak</label>
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
                </div> -->
                <div class="column is-12">
                  <VField>
                    <label>Logo</label>
                    <VControl icon="feather:terminal">
                      <input
                        type="file"
                        class="input"
                        placeholder=""
                        autocomplete=""
                        accept="image/*"
                        @change="onIconSelected"
                      />
                      <p
                        v-if="
                          modelObject.categoryImage &&
                          modelObject.categoryImage.length > 0
                        "
                      >
                        <img alt="" :src="modelObject.categoryImage" width="150" />
                      </p>
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
          </div>
          <!-- <div class="column is-6">
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Değişim ve kontrol bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>Ürün Değişim Süresi (Gün)</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.itemChangeTime"
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
                    <label>Kontrol Süresi Tipi</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.controlTimeType"
                        :value-prop="'key'"
                        :label="'value'"
                        placeholder="Bir kontrol periyodu seçiniz"
                        :searchable="true"
                        :options="controlTypes"
                      />
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
          </div> -->
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