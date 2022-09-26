<script setup lang="ts">
import { ref, Ref, watch } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import type { PropType } from 'vue'

export type LoadWarehouseParams = {
  warehouseId: number | null
  loadType: number | null
}

export type LoadWarehouseResult = {
  approved: Boolean
  loadType: Number | null
  itemId: Number | null
  quantity: Number | null
  warehouseId: Number | null
  machineId: Number | null
}

const props = defineProps({
  params: {
    type: Object as PropType<LoadWarehouseParams>,
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
  loadWarehouse: (result: LoadWarehouseResult) => true,
})

const api = useApi()
const notif = useNotyf()

const modelObject: Ref<LoadWarehouseResult> = ref({
  approved: false,
  warehouseId: null,
  itemId: null,
  quantity: null,
  loadType: null,
  machineId: null,
})
const items = ref([])
const machines = ref([])

const bindModel = async () => {
  try {
    items.value = (await api.get('Item')).data
    machines.value = (await api.get('Machine')).data
  } catch (error) {}
}

const approveLoad = () => {
  if (!modelObject.value.itemId || modelObject.value.itemId <= 0) {
    notif.error('Bir stok seçmelisiniz.')
    return
  }

  if (modelObject.value.quantity <= 0) {
    notif.error('Yüklenecek adedi girmelisiniz.')
    return
  }

  modelObject.value.approved = true
  modelObject.value.warehouseId = props.params.warehouseId
  modelObject.value.loadType = props.params.loadType

  emit('loadWarehouse', modelObject.value)
}

watch(
  () => props.visible,
  async () => {
    if (props.visible) {
      modelObject.value = {
        approved: false,
        itemId: null,
        loadType: props.params.loadType,
        quantity: null,
        warehouseId: props.params.warehouseId,
      }
      await bindModel()
    }
  }
)
</script>
    
<template>
  <VModal
    :open="props.visible"
    :title="
      props.params && props.params.loadType == 1
        ? 'Depoya Stok Girişi'
        : 'Depodan Stok Çıkışı'
    "
    size="small"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <div class="field">
          <label>Stok *</label>
          <div class="control">
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
          </div>
        </div>
        <div v-if="props.params && props.params.loadType == 2" class="field">
          <label>Otomat *</label>
          <div class="control">
            <VControl>
              <Multiselect
                v-model="modelObject.machineId"
                :value-prop="'id'"
                :label="'machineName'"
                placeholder="Bir otomat seçiniz"
                :searchable="true"
                :options="machines"
              />
            </VControl>
          </div>
        </div>
        <div class="field">
          <label>Adet *</label>
          <div class="control">
            <input v-model="modelObject.quantity" type="number" class="input" />
          </div>
        </div>
      </form>
    </template>
    <template #action>
      <VButton color="primary" raised @click="approveLoad()">Kaydet</VButton>
    </template>
  </VModal>
</template>