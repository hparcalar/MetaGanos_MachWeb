<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { dateToStr, dateIsLtFromNow } from '/@src/composable/useHelpers'
import { useUserSession } from '/@src/stores/userSession'
import { creditRangeOption } from '/@src/shared-types'
import type { CreditRangeType } from '/@src/shared-types'
import { useRouter } from 'vue-router'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const router = useRouter()

const api = useApi()
const notif = useNotyf()
const userSession = useUserSession()
const { getExpression, hasAuth } = useUserSession()
const { isDealer } = userSession

const rangeTypes = ref(creditRangeOption)

const modelObject = ref({
  id: 0,
  departmentCode: '',
  departmentName: '',
  plantId: null,
  isActive: true,
  plantPrintFileId: null,
  credits: [],
})

const departmentCreditModel = ref({
  creditId: 0,
  itemCategoryId: 0,
  departmentId: 0,
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
const isDepCreditFormVisible = ref(false)
const isLoadCreditFormVisible = ref(false)

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
        credits: [],
      }

    plants.value = (await api.get('Plant')).data

    if (!modelObject.value.plantId && plants.value.length == 1)
      modelObject.value.plantId = plants.value[0].id
    else if (!modelObject.value.plantId || modelObject.value.plantId == 0)
      modelObject.value.plantId = userSession.user.FactoryId

    if (modelObject.value.plantId)
      machines.value = (
        await api.get('Plant/' + modelObject.value.plantId + '/Machines')
      ).data

    departmentMachines.value = (
      await api.get('Department/' + modelObject.value.id + '/Machines')
    ).data
    await updatePlantFiles(modelObject.value.plantId)
    await checkUsableMachines()
  } catch (error) { }
}

const checkUsableMachines = async () => {
  if (
    modelObject.value.id == 0 ||
    !departmentMachines.value ||
    departmentMachines.value.length == 0
  ) {
    const plantMachines = (
      await api.get('Plant/' + modelObject.value.plantId + '/Machines')
    ).data
    if (plantMachines) {
      departmentMachines.value = machines.value.map((d: any) => {
        return {
          machineId: d.id,
          departmentId: 0,
          id: 0,
          machineName: d.machineName,
        }
      })
    }
  }
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
  machineName: getExpression('Automat'),
  actions: {
    label: '#',
    align: 'center',
  },
} as const

const depCreditColumns = {
  itemCategoryName: getExpression('Item'),
  rangeType: getExpression('Period'),
  creditByRange: 'Kredi',
  actions: {
    label: '#',
    align: 'center',
  },
} as const

