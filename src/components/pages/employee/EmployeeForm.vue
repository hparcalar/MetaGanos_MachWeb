<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { dateToStr } from '/@src/composable/useHelpers'
import { creditRangeOption } from '/@src/shared-types'
import type { CreditRangeType } from '/@src/shared-types'
import { useUserSession } from '/@src/stores/userSession'
import LoadCredit from '../../partials/employee/LoadCredit.vue'

const props = defineProps({
  id: {
    type: Number,
    default: 0,
  },
})

const api = useApi()
const notif = useNotyf()
const userSession = useUserSession()
const { isDealer } = userSession

const modelObject = ref({
  id: 0,
  employeeCode: '',
  employeeName: '',
  gsm: '',
  email: '',
  employeePassword: '',
  employeeCardId: null,
  plantId: null,
  departmentId: null,
  isActive: true,
})

const rangeTypes = ref(creditRangeOption)
const plants: Ref<any[]> = ref([])
const departments = ref([])
const cards = ref([])
const itemCategories = ref([])
const isEditCreditDialogVisible = ref(false)

onMounted(async () => {
  rangeTypes.value.forEach((c: CreditRangeType) => {
    c.value = userSession.getExpression(c.value)
  })
  await bindModel()
})

const bindModel = async () => {
  try {
    if (modelObject.value.id === 0 && props.id > 0) modelObject.value.id = props.id
    const data = await api.get('Employee/' + modelObject.value.id)
    if (data.status === 200) modelObject.value = data.data
    if (!modelObject.value)
      modelObject.value = {
        id: 0,
        employeeCode: '',
        employeeName: '',
        gsm: '',
        email: '',
        employeePassword: '',
        employeeCardId: null,
        plantId: null,
        departmentId: null,
        isActive: true,
      }

    credits.value = modelObject.value.credits
    plants.value = (await api.get('Plant')).data
    itemCategories.value = (await api.get('ItemCategory')).data

    if (!modelObject.value.plantId && plants.value.length == 1)
      modelObject.value.plantId = plants.value[0].id

    await updateDepartmentList(modelObject.value.plantId)
    await updateCardList(modelObject.value.plantId)
  } catch (error) {}
}

const onChangePlant = async (plantId: any) => {
  modelObject.value.departmentId = null
  await updateDepartmentList(plantId)
  await updateCardList(plantId)
}

const updateDepartmentList = async (plantId: any) => {
  if (plantId && plantId > 0) {
    try {
      const relatedDepartments = await api.get('Plant/' + plantId + '/Departments')
      departments.value = relatedDepartments.data
    } catch (error) {}
  } else departments.value = []
}

const updateCardList = async (plantId: any) => {
  if (plantId && plantId > 0) {
    try {
      const availableCards = await api.get('Card/Available/' + plantId)
      cards.value = availableCards.data
      if (
        modelObject.value.employeeCardId > 0 &&
        !cards.value.some((m) => m.id == modelObject.value.employeeCardId)
      )
        cards.value.push({
          id: modelObject.value.employeeCardId,
          cardCode: modelObject.value.employeeCardCode,
        })
    } catch (error) {}
  } else cards.value = []
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Employee', modelObject.value)
    if (postResult.data.result) {
      notif.success('Kayıt başarılı.')
      await bindModel()
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error.message)
  }
}

// #region EDIT TOTAL CREDIT FUNCTIONS
const selectedItemCategoryObject = ref(null)
const selectedItemCategoryQuantity = ref(null)

const showEditCredit = (itemCategoryId: number, quantity: number) => {
  selectedItemCategoryObject.value = itemCategories.value.find(
    (d) => d.id == itemCategoryId
  )
  selectedItemCategoryQuantity.value = quantity

  if (selectedItemCategoryObject.value) {
    isEditCreditDialogVisible.value = true
  }
}

const onEditCredit = async (result: any) => {
  if (result && result.approved) {
    try {
      const postResult = await api.post('Employee/EditCredit', {
        employeeId: modelObject.value.id,
        itemCategoryId: selectedItemCategoryObject.value.id,
        activeCredit: result.quantity,
      })
      if (postResult.data.result) {
        notif.success('Kredi başarıyla güncellendi.')
        await bindModel()
      } else notif.error(postResult.data.errorMessage)
    } catch (error) {
      notif.error(error)
    } finally {
      isEditCreditDialogVisible.value = false
      selectedItemCategoryObject.value = null
      selectedItemCategoryQuantity.value = null
    }
  }
}

const onCloseLoadCredit = () => {
  isEditCreditDialogVisible.value = false
  selectedItemCategoryObject.value = null
}

