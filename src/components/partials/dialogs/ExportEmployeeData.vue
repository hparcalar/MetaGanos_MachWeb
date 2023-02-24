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

const makeExport = async () => {
  try {
    const formData = new FormData()
    formData.append('plantId', modelObject.value.plantId.toString())
    formData.append('file', modelObject.value.selectedFile)

    const postResult = await api.get('Employee/Export/' + modelObject.value.plantId)
    if (postResult && postResult.data) {
      const bs64Str = postResult.data
      downloadFile(bs64Str)
      emit('fileSaved', true)
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const downloadFile = function (base64: any) {
  let bytes = base64ToByteArray(base64)

  let blob = new Blob([bytes], { type: 'application/octet-stream' })
  let link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)

  let fileName = 'personel_istihkak.xlsx'
  link.download = fileName
  link.click()
}

const base64ToByteArray = function (base64: any) {
  let binaryString = window.atob(base64)
  let len = binaryString.length

  let bytes = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
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
    title="Personel Dosyası Aktarma"
    size="large"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <div class="columns is-multiline">
          <div class="column is-12" style="margin-bottom: 120px">
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
      </form>
    </template>
    <template #action>
      <VButton color="primary" raised @click="makeExport()">Dışarı Aktar</VButton>
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