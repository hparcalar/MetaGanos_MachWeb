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
const userSession = useUserSession
const { isDealer } = userSession

const modelObject = ref({
  id: 0,
  departmentCode: '',
  departmentName: '',
  plantId: null,
  isActive: true,
  plantPrintFileId: null,
})
const machineModel = ref({
  machineId: null,
  departmentId: null,
})

const plants = ref([])
const machines = ref([])
const plantFiles = ref([])
const departmentMachines: Ref<any[]> = ref([])
const filters = ref('')
const isMachineSelectionVisible: Ref<boolean> = ref(false)

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    if (modelObject.value.id == 0 && props.id > 0) modelObject.value.id = props.id
    const data = await api.get('Department/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data

    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        departmentCode: '',
        departmentName: '',
        plantId: null,
        isActive: true,
        plantPrintFileId: null,
      }

    plants.value = (await api.get('Plant')).data
    machines.value = (await api.get('Machine')).data

    if (!modelObject.value.plantId && plants.value.length == 1)
      modelObject.value.plantId = plants.value[0].id

    departmentMachines.value = (
      await api.get('Department/' + modelObject.value.id + '/Machines')
    ).data
    await updatePlantFiles(modelObject.value.plantId)
  } catch (error) {}
}

const filteredData = computed(() => {
  if (!filters.value) {
    return departmentMachines.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return departmentMachines.value.filter((item) => {
      return item.machineName.match(filterRe)
    })
  }
})

const columns = {
  machineName: 'Otomat',
  actions: {
    label: '#',
    align: 'center',
  },
} as const

const onChangePlant = async (plantId: any) => {
  modelObject.value.plantPrintFileId = null
  await updatePlantFiles(plantId)
}

const showMachineSelection = () => {
  machineModel.value.machineId = null
  machineModel.value.machineName = ''

  isMachineSelectionVisible.value = true
}

const addMachine = () => {
  if (machineModel.value && machineModel.value.machineId) {
    if (
      departmentMachines.value.some((d) => d.machineId == machineModel.value.machineId)
    ) {
      notif.error('Eklemeye çalıştığınız otomat listenizde zaten mevcut.')
      return
    }

    const properMachine: any = machines.value.find(
      (d: any) => d.id == machineModel.value.machineId
    )
    if (properMachine) {
      departmentMachines.value.push({
        machineId: machineModel.value.machineId,
        departmentId: modelObject.value.id,
        machineName: properMachine.machineName,
      })

      isMachineSelectionVisible.value = false
    }
  }
}
const deleteMachine = (machineId: number | null) => {
  if (confirm('Bu otomatı listeden çıkartmak istediğinizden emin misiniz?')) {
    if (machineId) {
      const currentRow = departmentMachines.value.find((d) => d.machineId == machineId)
      if (currentRow) {
        const currentIndex = departmentMachines.value.indexOf(currentRow)
        if (currentIndex > -1) {
          departmentMachines.value.splice(currentIndex, 1)
        }
      }
    }
  }
}

