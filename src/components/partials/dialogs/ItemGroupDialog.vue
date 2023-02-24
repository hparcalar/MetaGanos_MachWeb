<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
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
  categoryId: {
    type: Number,
    default: 0,
  },
  visible: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const emit = defineEmits({
  close: () => true,
  onSaved: () => true,
})

const { getExpression } = useUserSession()
const router = useRouter()

const helpers = useHelpers()
const api = useApi()
const notif = useNotyf()

const modelObject = ref({
  id: 0,
  itemGroupCode: '',
  itemGroupName: '',
  itemCategoryId: null,
  isActive: true,
})

const categories = ref([])

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    if (modelObject.value.id == 0) modelObject.value.id = props.id
    const data = await api.get('ItemGroup/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data

    if (!modelObject.value || modelObject.value.id == 0) {
      modelObject.value = {
        id: 0,
        itemGroupCode: '',
        itemGroupName: '',
        itemCategoryId: null,
        isActive: true,
      }
    }

    categories.value = (await api.get('ItemCategory')).data
    modelObject.value.itemCategoryId = props.categoryId
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('ItemGroup', modelObject.value)
    if (postResult.data.result) {
      modelObject.value.id = postResult.data.recordId
      notif.success(getExpression('SaveSuccess'))
      emit('onSaved', modelObject.value.id)
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const categoryName = computed(() =>
  categories.value && categories.value.length > 0 && props.categoryId > 0
    ? categories.value.find((d) => d.id == props.categoryId).itemCategoryName
    : ''
)

const deleteModel = async () => {
  try {
    const delResult = await api.delete('ItemGroup/' + modelObject.value.id)
    if (delResult.data.result) {
      modelObject.value.id = 0
      notif.success(getExpression('SaveSuccess'))
      router.push({ name: 'item-group' })
    } else notif.error(delResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const onIconSelected = async (event: any) => {
  if (event.target.files && event.target.files.length > 0) {
    const base64Str: string = await helpers.blobToBase64(event.target.files[0])
    modelObject.value.groupImage = base64Str
  } else {
    modelObject.value.groupImage = ''
  }
}

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})

watch(
  () => props.visible,
  async () => {
    if (props.visible) {
      await bindModel()
    } else emit('close')
  }
)

watch(
  () => props.categoryId,
  async () => {
    await bindModel()
  }
)
</script>

<template>
  <VModal
    :open="props.visible"
    title="Stok Kategorisi"
    size="medium"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <div class="form-outer">
        <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
          <div class="form-header-inner">
            <div class="left"></div>
            <div class="right">
              <div class="buttons">
                <VButton color="primary" icon="feather:save" raised @click="saveModel">
                  {{ getExpression('Save') }}
                </VButton>
              </div>
            </div>
          </div>
        </div>
        <div class="form-body">
          <!--Fieldset-->
          <div class="form-fieldset">
            <div class="columns is-multiline">
              <div class="column is-6">
                <VField>
                  <label>{{ getExpression('GroupCode') }}</label>
                  <VControl icon="feather:terminal">
                    <input
                      v-model="modelObject.itemGroupCode"
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
                  <label>{{ getExpression('GroupName') }}</label>
                  <VControl icon="feather:terminal">
                    <input
                      v-model="modelObject.itemGroupName"
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
                  <label>{{ getExpression('Category') }}</label>
                  <VControl>
                    <input
                      v-model="categoryName"
                      type="text"
                      :readonly="true"
                      class="input"
                      placeholder=""
                      autocomplete=""
                    />
                  </VControl>
                </VField>
              </div>
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
                    <p v-if="modelObject.groupImage && modelObject.groupImage.length > 0">
                      <img alt="" :src="modelObject.groupImage" width="150" />
                    </p>
                  </VControl>
                </VField>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </VModal>
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