<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { useHelpers } from '/@src/utils/helpers'
import { useUserSession } from '/@src/stores/userSession'
import type { PropType } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false,
  },
})

const emit = defineEmits({
  close: () => true,
  fileSaved: (result: Boolean) => result,
})

const userSession = useUserSession()
const { isDealer, hasAuth } = userSession

const api = useApi()
const helpers = useHelpers()
const modelObject = ref({
  printFileCode: '',
  printFileName: '',
  imageData: '',
  explanation: '',
  plantId: null,
  selectedFile: null,
})
const notif = useNotyf()
const plants = ref([])

const bindModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data

    if (!modelObject.value.plantId && plants.value.length == 1)
      modelObject.value.plantId = plants.value[0].id
    else if (!modelObject.value.plantId || modelObject.value.plantId == 0)
      modelObject.value.plantId = userSession.user.FactoryId

    if (!isDealer)
      plants.value = plants.value.filter((d) => d.id == modelObject.value.plantId)
  } catch (error) {}
}

const onFileSelected = async (event: any) => {
  if (event.target.files && event.target.files.length > 0) {
    modelObject.value.selectedFile = event.target.files[0]
  }
}

const makeUpload = async () => {
  try {
    const formData = new FormData()
    formData.append('plantId', modelObject.value.plantId.toString())
    formData.append('file', modelObject.value.selectedFile)

    const postResult = await api.post('Employee/Upload', formData)
    if (postResult && postResult.data.result) {
      notif.success('Transfer başarıyla gerçekleştirildi: ' + postResult.data.infoMessage)
      emit('fileSaved', true)
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

watch(
  () => props.visible,
  async () => {
    if (props.visible) {
      await bindModel()
    }
  }
)
</script>

<template>
  <VModal
    :open="props.visible"
    title="Personel Dosyası Yükleme"
    size="large"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <div class="columns is-multiline">
          <div class="column is-12">
            <VMessage color="info">
              <i class="iconify" data-icon="feather:info" aria-hidden="true"></i>
              <span class="ml-2"
                >Transfer formatı aşağıdaki sütun sıralamaları ile olmalıdır.</span
              >
            </VMessage>
            <div class="tab-content is-active mt-5">
              <div class="flex-table is-rounded">
                <div
                  class="flex-table-header is-rounded"
                  style="
                    background-color: var(--green);
                    color: #fff !important;
                    padding: 3px;
                  "
                >
                  <span class="cell-center transfer-template-heading">Kodu</span
                  ><span class="cell-center transfer-template-heading">Adı</span
                  ><span class="cell-center transfer-template-heading">Departman</span
                  ><span class="cell-center transfer-template-heading">Kart No</span>
                  <span class="cell-center transfer-template-heading"
                    >İstihkak (Stok kodu ile)</span
                  >
                  <!-- <span class="cell-center transfer-template-heading">Gsm</span>
                  <span class="cell-center transfer-template-heading">E-Posta</span> -->
                </div>
              </div>
              <!--Table Pagination--><!--v-if-->
            </div>
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
              <label>Excel Dosyası</label>
              <VControl icon="feather:terminal">
                <input
                  type="file"
                  class="input"
                  placeholder=""
                  autocomplete=""
                  @change="onFileSelected"
                />
              </VControl>
            </VField>
          </div>
        </div>
      </form>
    </template>
    <template #action>
      <VButton color="primary" raised @click="makeUpload()">Yükle</VButton>
    </template>
  </VModal>
</template>
<style lang="scss">
.transfer-template-heading {
  color: #037003 !important;
  border: 1px solid green;
  padding-top: 10px !important;
  margin: 2px !important;
  border-radius: 5px;
}
</style>