const updatePlantFiles = async (plantId: number | null) => {
  if (plantId && plantId > 0) {
    try {
      const relatedFiles = await api.get('Plant/' + plantId + '/PrintFiles')
      plantFiles.value = relatedFiles.data
    } catch (error) {}
  } else plantFiles.value = []
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Department', modelObject.value)
    if (postResult.data.result) {
      modelObject.value.id = postResult.data.recordId
      await api.post(
        'Department/' + modelObject.value.id + '/Machines',
        departmentMachines.value
      )

      notif.success('Kayıt başarılı.')
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
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
            <h3>Departman Tanımı</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'department' }"
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
                <h4>Departman bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Departman Kodu</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.departmentCode"
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
                    <label>Departman Adı</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.departmentName"
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
                    <label>Fabrika</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.plantId"
                        :value-prop="'id'"
                        :label="'plantName'"
                        placeholder="Bir fabrika seçiniz"
                        :searchable="true"
                        :options="plants"
                        @change="onChangePlant"
                      />
                    </VControl>
                  </VField>
                </div>
                <!-- <div class="column is-12">
                  <VField>
                    <label>Zimmet belgesi</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.plantPrintFileId"
                        :value-prop="'id'"
                        :label="'printFileName'"
                        placeholder="Bir belge seçiniz"
                        :searchable="true"
                        :options="plantFiles"
                      />
                    </VControl>
                  </VField>
                </div> -->
              </div>
            </div>
          </div>
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Kullanılabilir otomatlar</h4>
                <p></p>
              </div>
              <div class="columns is-multiline">
                <div class="column is-12">
                  <div v-if="isMachineSelectionVisible" class="form-fieldset">
                    <div class="fieldset-heading">
                      <h4>Otomat seçimi</h4>
                      <p></p>
                    </div>
                    <div class="columns is-multiline">
                      <div class="column is-12">
                        <VField>
                          <label>Makine</label>
                          <VControl>
                            <Multiselect
                              v-model="machineModel.machineId"
                              :value-prop="'id'"
                              :label="'machineName'"
                              placeholder="Bir otomat seçiniz"
                              :searchable="true"
                              :options="machines"
                            />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-12">
                        <div class="right">
                          <div class="buttons">
                            <VButton
                              icon="lnir lnir-arrow-left rem-100"
                              light
                              dark-outlined
                              @click="isMachineSelectionVisible = false"
                            >
                              Vazgeç
                            </VButton>
                            <VButton
                              color="primary"
                              icon="feather:save"
                              raised
                              @click="addMachine()"
                            >
                              Ekle
                            </VButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="form-fieldset">
                    <div class="list-flex-toolbar is-reversed">
                      <VControl icon="feather:search">
                        <input
                          v-model="filters"
                          class="input custom-text-filter"
                          placeholder="Arama..."
                        />
                      </VControl>

                      <VButton
                        v-if="modelObject && modelObject.id > 0"
                        :color="'info'"
                        :raised="true"
                        icon="feather:plus"
                        @click="showMachineSelection()"
                        >Otomat Ekle</VButton
                      >
                    </div>
                    <div class="flex-list-wrapper flex-list-v3">
                      <!--List Empty Search Placeholder -->
                      <VPlaceholderPage
                        v-if="!filteredData || !filteredData.length"
                        title="Henüz bir otomat seçilmemiş."
                        subtitle="Bir otomat ekleyerek bu departman için makine tanımlayın."
                        larger
                      >
                      </VPlaceholderPage>

                      <!--Active Tab-->
                      <div v-else-if="filteredData.length" class="tab-content is-active">
                        <VFlexTable :data="filteredData" :columns="columns" rounded>
                          <template #body>
                            <TransitionGroup
                              name="list"
                              tag="div"
                              class="flex-list-inner"
                            >
                              <!--Table item-->
                              <div
                                v-for="item in filteredData"
                                :key="item.id"
                                class="flex-table-item"
                              >
                                <VFlexTableCell>
                                  <span class=""
                                    ><b>{{ item.machineName }}</b></span
                                  >
                                </VFlexTableCell>
                                <VFlexTableCell :columns="{ align: 'end' }">
                                  <button
                                    class="button v-button has-dot dark-outlined is-danger mx-1 is-pushed-mobile py-0 px-2"
                                    @click="deleteMachine(item.machineId)"
                                  >
                                    <i aria-hidden="true" class="fas fa-trash dot"></i>
                                  </button>
                                </VFlexTableCell>
                              </div>
                            </TransitionGroup>
                          </template>
                        </VFlexTable>

                        <!--Table Pagination-->
                        <VFlexPagination
                          v-if="filteredData.length > 5"
                          :item-per-page="10"
                          :total-items="filteredData.length"
                          :current-page="1"
                          :max-links-displayed="10"
                        />
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