const deleteCredit = async (creditId: number) => {
  if (confirm('Bu kredi tanımını silmek istediğinizden emin misiniz?')) {
    try {
      const postResult = (await api.delete('Employee/DeleteCredit?creditId=' + creditId))
        .data
      if (postResult && postResult.result) {
        notif.success('Kredi başarıyla silindi.')
        await bindModel()
      } else notif.error(postResult.errorMessage)
    } catch (error) {}
  }
}
// #endregion

// #region LOAD CREDIT FUNCTIONS
const creditLoadModel = ref({
  creditId: 0,
  itemCategoryId: 0,
  employeeId: 0,
})

const isLoadDialogOpen = ref(false)
const openLoadDialog = (loadItem: any) => {
  if (!loadItem)
    creditLoadModel.value = {
      creditId: 0,
      itemCategoryId: 0,
      employeeId: modelObject.value.id,
    }
  else
    creditLoadModel.value = {
      creditId: loadItem.id,
      itemCategoryId: loadItem.itemCategoryId,
      employeeId: modelObject.value.id,
    }
  isLoadDialogOpen.value = true
}

const filters = ref('')
const credits = ref([])

const filteredData = computed(() => {
  if (!filters.value) {
    return credits.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return credits.value.filter((item) => {
      return (
        item.itemCategoryName.match(filterRe) ||
        (item.itemGroupName && item.itemGroupName.match(filterRe))
      )
    })
  }
})

const columns = {
  itemCategoryName: 'Kategori',
  itemGroupName: 'Grup',
  creditLoadDate: 'Yükleme',
  rangeType: 'Periyot',
  creditByRange: 'Toplam',
  rangeCredit: 'Kalan',
  actions: {
    label: '#',
    align: 'center',
  },
} as const

const getRangeStr = (item: any) => {
  try {
    var rgType = rangeTypes.value.find((d) => d.key === item.rangeType)
    if (rgType) {
      if (item.rangeLength && item.rangeLength > 1)
        return item.rangeLength + ' ' + rgType.value
      return rgType.value
    }
  } catch (error) {}

  return item.rangeType
}

