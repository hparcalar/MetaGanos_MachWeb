<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const api = useApi()
const notif = useNotyf()

const modelObject = ref({
  id: 0,
  machineCode: '',
  machineName: '',
  specialCustomer: '',
  inventoryCode: '',
  plantId: null,
  barcode: '',
  productionDate: null,
  inventoryEntryDate: null,
  locationData: '',
  brand: '',
  brandModel: '',
  country: '',
  city: '',
  district: '',
  rows: 0,
  cols: 0,
  isActive: true,
  createDate: null,
})

const plants = ref([])

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    const data = await api.get('Machine/' + props.id)
    if (data.status === 200) modelObject.value = data.data

    plants.value = (await api.get('Plant')).data
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Machine', modelObject.value)
    if (postResult.data.result) {
      notif.success('Kayıt başarılı.')
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const editSpiral = (spiralNo: number) => {
  console.log(spiralNo)
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
            <h3>Makine Tanımı</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'machine' }"
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
                <h4>Makine bilgileri</h4>
                <p></p>
              </div>
              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Makine Kodu</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.machineCode"
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
                    <label>Makine Adı</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.machineName"
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
                    <label>Envanter Kodu</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.inventoryCode"
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
                    <label>Barkod</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.barcode"
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
                    <label>Özel Müşteri</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.specialCustomer"
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
                    <VDatePicker
                      v-model="modelObject.productionDate"
                      :masks="{ input: 'DD.MM.YYYY' }"
                      trim-weeks
                    >
                      <template #default="{ inputValue, inputEvents }">
                        <VField>
                          <label>Üretim Tarihi</label>
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
                <div class="column is-6">
                  <VField>
                    <VDatePicker
                      v-model="modelObject.inventoryEntryDate"
                      :masks="{ input: 'DD.MM.YYYY' }"
                      trim-weeks
                    >
                      <template #default="{ inputValue, inputEvents }">
                        <VField>
                          <label>Envantere Giriş Tarihi</label>
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
                <div class="column is-6">
                  <VField>
                    <label>Marka</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.brand"
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
                    <label>Model</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.brandModel"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete=""
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
                <h4>Lokasyon bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Bölge</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.district"
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
                    <label>Şehir</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.city"
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
              </div>
            </div>

            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Spiral bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Satır</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.rows"
                        type="number"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Sütun</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.cols"
                        type="number"
                        class="input"
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="modelObject.rows > 0 && modelObject.cols > 0">
          <div v-for="r in modelObject.rows" :key="r" class="columns is-multiline">
            <div
              v-for="c in modelObject.cols"
              :key="c"
              class="column"
              :style="{ width: 100 / modelObject.cols + '%', 'text-align': 'center' }"
            >
              <VButton
                color="info"
                :rounded="true"
                :outlined="true"
                :bold="true"
                :fullwidth="true"
                raised
                @click="editSpiral((r - 1) * modelObject.cols + c)"
              >
                {{ (r - 1) * modelObject.cols + c }}
              </VButton>
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
  //   max-width: 740px;
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