const deleteModel = async () => {
  try {
    const delResult = await api.delete('Department/' + modelObject.value.id)
    if (delResult.data.result) {
      modelObject.value.id = 0
      notif.success('Silme işlemi tamamlandı')
      router.push({ name: 'department' })
    } else notif.error(delResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const onChangePlant = async (plantId: any) => {
  modelObject.value.plantPrintFileId = null
  modelObject.value.plantId = plantId
  departmentMachines.value = []
  machines.value = []
  const plantMachines = (
    await api.get('Plant/' + modelObject.value.plantId + '/Machines')
  ).data
  if (plantMachines) machines.value = plantMachines
  await updatePlantFiles(plantId)
  await checkUsableMachines()
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
    } catch (error) { }
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

      notif.success(getExpression('SaveSuccess'))
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const showLoadCreditForm = () => {
  isLoadCreditFormVisible.value = true
}

const getRangeStr = (item: any) => {
  try {
    var rgType = rangeTypes.value.find((d) => d.key === item.rangeType)
    if (rgType) {
      if (item.rangeLength && item.rangeLength > 1)
        return item.rangeLength + ' ' + rgType.value
      return rgType.value
    }
  } catch (error) { }

  return item.rangeType
}

const openDepCreditForm = (creditId: number | null) => {
  departmentCreditModel.value.departmentId = modelObject.value.id
  departmentCreditModel.value.creditId = creditId
  isDepCreditFormVisible.value = true
}

const deleteDepCredit = async (creditId: number) => {
  if (confirm('Bu kredi tanımını silmek istediğinizden emin misiniz?')) {
    try {
      const postResult = (
        await api.delete('Department/DeleteCredit?creditId=' + creditId)
      ).data
      if (postResult && postResult.result) {
        notif.success('Kredi başarıyla silindi.')
        await bindModel()
      } else notif.error(postResult.errorMessage)
    } catch (error) { }
  }
}

const onDepCreditSubmit = async () => {
  isDepCreditFormVisible.value = false
  await bindModel()
}

const applyToEveryone = async () => {
  if (
    confirm(
      'Bu departmandaki kredi şablonunu departmana bağlı tüm personele uygulamak istediğinizden emin misiniz?'
    )
  ) {
    const getResult = (
      await api.get('Department/ApplyCreditsForEveryone/' + modelObject.value.id)
    ).data
    if (getResult && getResult.result == true) {
      notif.success('Tüm personel istihkakları başarıyla güncellendi.')
    } else notif.error('Bir hata oluştu.')
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
            <h3>{{ getExpression('DepartmentDefinitions') }}</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton v-if="hasAuth('Departments', 'Write')" color="primary" icon="feather:users" raised
                @click="applyToEveryone">
                Tüm Personele Uygula
              </VButton>
              <VButton v-if="hasAuth('Departments', 'Write')" icon="feather:upload" color="info" raised
                @click="showLoadCreditForm">
                {{ getExpression('LoadCreditByDepartment') }}
              </VButton>
              <VButton icon="lnir lnir-arrow-left rem-100" :to="{ name: 'department' }" light dark-outlined>
                {{ getExpression('List') }}
              </VButton>
              <VButton v-if="hasAuth('Departments', 'Write')" color="primary" icon="feather:save" raised
                @click="saveModel">
                {{ getExpression('Save') }}
              </VButton>
              <VButton v-if="hasAuth('Departments', 'Delete')" color="danger" icon="feather:trash" raised
                @click="deleteModel">
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
                <h4>{{ getExpression('Department') }}</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('DepartmentCode') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.departmentCode" type="text" class="input" placeholder=""
                        autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>{{ getExpression('DepartmentName') }}</label>
                    <VControl icon="feather:terminal">
                      <input v-model="modelObject.departmentName" type="text" class="input" placeholder=""
                        autocomplete="" />
                    </VControl>
                  </VField>
                </div>
                <div v-if="isDealer" class="column is-12">
                  <VField>
                    <label>{{ getExpression('Factory') }}</label>
                    <VControl>
                      <Multiselect v-model="modelObject.plantId" :value-prop="'id'" :label="'plantName'" placeholder=""
                        :searchable="true" :options="plants" @change="onChangePlant" />
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

                <div class="column is-12">
                  <div class="form-fieldset">
                    <div class="fieldset-heading">
                      <h4>Kredi Bilgileri</h4>
                      <p></p>
                    </div>
                    <div class="columns is-multiline">
                      <div class="column is-12">
                        <div class="list-flex-toolbar is-reversed">
                          <VButton v-if="modelObject && modelObject.id > 0" :color="'info'" :raised="true"
                            icon="feather:plus" @click="openDepCreditForm(null)">Yeni Kredi</VButton>
                        </div>
                        <div class="flex-list-wrapper flex-list-v3">
                          <!--List Empty Search Placeholder -->
                          <VPlaceholderPage v-if="!modelObject.credits" :title="getExpression('AnyDataDoesntExists')"
                            subtitle="" larger>
                          </VPlaceholderPage>

                          <!--Active Tab-->
                          <div v-else-if="modelObject.credits" class="tab-content is-active">
                            <VFlexTable :data="modelObject.credits" :columns="depCreditColumns" clickable compact
                              separators>
                              <template #body>
                                <!--Table item-->
                                <div v-for="item in modelObject.credits" :key="item.id" class="flex-table-item" :class="{
                                  'past-credit':
                                    item.creditEndDate &&
                                    dateIsLtFromNow(item.creditEndDate),
                                }">
                                  <VFlexTableCell>
                                    <span class=""><small>{{
                                      item.itemName && item.itemName.length > 0
                                      ? item.itemName
                                      : item.itemGroupName &&
                                        item.itemGroupName.length > 0
                                        ? item.itemGroupName
                                        : item.itemCategoryName
                                    }}</small></span>
                                  </VFlexTableCell>
                                  <VFlexTableCell>
                                    <span class=""><small>{{ getRangeStr(item) }}</small></span>
                                  </VFlexTableCell>
                                  <VFlexTableCell>
                                    <span class=""><small>{{ item.creditByRange }}</small></span>
                                  </VFlexTableCell>
                                  <VFlexTableCell :columns="{ align: 'end' }">
                                    <button
                                      class="button v-button has-dot dark-outlined is-warning is-pushed-mobile py-0 px-2"
                                      @click="openDepCreditForm(item.id)">
                                      <i aria-hidden="true" class="fas fa-edit dot"></i>
                                    </button>
                                    <button
                                      class="button v-button has-dot dark-outlined is-danger mx-1 is-pushed-mobile py-0 px-2"
                                      @click="deleteDepCredit(item.id)">
                                      <i aria-hidden="true" class="fas fa-trash dot"></i>
                                    </button>
                                  </VFlexTableCell>
                                </div>
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
          <div class="column is-6">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>{{ getExpression('AvailableMachines') }}</h4>
                <p></p>
              </div>
              <div class="columns is-multiline">
                <div class="column is-12">
                  <div v-if="isMachineSelectionVisible" class="form-fieldset">
                    <div class="fieldset-heading">
                      <h4>{{ getExpression('MachineSelection') }}</h4>
                      <p></p>
                    </div>
                    <div class="columns is-multiline">
                      <div class="column is-12">
                        <VField>
                          <label>{{ getExpression('Machine') }}</label>
                          <VControl>
                            <Multiselect v-model="machineModel.machineId" :value-prop="'id'" :label="'machineName'"
                              placeholder="" :searchable="true" :options="machines" />
                          </VControl>
                        </VField>
                      </div>
                      <div class="column is-12">
                        <div class="right">
                          <div class="buttons">
                            <VButton icon="lnir lnir-arrow-left rem-100" light dark-outlined
                              @click="isMachineSelectionVisible = false">
                              {{ getExpression('Cancel') }}
                            </VButton>
                            <VButton color="primary" icon="feather:save" raised @click="addMachine()">
                              {{ getExpression('Add') }}
                            </VButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="form-fieldset">
                    <div class="list-flex-toolbar is-reversed">
                      <VControl icon="feather:search">
                        <input v-model="filters" class="input custom-text-filter" placeholder="Arama..." />
                      </VControl>

                      <VButton v-if="modelObject && modelObject.id > 0" :color="'info'" :raised="true" icon="feather:plus"
                        @click="showMachineSelection()">{{ getExpression('AddMachine') }}</VButton>
                    </div>
                    <div class="flex-list-wrapper flex-list-v3">
                      <!--List Empty Search Placeholder -->
                      <VPlaceholderPage v-if="!filteredData || !filteredData.length" title="" subtitle="" larger>
                      </VPlaceholderPage>

                      <!--Active Tab-->
                      <div v-else-if="filteredData.length" class="tab-content is-active">
                        <VFlexTable :data="filteredData" :columns="columns" rounded>
                          <template #body>
                            <TransitionGroup name="list" tag="div" class="flex-list-inner">
                              <!--Table item-->
                              <div v-for="item in filteredData" :key="item.id" class="flex-table-item">
                                <VFlexTableCell>
                                  <span class=""><b>{{ item.machineName }}</b></span>
                                </VFlexTableCell>
                                <VFlexTableCell :columns="{ align: 'end' }">
                                  <button
                                    class="button v-button has-dot dark-outlined is-danger mx-1 is-pushed-mobile py-0 px-2"
                                    @click="deleteMachine(item.machineId)">
                                    <i aria-hidden="true" class="fas fa-trash dot"></i>
                                  </button>
                                </VFlexTableCell>
                              </div>
                            </TransitionGroup>
                          </template>
                        </VFlexTable>

                        <!--Table Pagination-->
                        <VFlexPagination v-if="filteredData.length > 5" :item-per-page="10"
                          :total-items="filteredData.length" :current-page="1" :max-links-displayed="10" />
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

  <BulkCreditLoad :visible="isLoadCreditFormVisible" :department-id="modelObject.id"
    @close="isLoadCreditFormVisible = false" @saved="isLoadCreditFormVisible = false" />

  <VModal :open="isDepCreditFormVisible" :title="'Departman Kredi Bilgileri'" size="big" actions="right"
    :cancel-label="'Vazgeç'" @close="isDepCreditFormVisible = false">
    <template #content>
      <DepartmentCredit :params="departmentCreditModel" @submit="onDepCreditSubmit" />
    </template>
    <template #action>
      <span />
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