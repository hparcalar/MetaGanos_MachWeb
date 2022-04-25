<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useNotyf } from '/@src/composable/useNotyf'

const props = defineProps({
  plantId: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits({
  cardSaved: (cardNo: string) => cardNo,
})

const api = useApi()
const notif = useNotyf()

const modelCard = ref({
  id: 0,
  cardCode: '',
  hexKey: '',
  plantId: null,
  isActive: true,
})

onMounted(async () => {
  await bindCardModel()
})

const bindCardModel = async () => {
  try {
    if (props.plantId > 0) modelCard.value.plantId = props.plantId
  } catch (error) {}
}

const saveCardModel = async () => {
  try {
    const postResult = await api.post('Card', modelCard.value)
    if (postResult.data.result) {
      notif.success('Yeni kart bilgisi oluşturuldu.')
      emit('cardSaved', modelCard.value.cardCode)
    } else notif.error(postResult.data.errorMessage)
  } catch (error: any) {
    notif.error(error?.message)
  }
}

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})

watch(
  () => props.plantId,
  async () => {
    modelCard.value.plantId = props.plantId
  }
)
</script>

<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left"></div>
          <div class="right">
            <div class="buttons">
              <VButton color="primary" icon="feather:save" raised @click="saveCardModel">
                Kaydet
              </VButton>
            </div>
          </div>
        </div>
      </div>
      <div class="form-body">
        <!--Fieldset-->
        <div class="form-fieldset">
          <div class="columns is-multiline">
            <div class="column is-12">
              <VField>
                <label>Kart No</label>
                <VControl icon="feather:terminal">
                  <input
                    v-model="modelCard.cardCode"
                    type="text"
                    class="input"
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
  </form>
</template>