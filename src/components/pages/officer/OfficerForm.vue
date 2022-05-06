<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useUserSession } from '/@src/stores/userSession'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const api = useApi()
const notif = useNotyf()
const userSession = useUserSession()
const { user } = userSession

const modelObject = ref({
  id: 0,
  officerCode: '',
  officerName: '',
  officerPassword: '',
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
    plants.value = (await api.get('Dealer/' + user?.UserId + '/Plants')).data

    if (modelObject.value.id === 0) modelObject.value.id = props.id
    const data = await api.get('Officer/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data
    else
      modelObject.value = {
        id: 0,
        officerCode: '',
        officerName: '',
        officerPassword: '',
        isActive: true,
        plantId: 0,
        authUnits: [],
      }

    authUnits.value = modelObject.value.authUnits
  } catch (error) {}
}

const saveModel = async () => {
  try {
    modelObject.value.authUnits = authUnits.value
    const postResult = await api.post('Officer', modelObject.value)
    if (postResult.data.result) {
      notif.success('Kayıt başarılı.')
      modelObject.value.id = postResult.data.recordId
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error.message)
  }
}

const onReadChanged = (item: any, event: any) => {
  item.canRead = event.target.checked
}

const onWriteChanged = (item: any, event: any) => {
  item.canWrite = event.target.checked
}

const onDeleteChanged = (item: any, event: any) => {
  item.canDelete = event.target.checked
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
            <h3>Kullanıcı Tanımı</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'officer' }"
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
        <div class="columns is-multiline">
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Kullanıcı bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>Kullanıcı Kodu</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.officerCode"
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
                    <label>Kullanıcı Adı</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.officerName"
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
                    <label>Fabrika</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.plantId"
                        :value-prop="'id'"
                        :label="'plantName'"
                        placeholder="Bir fabrika seçiniz"
                        :searchable="true"
                        :options="plants"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>Parola</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.officerPassword"
                        type="password"
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
                <h4>Yetki tanımları</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <table class="table is-striped is-fullwidth">
                    <thead>
                      <tr>
                        <th scope="col">Bölüm</th>
                        <th scope="col">Okuma</th>
                        <th scope="col">Yazma</th>
                        <th scope="col">Silme</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in authUnits" :key="item">
                        <td>{{ item.sectionText }}</td>
                        <td>
                          <VCheckbox
                            v-model="item.canRead"
                            color="info"
                            @change="onReadChanged(item, $event)"
                          />
                        </td>
                        <td>
                          <VCheckbox
                            v-model="item.canWrite"
                            color="info"
                            @change="onWriteChanged(item, $event)"
                          />
                        </td>
                        <td>
                          <VCheckbox
                            v-model="item.canDelete"
                            color="info"
                            @change="onDeleteChanged(item, $event)"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
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