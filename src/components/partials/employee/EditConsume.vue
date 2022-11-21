<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { PropType, Ref } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
import Login from '/@src/pages/auth/login.vue'

export type EditConsumeParams = {
  id: number
}

const props = defineProps({
  params: {
    type: Object as PropType<EditConsumeParams>,
    required: true,
  },
})

const emit = defineEmits({
  submit: () => true,
})

const api = useApi()
const notif = useNotyf()

onMounted(async () => {
  await bindConsumeModel()
})

const modelDefaults: Ref<any> = ref({
  id: 0,
  employeeId: 0,
  itemCategoryId: props?.params?.itemCategoryId,
  itemGroupId: props?.params?.itemGroupId,
  itemId: props?.params?.itemId,
  makeDelete: 0,
  warehouseName: '',
})

const modelObject: Ref<any> = ref({ ...modelDefaults.value })

const modelIsBinding = ref(false)
const itemCategories: Ref<any[]> = ref([])
const itemGroups: Ref<any[]> = ref([])
const items: Ref<any[]> = ref([])
const confirmDialogOpen = ref(false)

const bindConsumeModel = async () => {
  modelIsBinding.value = true
  if (modelObject.value.id > 0 && modelObject.value.id != props.params.id)
    modelObject.value.id = props.params.id
  if (modelObject.value.id == 0 && props.params.id > 0)
    modelObject.value.id = props.params.id

  try {
    itemCategories.value = (await api.get('ItemCategory')).data
    modelObject.value = (await api.get('Machine/GetConsume/' + modelObject.value.id)).data
  } catch (error) {}

  await updateGroupList(modelObject.value.itemCategoryId ?? 0)
  await updateItems()
  modelIsBinding.value = false
}

const updateGroupList = async (categoryId: any) => {
  if (categoryId && categoryId > 0) {
    try {
      const relatedGroups = await api.get('ItemCategory/' + categoryId + '/Groups')
      itemGroups.value = relatedGroups.data
    } catch (error) {}
  } else itemGroups.value = []
}

const onChangeItemCategory = async (categoryId: any) => {
  modelObject.value.itemGroupId = null
  await updateGroupList(categoryId)
}

const onChangeItemGroup = async (groupId: any) => {
  modelObject.value.itemGroupId = groupId
  modelObject.value.itemId = null
  await updateItems()
}

const updateItems = async () => {
  if (modelObject.value.itemGroupId) {
    items.value = (
      await api.get('ItemGroup/' + modelObject.value.itemGroupId + '/Items')
    ).data
  } else items.value = []
}

const saveConsumeModel = async () => {
  try {
    modelObject.value.makeDelete = 0
    const postResult = (await api.post('Employee/EditConsume', modelObject.value)).data

    if (postResult && postResult.result) {
      notif.success('Kayıt başarılı')
      modelObject.value.id = postResult.recordId
      await bindConsumeModel()
      emit('submit')
    } else throw postResult ? postResult.errorMessage : 'İşlem başarısız oldu'
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const deleteConsumeModel = async () => {
  try {
    confirmDialogOpen.value = false
    modelObject.value.makeDelete = 1
    const postResult = (await api.post('Employee/EditConsume', modelObject.value)).data

    if (postResult && postResult.result) {
      notif.success('Silme işlemi başarılı')
      modelObject.value.id = postResult.recordId
      emit('submit')
    } else throw postResult ? postResult.errorMessage : 'İşlem başarısız oldu'
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const showDeleteApproval = async () => {
  confirmDialogOpen.value = true
}

/* WATCHERS */
watch(
  () => props.params.id,
  async () => {
    await bindConsumeModel()
  },
  { deep: true }
)
</script>

<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left"></div>
          <div class="right">
            <div class="buttons">
              <VButton color="info" icon="feather:save" raised @click="saveConsumeModel">
                Kaydet
              </VButton>
              <VButton
                color="danger"
                icon="feather:trash"
                raised
                @click="showDeleteApproval"
              >
                Sil
              </VButton>
            </div>
          </div>
        </div>
      </div>
      <div class="form-body p-0">
        <div class="columns is-multiline">
          <div class="column is-12">
            <!--Fieldset-->
            <div class="form-fieldset">
              <div class="columns is-multiline">
                <div class="column is-6">
                  <VField>
                    <label>Stok Kategorisi</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.itemCategoryId"
                        :value-prop="'id'"
                        :label="'itemCategoryName'"
                        placeholder="Bir kategori seçiniz"
                        :searchable="true"
                        :options="itemCategories"
                        @change="onChangeItemCategory"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Stok Grubu</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.itemGroupId"
                        :value-prop="'id'"
                        :label="'itemGroupName'"
                        placeholder="Bir grup seçiniz"
                        :searchable="true"
                        :options="itemGroups"
                        @change="onChangeItemGroup"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>Stok</label>
                    <VControl>
                      <Multiselect
                        v-model="modelObject.itemId"
                        :value-prop="'id'"
                        :label="'itemName'"
                        placeholder="Bir stok seçiniz"
                        :searchable="true"
                        :options="items"
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>Personel</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.employeeName"
                        type="text"
                        class="input"
                        readonly
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-6">
                  <VField>
                    <label>İşlem Tarihi</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.consumeDateStr"
                        type="text"
                        class="input"
                        readonly
                        placeholder=""
                        autocomplete=""
                      />
                    </VControl>
                  </VField>
                </div>
                <div class="column is-12">
                  <VField>
                    <label>Aldığı Yer</label>
                    <VControl icon="feather:terminal">
                      <input
                        v-model="modelObject.warehouseName"
                        type="text"
                        class="input"
                        readonly
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
      </div>

      <VModal
        :open="confirmDialogOpen"
        :title="'Kullanıcı Onayı'"
        size="small"
        style="height: 200px"
        actions="right"
        :cancel-label="'Vazgeç'"
        @close="confirmDialogOpen = false"
      >
        <template #content>
          <Login :is-confirmation="true" @submit="deleteConsumeModel" />
        </template>
        <template #action>
          <span />
        </template>
      </VModal>
    </div>
  </form>
</template>