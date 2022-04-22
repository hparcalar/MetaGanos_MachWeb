<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import { useHelpers } from '/@src/utils/helpers'
import EditPrintFile from '/@src/components/partials/dialogs/EditPrintFile.vue'

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
  plantCode: '',
  plantName: '',
  explanation: '',
  dealerId: null,
  plantLogo: '',
})
const printFiles = ref([])
const dealers = ref([])

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    const data = await api.get('Plant/' + props.id)
    if (data.status === 200) modelObject.value = data.data

    printFiles.value = (await api.get('Plant/' + props.id + '/PrintFiles')).data
    dealers.value = (await api.get('Dealer')).data
  } catch (error) {}
}

const saveModel = async () => {
  try {
    const postResult = await api.post('Plant', modelObject.value)
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
    modelObject.value.plantLogo = base64Str
  } else {
    modelObject.value.plantLogo = ''
  }
}

// #region PRINT FILE FUNCTIONS
const selectedFileId = ref(0)
const selectedFileImage = ref('')
const isFileDialogVisible = ref(false)
const isImageViewerVisible = ref(false)
const filters = ref('')

const filteredData = computed(() => {
  if (!filters.value) {
    return printFiles.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return printFiles.value.filter((item) => {
      return item.printFileCode.match(filterRe) || item.printFileName.match(filterRe)
    })
  }
})

const columns = {
  printFileCode: 'Şablon Kodu',
  imageData: 'Resim',
  actions: {
    label: '#',
    align: 'center',
  },
} as const

const showPrintFileDialog = (id: number) => {
  selectedFileId.value = id
  isFileDialogVisible.value = true
}

const deletePrintFile = async (id: number) => {
  if (confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
    try {
      const delResult = await api.delete(
        'Plant/' + modelObject.value.id + '/PrintFile/' + id
      )

      if (delResult && delResult.data.result) {
        notif.success('Silme işlemi başarılı.')
        await bindModel()
      } else notif.error(delResult.data.errorMessage)
    } catch (error) {
      notif.error(error)
    }
  }
}

const onFileSaved = async () => {
  await bindModel()
  selectedFileId.value = 0
  isFileDialogVisible.value = false
}

const onFileClosed = () => {
  selectedFileId.value = 0
  isFileDialogVisible.value = false
}

const showImageViewer = (fileData: any) => {
  if (fileData && fileData.imageData) {
    selectedFileImage.value = fileData.imageData
    isImageViewerVisible.value = true
  }
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
            <h3>Fabrika Tanımı</h3>
          </div>
          <div class="right">
            <div class="buttons">
              <VButton
                icon="lnir lnir-arrow-left rem-100"
                :to="{ name: 'plant' }"
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
                <h4>Fabrika bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Fabrika Kodu</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.plantCode"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete="given-name"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Fabrika Adı</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.plantName"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete="family-name"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>Açıklama</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.explanation"
                        type="text"
                        class="input"
                        placeholder=""
                        autocomplete="email"
                        inputmode="email"
                      />
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Bayi bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label>Bayi</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.dealerId"
                        :value-prop="'id'"
                        :label="'dealerName'"
                        placeholder="Bir bayi seçiniz"
                        :searchable="true"
                        :options="dealers"
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
                <h4>Logo bilgileri</h4>
                <p></p>
              </div>

              <div class="columns is-multiline">
                <div class="column is-12">
                  <VField>
                    <label></label>
                    <VControl icon="feather:terminal">
                      <input
                        type="file"
                        class="input"
                        placeholder=""
                        autocomplete=""
                        accept="image/*"
                        @change="onIconSelected"
                      />
                      <p v-if="modelObject.plantLogo && modelObject.plantLogo.length > 0">
                        <img alt="" :src="modelObject.plantLogo" width="150" />
                      </p>
                    </VControl>
                  </VField>
                </div>
              </div>
            </div>

            <!--Fieldset-->
            <!-- <div class="form-fieldset">
              <div class="fieldset-heading">
                <h4>Zimmet belgeleri</h4>
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
                      @click="showPrintFileDialog(0)"
                      >Yeni Şablon</VButton
                    >
                  </div>
                  <div class="flex-list-wrapper flex-list-v3">
                    <VPlaceholderPage
                      v-if="!filteredData || !filteredData.length"
                      title="Henüz bir şablon mevcut değil."
                      subtitle="Yeni bir şablon tanımlayın."
                      larger
                    >
                    </VPlaceholderPage>

                    <div v-else-if="filteredData.length" class="tab-content is-active">
                      <VFlexTable :data="filteredData" :columns="columns" rounded>
                        <template #body>
                          <TransitionGroup name="list" tag="div" class="flex-list-inner">
                            <div
                              v-for="item in filteredData"
                              :key="item.id"
                              class="flex-table-item"
                            >
                              <VFlexTableCell>
                                <span class="">{{ item.printFileCode }}</span>
                              </VFlexTableCell>
                              <VFlexTableCell>
                                <p v-if="item.imageData && item.imageData.length > 0">
                                  <VAvatar
                                    squared
                                    :picture="item.imageData"
                                    size="medium"
                                    style="cursor: pointer"
                                    @click="showImageViewer(item)"
                                  />
                                </p>
                              </VFlexTableCell>
                              <VFlexTableCell :columns="{ align: 'end' }">
                                <button
                                  class="button v-button has-dot dark-outlined is-warning is-pushed-mobile"
                                  @click="showPrintFileDialog(item.id)"
                                >
                                  <i aria-hidden="true" class="fas fa-edit dot"></i>
                                </button>
                                <button
                                  class="button v-button has-dot dark-outlined is-danger mx-1 is-pushed-mobile"
                                  @click="deletePrintFile(item.id)"
                                >
                                  <i aria-hidden="true" class="fas fa-trash dot"></i>
                                </button>
                              </VFlexTableCell>
                            </div>
                          </TransitionGroup>
                        </template>
                      </VFlexTable>

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
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </form>

  <EditPrintFile
    :params="{
      id: selectedFileId,
      plantId: modelObject.id,
    }"
    :visible="isFileDialogVisible"
    @file-saved="onFileSaved"
    @close="onFileClosed"
  />

  <ImageViewer
    :image-data="selectedFileImage"
    :visible="isImageViewerVisible"
    @close="isImageViewerVisible = false"
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