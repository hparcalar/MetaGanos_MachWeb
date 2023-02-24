<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { dateToStr } from '/@src/composable/useHelpers'
import type { PropType } from 'vue'

export type PlantFileProcessParams = {
  employeeId: number | null
}

export type PlantFileProcessResult = {
  approved: Boolean
}

const props = defineProps({
  params: {
    type: Object as PropType<PlantFileProcessParams>,
    required: true,
  },
  visible: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const emit = defineEmits({
  close: () => true,
  processed: (result: PlantFileProcessResult) => true,
})

const api = useApi()

onMounted(async () => {
  await bindList()
})

const bindList = async () => {
  try {
    dataList.value = (
      await api.get('Employee/' + props.params.employeeId + '/FileProcess')
    ).data

    const employeeData = (await api.get('Employee/' + props.params.employeeId)).data
    if (employeeData && employeeData.id > 0) {
      const data = (await api.get('Plant/' + employeeData.plantId + '/PrintFiles')).data
      if (data) {
        printFileList.value = data
      }
    }
  } catch (error) {}
}

const bindFileModel = async (fileProcessId: number) => {
  try {
    if (fileProcessId > 0) {
      fileModel.value = (
        await api.get(
          'Employee/' + props.params.employeeId + '/FileProcess/' + fileProcessId
        )
      ).data
    } else
      fileModel.value = {
        id: 0,
        explanation: '',
        plantPrintFileId: null,
        employeeId: props.params.employeeId,
        departmentId: null,
        processStatus: 1,
      }
  } catch (error) {}

  selectedTabPage.value = 'edit'
}

const saveFileModel = async () => {
  try {
    const postResult = (await api.post('Employee/SaveFileProcess', fileModel.value)).data
    if (postResult.result) {
      notif.success('Kayıt başarılı')
      await bindFileModel(postResult.recordId)
      await bindList()
    } else throw postResult.errorMessage
  } catch (error) {
    notif.error(error.message)
  }
}

const notif = useNotyf()

const modelObject: Ref<PlantFileProcessResult> = ref({
  approved: false,
})
const fileModel: Ref<any> = ref({
  id: 0,
  explanation: '',
  plantPrintFileId: null,
  employeeId: props.params.employeeId,
  departmentId: null,
  processStatus: 1,
})
const selectedTabPage: Ref<string> = ref('history')
const dataList: Ref<any[]> = ref([])
const printFileList: Ref<any[]> = ref([])
const approveStatusList: Ref<any[]> = ref([
  { id: 1, name: 'Onay Bekliyor' },
  { id: 2, name: 'Onaylandı' },
  { id: 3, name: 'Sonlandırıldı' },
])

const selectedFileImage: Ref<string> = ref('')
const isImageViewerVisible: Ref<boolean> = ref(false)
const showImageDialog = () => {
  const fileImage = printFileList.value.find(
    (d) => d.id === fileModel.value.plantPrintFileId
  ).imageData
  selectedFileImage.value = fileImage
  isImageViewerVisible.value = true
}

const columns = {
  createdDate: 'Tarih',
  printFileName: 'Dosya',
  departmentName: 'Departman',
  processStatusText: 'Durum',
  approvedDate: 'Onay Tarihi',
  actions: {
    label: '#',
    align: 'center',
  },
} as const

const approve = () => {
  modelObject.value.approved = true

  emit('processed', modelObject.value)
}

const onTabPageChanged = (value: string) => {
  selectedTabPage.value = value
}

watch(
  () => props.visible,
  async () => {
    if (props.visible) {
      modelObject.value = {
        approved: false,
      }
      selectedTabPage.value = 'history'
      await bindList()
    }
  }
)
</script>

<template>
  <VModal
    :open="props.visible"
    title="Zimmet Belgesi Düzenleme"
    size="big"
    actions="right"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <VTabs
          :selected="selectedTabPage"
          :tabs="[
            { label: 'Zimmet Geçmişi', value: 'history' },
            { label: 'Zimmet Düzenle', value: 'edit' },
          ]"
          @active-value-changed="onTabPageChanged"
        >
          <template #tab="{ activeValue }">
            <div v-if="activeValue === 'history'">
              <VFlexTable :data="dataList" :columns="columns" rounded>
                <template #body>
                  <TransitionGroup name="list" tag="div" class="flex-list-inner">
                    <!--Table item-->
                    <div v-for="item in dataList" :key="item.id" class="flex-table-item">
                      <VFlexTableCell>
                        <span class="">{{ dateToStr(item.createdDate) }}</span>
                      </VFlexTableCell>
                      <VFlexTableCell>
                        <span class="">{{ item.printFileName }}</span>
                      </VFlexTableCell>
                      <VFlexTableCell>
                        <span class="">{{ item.departmentName }}</span>
                      </VFlexTableCell>
                      <VFlexTableCell>
                        <span class="">{{ item.processStatusText }}</span>
                      </VFlexTableCell>
                      <VFlexTableCell>
                        <span class="">{{ dateToStr(item.approvedDate) }}</span>
                      </VFlexTableCell>
                      <VFlexTableCell :columns="{ align: 'end' }">
                        <button
                          type="button"
                          class="button v-button has-dot dark-outlined is-warning is-pushed-mobile"
                          @click="bindFileModel(item.id)"
                        >
                          <i aria-hidden="true" class="fas fa-edit dot mr-2"></i>
                        </button>
                      </VFlexTableCell>
                    </div>
                  </TransitionGroup>
                </template>
              </VFlexTable>

              <!--Table Pagination-->
              <VFlexPagination
                v-if="dataList.length > 5"
                :item-per-page="10"
                :total-items="dataList.length"
                :current-page="1"
                :max-links-displayed="10"
              />
            </div>
            <div v-else-if="activeValue === 'edit'">
              <div class="form-body">
                <div class="columns is-multiline">
                  <div class="column is-12">
                    <VField>
                      <label>Açıklama</label>
                      <VControl icon="feather:terminal">
                        <input
                          v-model="fileModel.explanation"
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
                      <label>Zimmet Dosyası</label>
                      <VControl>
                        <Multiselect
                          v-model="fileModel.plantPrintFileId"
                          :value-prop="'id'"
                          :label="'printFileName'"
                          placeholder="Bir dosya seçiniz"
                          :searchable="true"
                          :options="printFileList"
                        />
                      </VControl>
                    </VField>
                  </div>
                  <div class="column is-12">
                    <VField>
                      <label>Onay Durumu</label>
                      <VControl>
                        <VControl>
                          <Multiselect
                            v-model="fileModel.processStatus"
                            :value-prop="'id'"
                            :label="'name'"
                            placeholder="Bir durum seçiniz"
                            :searchable="true"
                            :options="approveStatusList"
                          />
                        </VControl>
                      </VControl>
                    </VField>
                  </div>
                  <div class="column is-12 mt-5">
                    <div class="right">
                      <div class="buttons">
                        <VButton
                          icon="lnir lnir-arrow-left rem-100"
                          light
                          dark-outlined
                          @click="selectedTabPage = 'history'"
                        >
                          Liste
                        </VButton>
                        <VButton
                          icon="feather:printer"
                          color="info"
                          dark-outlined
                          @click="showImageDialog"
                        >
                          Belge
                        </VButton>
                        <VButton
                          color="primary"
                          icon="feather:save"
                          raised
                          @click="saveFileModel"
                        >
                          Kaydet
                        </VButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </VTabs>
      </form>
    </template>
    <template #action>
      <VButton color="info" icon="feather:plus-circle" raised @click="bindFileModel(0)"
        >Yeni</VButton
      >
      <VButton color="primary" raised @click="approve()">Kapat</VButton>
    </template>
    <template #cancel>
      <span style="display: none" />
    </template>
  </VModal>

  <ImageViewer
    :image-data="selectedFileImage"
    :visible="isImageViewerVisible"
    @close="isImageViewerVisible = false"
  />
</template>