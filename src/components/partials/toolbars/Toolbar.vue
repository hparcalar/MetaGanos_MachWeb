<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSession } from '/@src/stores/userSession'
import { useDarkmode } from '/@src/stores/darkmode'
import { usePanels } from '/@src/stores/panels'
import { useApi } from '/@src/composable/useApi'

const darkmode = useDarkmode()
const { locale } = useI18n()
const panels = usePanels()
const api = useApi()
const userSession = useUserSession()

var notifCount = ref(0)

const localFlagSrc = computed(() => {
  switch (locale.value) {
    case 'tr':
      return '/images/icons/flags/turkey.svg'
    case 'fr':
      return '/images/icons/flags/france.svg'
    case 'es':
      return '/images/icons/flags/spain.svg'
    case 'de':
      return '/images/icons/flags/germany.svg'
    case 'zh-CN':
      return '/images/icons/flags/china.svg'
    case 'en':
    default:
      return '/images/icons/flags/united-states-of-america.svg'
  }
})

const notificationSrc = computed(() => {
  switch (darkmode.isDark) {
    case true:
      return '/images/icons/components/notificationDark.svg'
    case false:
      return '/images/icons/components/notification.svg'
    default:
      return '/images/icons/components/notificationDark.svg'
  }
})

async function getNotifications() {
  try {
    if (userSession.user.PlantId != null) {
      var data = parseInt(
        (
          await api.get(
            'MachineNotification/NotificationCount/' + userSession.user.PlantId
          )
        ).data.notificationCount
      )
      notifCount.value = data
    }
  } catch (error) {
    console.error(error)
  }
}

onMounted(async () => {
  try {
    await getNotifications()
  } catch (error) {
    console.error(error)
  }
})
</script>

<template>
  <div class="toolbar ml-auto">
    <div class="toolbar-link">
      <label tabindex="0" class="dark-mode ml-auto"
        @keydown.space.prevent="(e) => (e.target as HTMLLabelElement).click()">
        <input type="checkbox" :checked="!darkmode.isDark" @change="darkmode.onChange" />
        <span></span>
      </label>
    </div>

    <a tabindex="0" class="toolbar-link right-panel-trigger" @keydown.space.prevent="panels.setActive('languages')"
      @click="panels.setActive('languages')">
      <img :src="localFlagSrc" alt="" />
    </a>
    <div class="image-badge-group">
      <div class="image-badge-container">
        <a tabindex="0" class="toolbar-link right-panel-trigger"
          @keydown.space.prevent="panels.setActive('notifications')" @click="panels.setActive('notifications')">
          <img :src="notificationSrc" alt="" class="image-badge-image" />
          <div v-if="notifCount > 0" class="image-badge">
            {{ notifCount }}
          </div>
        </a>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<style lang="scss">
@import '../../../scss/abstracts/mixins';

.image-badge-group {}

.image-badge-group .image-badge-container {
  display: inline-block;
  margin-left: 15px;
}

.image-badge-group .image-badge-container:first-child {
  margin-left: 0;
}

.image-badge-container {
  margin-top: 0px;
  position: relative;
}

.image-badge-image {
  font-size: 30px;
  position: relative;
}

.image-badge {
  background-color: red;
  font-size: 12px;
  color: white;
  text-align: center;
  width: 20px;
  height: 20px;
  border-radius: 35%;
  position: absolute;
  /* changed */
  top: -5px;
  /* changed */
  left: 18px;
  /* changed */
}
</style>