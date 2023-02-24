<script setup lang="ts">
import { ref, Ref, watch } from 'vue'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'
import type { PropType } from 'vue'

export type LoadSpiralParams = {
  itemCategoryId: number | null
  itemId: number | null
  itemName: string
  spiralNo: number | null
  activeQuantity: number | null
}

export type LoadSpiralResult = {
  approved: Boolean
  itemId: number | null
  quantity: number | null
}

const props = defineProps({
  itemCategory: {
    type: Object as PropType<LoadSpiralParams>,
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
  loadSpiral: (result: LoadSpiralResult) => true,
})

const api = useApi()
const notif = useNotyf()

const modelObject: Ref<LoadSpiralResult> = ref({
  approved: false,
  itemId: null,
  quantity: null,
})
const items = ref([])

const bindModel = async () => {
  try {
    if (props.itemCategory && props.itemCategory.itemId) {
      modelObject.value.itemId = props.itemCategory.itemId
      const itemData = (await api.get('Item/' + modelObject.value.itemId)).data
      if (itemData && itemData.itemCategoryId) {
        items.value = (
          await api.get('ItemCategory/' + itemData.itemCategoryId + '/Items')
        ).data
      }
    } else if (props.itemCategory && props.itemCategory.itemCategoryId) {
      items.value = (
        await api.get('ItemCategory/' + props.itemCategory.itemCategoryId + '/Items')
      ).data
    }
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

  emit('loadSpiral', modelObject.value)
}

watch(
  () => props.visible,
  async () => {
    if (props.visible) {
      modelObject.value = {
        approved: false,
        itemId: null,
        quantity: null,
      }
      await bindModel()
    }
  }
)

watch(
  () => props.itemCategory,
  async () => {
    await bindModel()
  },
  { deep: true }
)
</script>

<template>
  <VModal
    :open="props.visible"
    title="Makineye Stok Yükleyin"
    size="small"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <h4 class="spiral-header mt-0">
          Spiral: <b>{{ props.itemCategory.spiralNo }}</b>
        </h4>
        <h4
          v-if="
            props.itemCategory.activeQuantity && props.itemCategory.activeQuantity > 0
          "
          class="spiral-header mt-2 mb-2"
          style="background-color: var(--placeholder); color: var(--dark)"
        >
          {{ props.itemCategory.itemName }}: {{ props.itemCategory.activeQuantity }} adet
        </h4>
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
        <div class="field">
          <label>Adet *</label>
          <div class="control">
            <input v-model="modelObject.quantity" type="number" class="input" />
          </div>
        </div>
      </form>
    </template>
    <template #action>
      <VButton color="primary" raised @click="approveLoad()">Yükle</VButton>
    </template>
  </VModal>
</template>