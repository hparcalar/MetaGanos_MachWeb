<script setup lang="ts">
import { ref, watch } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'
import { useHelpers } from '/@src/utils/helpers'
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
  fileSaved: (result: Boolean) => true,
})

const api = useApi()
const helpers = useHelpers()
const modelObject = ref({
  printFileCode: '',
  printFileName: '',
  imageData: '',
  explanation: '',
  plantId: null,
})
const notif = useNotyf()
const plants = ref([])

const bindModel = async () => {
  try {
    plants.value = (await api.get('Plant')).data
  } catch (error) {}
}

const onIconSelected = async (event: any) => {
  //   if (event.target.files && event.target.files.length > 0) {
  //     const base64Str: string = await helpers.blobToBase64(event.target.files[0])
  //     modelObject.value.imageData = base64Str
  //   } else {
  //     modelObject.value.imageData = ''
  //   }
}

const saveModel = async () => {
  //   try {
  //     const postResult = await api.post(
  //       'Plant/' + props.params.plantId + '/PrintFile',
  //       modelObject.value
  //     )
  //     if (postResult && postResult.data.result) {
  //       notif.success('Kayıt başarılı')
  //       emit('fileSaved', true)
  //     } else notif.error(postResult.data.errorMessage)
  //   } catch (error) {
  //     notif.error(error)
  //   }
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
    title="Stok Tanım Yükleme"
    size="large"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <div class="columns is-multiline">
          <div class="column is-12">
            <h2>Şablon Yapısı</h2>
            <div class="tab-content is-active mt-5">
              <div class="flex-table is-rounded">
                <div
                  class="flex-table-header"
                  style="
                    background-color: var(--green);
                    color: #fff !important;
                    padding: 3px;
                  "
                >
                  <span
                    class="cell-center"
                    style="
                      color: #000;
                      border: 1px solid #555;
                      padding-top: 10px;
                      margin: 2px;
                    "
                    >Kodu</span
                  ><span
                    class="cell-center"
                    style="
                      color: #000;
                      border: 1px solid #555;
                      padding-top: 10px;
                      margin: 2px;
                    "
                    >Adı</span
                  ><span
                    class="cell-center"
                    style="
                      color: #000;
                      border: 1px solid #555;
                      padding-top: 10px;
                      margin: 2px;
                    "
                    >Kategorisi</span
                  ><span
                    class="cell-center"
                    style="
                      color: #000;
                      border: 1px solid #555;
                      padding-top: 10px;
                      margin: 2px;
                    "
                    >Grubu</span
                  >
                  <span
                    class="cell-center"
                    style="
                      color: #000;
                      border: 1px solid #555;
                      padding-top: 10px;
                      margin: 2px;
                    "
                    >Barkod</span
                  >
                  <span
                    class="cell-center"
                    style="
                      color: #000;
                      border: 1px solid #555;
                      padding-top: 10px;
                      margin: 2px;
                    "
                    >Birim</span
                  >
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
                  @change="onIconSelected"
                />
              </VControl>
            </VField>
          </div>
        </div>
      </form>
    </template>
    <template #action>
      <VButton color="primary" raised @click="saveModel()">Yükle</VButton>
    </template>
  </VModal>
</template>