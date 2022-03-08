<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useHelpers } from '/@src/utils/helpers'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const helpers = useHelpers()
const api = useApi()
const notif = useNotyf()

const modelObject = ref({
  id: 0,
  itemCategoryCode: '',
  itemCategoryName: '',
  categoryImage: '',
  viewOrder: null,
  isActive: true,
})

const categories = ref([])

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    const data = await api.get('ItemCategory/' + props.id)
    if (data.status === 200) modelObject.value = data.data
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('ItemCategory', modelObject.value)
    if (postResult.data.result) {
      notif.success('Kayıt başarılı.')
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
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
            <h3>Stok Kategori Tanımı</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'item-category' }"
                light
                dark-outlined
              >
                Liste
              </VButton>
              <VButton color="primary" icon="feather:save" raised @click="saveModel">
                Kaydet
              </VButton>
            </div>
          </div>
        </div>
      </div>
      <div class="form-body">
        <!--Fieldset-->
        <div class="form-fieldset">
          <div class="fieldset-heading">
            <h4>Kategori bilgileri</h4>
            <p></p>
          </div>

          <div class="columns is-multiline">
            <div class="column is-12">
              <VField>
                <label>Kategori Kodu</label>
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
                <label>Kategori Adı</label>
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
            <div class="column is-12">
              <VField>
                <label>Görünüm Sırası</label>
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
            <div class="column is-12">
              <VField>
                <label>İkon</label>
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
                      modelObject.categoryImage && modelObject.categoryImage.length > 0
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