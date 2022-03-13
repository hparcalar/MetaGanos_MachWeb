<script setup lang="ts">
import { useHelpers } from '/@src/utils/helpers'
const props = defineProps({
  imageData: {
    type: String,
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
})

const helpers = useHelpers()

const downloadImage = () => {
  helpers.downloadBase64File(props.imageData, 'MetaGanos.jpg')
}
</script>
<template>
  <VModal
    :open="props.visible"
    title="Resim Görüntüleyici"
    size="big"
    actions="right"
    :cancel-label="'Kapat'"
    @close="emit('close')"
  >
    <template #content>
      <div>
        <div
          v-if="props.imageData && props.imageData.length > 0"
          style="text-align: center"
        >
          <img :src="props.imageData" />
        </div>
      </div>
    </template>
    <template #action>
      <VButton color="primary" raised @click="downloadImage()">İndir</VButton>
    </template>
  </VModal>
</template>