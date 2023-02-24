<script setup lang="ts">
import { ref, Ref, watch } from 'vue'
import { useNotyf } from '/@src/composable/useNotyf'
import type { PropType } from 'vue'

export type EditEmployeeCreditParams = {
  itemCategoryName: string
  quantity: number | null
}

export type LoadCreditResult = {
  approved: Boolean
  quantity: number | null
}

const props = defineProps({
  creditParams: {
    type: Object as PropType<EditEmployeeCreditParams>,
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
  laodCredit: (result: LoadCreditResult) => true,
})

const notif = useNotyf()

const modelObject: Ref<LoadCreditResult> = ref({
  approved: false,
  quantity: null,
})

const approveLoad = () => {
  if ((modelObject.value.quantity ?? 0) <= 0) {
    notif.error('Güncellenecek kredi bilgisini girmelisiniz.')
    return
  }

  modelObject.value.approved = true

  emit('laodCredit', modelObject.value)
}

watch(
  () => props.visible,
  async () => {
    if (props.visible) {
      modelObject.value = {
        approved: false,
        quantity: props.creditParams.quantity,
      }
    }
  }
)
</script>

<template>
  <VModal
    :open="props.visible"
    title="Personel Kredi Düzenleme"
    size="small"
    actions="right"
    :cancel-label="'Vazgeç'"
    @close="emit('close')"
  >
    <template #content>
      <form class="modal-form py-0">
        <h4 class="spiral-header mt-0">
          Kategori: <b>{{ props.creditParams.itemCategoryName }}</b>
        </h4>
        <div class="field">
          <label>Adet *</label>
          <div class="control">
            <input v-model="modelObject.quantity" type="number" class="input" />
          </div>
        </div>
      </form>
    </template>
    <template #action>
      <VButton color="primary" raised @click="approveLoad()">Güncelle</VButton>
    </template>
  </VModal>
</template>