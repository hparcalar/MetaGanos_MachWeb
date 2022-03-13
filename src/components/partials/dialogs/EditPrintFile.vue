<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { useHelpers } from '/@src/utils/helpers'
import type { PropType } from 'vue'

export type EditPrintFileParams = {
  id: number | null
  plantId: number | null
}

const props = defineProps({
  params: {
    type: Object as PropType<EditPrintFileParams>,
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
  fileSaved: (result: Boolean) => true,
})

const api = useApi()
const helpers = useHelpers()
const modelObject = ref({
  printFileCode: '',
  printFileName: '',
  imageData: '',
  explanation: '',
})
const notif = useNotyf()

const bindModel = async () => {
  try {
    const dataResult = await api.get(
      'Plant/' + props.params.plantId + '/PrintFile/' + props.params.id
    )
    if (dataResult && dataResult.data) {
      modelObject.value = dataResult.data
    } else {
      modelObject.value = {
        printFileCode: '',
        printFileName: '',
        imageData: '',
        explanation: '',
      }
    }
  } catch (error) {}
}

const onIconSelected = async (event: any) => {
  if (event.target.files && event.target.files.length > 0) {
    const base64Str: string = await helpers.blobToBase64(event.target.files[0])
    modelObject.value.imageData = base64Str
  } else {
    modelObject.value.imageData = ''
  }
}

const saveModel = async () => {
  try {
    const postResult = await api.post(
      'Plant/' + props.params.plantId + '/PrintFile',
      modelObject.value
    )

    if (postResult && postResult.data.result) {
      notif.success('Kayıt başarılı')
      emit('fileSaved', true)
    } else notif.error(postResult.data.errorMessage)
  } catch (error) {
    notif.error(error)
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
    title="Şablon Düzenleme"
    size="small"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <div class="columns is-multiline">
          <div class="column is-12">
            <VField>
              <label>Şablon Kodu</label>
              <VControl icon="feather:terminal">
                <input
                  v-model="modelObject.printFileCode"
                  type="text"
                  class="input"
                  placeholder=""
                  autocomplete="given-name"
                />
              </VControl>
            </VField>
          </div>
          <div class="column is-12">
            <VField>
              <label>Şablon Adı</label>
              <VControl icon="feather:terminal">
                <input
                  v-model="modelObject.printFileName"
                  type="text"
                  class="input"
                  placeholder=""
                  autocomplete="given-name"
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
                  autocomplete="given-name"
                />
              </VControl>
            </VField>
          </div>
          <div class="column is-12">
            <VField>
              <label>Şablon Resmi</label>
              <VControl icon="feather:terminal">
                <input
                  type="file"
                  class="input"
                  placeholder=""
                  autocomplete=""
                  accept="image/*"
                  @change="onIconSelected"
                />
                <p
                  v-if="modelObject.imageData && modelObject.imageData.length > 0"
                  class="mt-2"
                  style="text-align: center"
                >
                  <VAvatar squared :picture="modelObject.imageData" size="xl" />
                </p>
              </VControl>
            </VField>
          </div>
        </div>
      </form>
    </template>
    <template #action>
      <VButton color="primary" raised @click="saveModel()">Kaydet</VButton>
    </template>
  </VModal>
</template>