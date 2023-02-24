<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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

const userSession = useUserSession()
const { isDealer } = userSession
const helpers = useHelpers()
const api = useApi()
const notif = useNotyf()

const isRoot = computed(() => isDealer && userSession.user.Username == 'MetaGanos')

const modelObject = ref({
  id: 0,
  licenseCode: '',
  explanation: '',
  isActive: true,
  lastValidation: null,
})

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    if (modelObject.value.id == 0) modelObject.value.id = props.id

    const data = await api.get('LicenseKey/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('LicenseKey', modelObject.value)
    if (postResult.data.result) {
      notif.success(userSession.getExpression('SaveSuccess'))
      modelObject.value.id = postResult.data.recordId
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
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
            <h3>Lisans Anahtar Tanımı</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'license' }"
                light
                dark-outlined
              >
                {{ userSession.getExpression('List') }}
              </VButton>
              <VButton
                v-if="isRoot"
                color="primary"
                icon="feather:save"
                raised
                @click="saveModel"
              >
                {{ userSession.getExpression('Save') }}
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
                <h4>Lisans Bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Lisans Kodu</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.licenseCode"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete="off"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Açıklama</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.explanation"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete="off"
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
                <h4>Doğrulama Bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>Son Doğrulama Tarihi</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.lastValidation"
                        :readonly="true"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete="off"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label></label>
                    <VSwitchBlock
                      v-model="modelObject.isActive"
                      class="ml-2"
                      :label="'Aktif'"
                      color="success"
                    />
                  </VField>
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