const loadCredit = async () => {
  try {
    const postResult = await api.post('Employee/LoadCredit', creditLoadModel.value)
    if (postResult.data.result) {
      notif.success('Yükleme başarılı.')
      await bindModel()

      creditLoadModel.value.itemCategoryId = null
      creditLoadModel.value.activeCredit = null
      creditLoadModel.value.id = 0

      isLoadDialogOpen.value = false
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
  }
}

const onLoadSubmit = async () => {
  isLoadDialogOpen.value = false
  await bindModel()
}
// #endregion

// #region FILE PROCESS FUNCTIONS
const isFileProcessDialogOpen = ref(false)
const showFileProcessDialog = () => {
  isFileProcessDialogOpen.value = true
}
const onCloseFileProcessDialog = () => {
  isFileProcessDialogOpen.value = false
}
const onApproveFileProcess = (data: any) => {
  isFileProcessDialogOpen.value = false
}
// #endregion

// #region QUICK CARD DEFINITION
const isQuickCardDialogOpen: Ref<boolean> = ref(false)
const showQuickCardForm = () => {
  if (!modelObject.value.plantId) {
    notif.error('Önce bir fabrika seçmelisiniz.')
    return
  }
  isQuickCardDialogOpen.value = true
}
const onQuickCardSaved = async (cardNo: string) => {
  isQuickCardDialogOpen.value = false
  await updateCardList(modelObject.value.plantId)
  const newCard: any = cards.value.find((d: any) => d.cardCode == cardNo)
  if (newCard) modelObject.value.employeeCardId = newCard.id
}
// #endregion

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
            <h3>Personel Tanımı</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <!-- <VButton
                icon="feather:file"
                color="info"
                dark-outlined
                @click="showFileProcessDialog"
              >
                Zimmet Bilgileri
              </VButton> -->
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'employee' }"
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
                <h4>Personel bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Personel Kodu</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.employeeCode"
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
                    <label>Personel Adı</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.employeeName"
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
                <div class="column is-12">
                  <VField>
                    <label>Departman</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.departmentId"
                        :value-prop="'id'"
                        :label="'departmentName'"
                        placeholder="Bir departman seçiniz"
                        :searchable="true"
                        :options="departments"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <label class="expanded-label">Kart</label>
                  <VField addons>
                    <Multiselect
                      v-model="modelObject.employeeCardId"
                      expanded
                      :value-prop="'id'"
                      :label="'cardCode'"
                      placeholder="Bir kart seçiniz"
                      :searchable="true"
                      :options="cards"
                    />
                    <VControl>
                      <VButton
                        :color="'info'"
                        :raised="true"
                        icon="feather:plus"
                        @click="showQuickCardForm"
                        >Yeni Kart</VButton
                      >
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Gsm</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.gsm"
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
                    <label>E-Mail</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.email"
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

          <div
            class="column is-6"
            style="display: flex; align-items: stretch; min-height: 400px"
          >
            <Transition name="slide-up" mode="out-in">
              <!--Fieldset-->
              <div v-if="!isLoadDialogOpen" class="form-fieldset hk-slide-content">
                <div class="fieldset-heading">
                  <h4>Kredi durumu</h4>
                  <p></p>
                </div>
                <div class="columns is-multiline">
                  <div class="column is-12">
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
                        @click="openLoadDialog(null)"
                        >Yükleme Yap</VButton
                      >
                    </div>
                    <div class="flex-list-wrapper flex-list-v3">
                      <!--List Empty Search Placeholder -->
                      <VPlaceholderPage
                        v-if="!filteredData || !filteredData.length"
                        title="Henüz bir kredi mevcut değil."
                        subtitle="Yeni bir kredi tanımlayın."
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
                                    ><b>{{ item.itemCategoryName }}</b></span
                                  >
                                </VFlexTableCell>
                                <VFlexTableCell>
                                  <span class=""
                                    ><small>{{ item.itemGroupName }}</small></span
                                  >
                                </VFlexTableCell>
                                <VFlexTableCell>
                                  <span class="">{{
                                    dateToStr(item.creditLoadDate)
                                  }}</span>
                                </VFlexTableCell>
                                <VFlexTableCell>
                                  <span class="">{{ getRangeStr(item) }}</span>
                                </VFlexTableCell>
                                <VFlexTableCell>
                                  <span class="">{{ item.creditByRange }}</span>
                                </VFlexTableCell>
                                <VFlexTableCell>
                                  <span class="">{{ item.rangeCredit }}</span>
                                </VFlexTableCell>
                                <VFlexTableCell :columns="{ align: 'end' }">
                                  <button
                                    class="button v-button has-dot dark-outlined is-warning is-pushed-mobile py-0 px-2"
                                    @click="openLoadDialog(item)"
                                  >
                                    <i aria-hidden="true" class="fas fa-edit dot"></i>
                                  </button>
                                  <button
                                    class="button v-button has-dot dark-outlined is-danger mx-1 is-pushed-mobile py-0 px-2"
                                    @click="deleteCredit(item.id)"
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

              <div v-else-if="isLoadDialogOpen" class="form-fieldset hk-slide-content">
                <div class="fieldset-heading">
                  <h4>Kredi yükleme</h4>
                  <p></p>
                </div>
                <div class="columns is-multiline">
                  <div class="column is-12">
                    <VField>
                      <label>Stok Kategorisi</label>
                      <VControl>
                        <Multiselect
                          v-model="creditLoadModel.itemCategoryId"
                          :value-prop="'id'"
                          :label="'itemCategoryName'"
                          placeholder="Bir kategori seçiniz"
                          :searchable="true"
                          :options="itemCategories"
                        />
                      </VControl>
                    </VField>
                  </div>
                  <div class="column is-12">
                    <VField>
                      <label>Kredi</label>
                      <VControl icon="feather:terminal">
                        <input
                          v-model="creditLoadModel.activeCredit"
                          type="number"
                          class="input"
                          placeholder=""
                          autocomplete=""
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
                          @click="isLoadDialogOpen = false"
                        >
                          Vazgeç
                        </VButton>
                        <VButton
                          color="primary"
                          icon="feather:save"
                          raised
                          @click="loadCredit()"
                        >
                          Yüklemeyi Tamamla
                        </VButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>
  </form>

  <EditEmployeeCredit
    :credit-params="{
      itemCategoryName: selectedItemCategoryObject?.itemCategoryName,
      quantity: selectedItemCategoryQuantity,
    }"
    :visible="isEditCreditDialogVisible"
    @laod-credit="onEditCredit"
    @close="onCloseLoadCredit"
  />

  <VModal
    :open="isLoadDialogOpen"
    title="Personel Kredi Yükleme"
    size="big"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="isLoadDialogOpen = false"
  >
    <template #content>
      <LoadCredit :params="creditLoadModel" @submit="onLoadSubmit" />
    </template>
    <template #action>
      <span />
    </template>
  </VModal>

  <VModal
    :open="isQuickCardDialogOpen"
    title="Yeni Kart Oluştur"
    size="big"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="isQuickCardDialogOpen = false"
  >
    <template #content>
      <QuickNewCard :plant-id="modelObject.plantId ?? 0" @card-saved="onQuickCardSaved" />
    </template>
    <template #action>
      <span />
    </template>
  </VModal>

  <PlantFileProcess
    :params="{
      employeeId: modelObject?.id,
    }"
    :visible="isFileProcessDialogOpen"
    @close="onCloseFileProcessDialog"
    @processed="onApproveFileProcess"
  />
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