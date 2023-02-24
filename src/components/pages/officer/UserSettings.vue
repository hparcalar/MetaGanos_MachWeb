<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const router = useRouter()

const api = useApi()
const notif = useNotyf()
const userSession = useUserSession()
const { user } = userSession

const modelObject = ref({
  id: 0,
  officerCode: '',
  officerName: '',
  officerPassword: '',
  rptPassword: '',
  isActive: true,
  plantId: 0,
  authUnits: [],
})

const authUnits: Ref<any[]> = ref([])

const plants: Ref<any[]> = ref([])

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    modelObject.value.id = userSession?.user?.UserId
    const data = await api.get('Officer/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data
    else
      modelObject.value = {
        id: 0,
        officerCode: '',
        officerName: '',
        officerPassword: '',
        rptPassword: '',
        isActive: true,
        plantId: 0,
        authUnits: [],
      }

    modelObject.value.officerPassword = ''

    authUnits.value = modelObject.value.authUnits
  } catch (error) {}
}

const savePassword = async () => {
  if (
    !modelObject.value.officerPassword ||
    modelObject.value.officerPassword.length == 0
  ) {
    notif.error('Parola boş bırakılamaz.')
    return
  }

  if (modelObject.value.officerPassword !== modelObject.value.rptPassword) {
    notif.error('Girdiğiniz parolalar aynı değil.')
    return
  }

  try {
    const postResult = await api.post('Officer/SetPassword', modelObject.value)
    if (postResult.data.result) {
      notif.success('Parola değiştirme işleminiz başarılı.')
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error.message)
  }
}

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})
</script>

<template>
  <form class="form-layout" autocomplete="off" @submit.prevent>
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left">
            <h3>Kullanıcı Ayarları</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton color="primary" icon="feather:check" raised @click="savePassword">
                Onayla
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
                <h4>Parola değiştirme</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>Parola</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.officerPassword"
                        type="password"
                        class="input"
                        placeholder=""
                        autocomplete="false"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>Parola</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.rptPassword"
                        type="password"
                        class="input"
                        placeholder=""
                        autocomplete="false"
                      />
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