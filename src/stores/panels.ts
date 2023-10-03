/**
 * This is a store that hold left panel state
 * It could be one of the ActivePanelId
 *
 * Using useStorage from @vueuse/core allow persistance storage accross tabs/sessions
 *
 * We can import and set activePanel anywhere in our project
 * @see /src/components/partials/toolbars/Toolbar.vue
 * @see /src/components/partials/panels/ActivityPanel.vue
 */

import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useUserSession } from '/@src/stores/userSession'
import { useApi } from '/@src/composable/useApi'

const api = useApi()
const userSession = useUserSession()

const modelObject = ref({
  id: 0,
  plantId: 0,
})

export type ActivePanelId =
  | 'none'
  | 'search'
  | 'languages'
  | 'activity'
  | 'task'
  | 'notifications'

export const usePanels = defineStore('panels', () => {
  const active = useStorage<ActivePanelId>('active-panel', 'none')

  function setActive(panelId: ActivePanelId) {
    active.value = panelId
  }

  async function close() {
    if (active.value == 'notifications' && userSession.user.PlantId != null) {
      modelObject.value.plantId = userSession.user.PlantId
      const postResult = await api.post(
        'MachineNotification/SetAsSeen',
        modelObject.value
      )
      if (postResult.data.recordId == 1) {
        window.location.reload()
      }
    }
    active.value = 'none'
  }

  return {
    active,
    setActive,
    close,
  } as const
})

/**
 * Pinia supports Hot Module replacement so you can edit your stores and
 * interact with them directly in your app without reloading the page.
 *
 * @see https://pinia.esm.dev/cookbook/hot-module-replacement.html
 * @see https://vitejs.dev/guide/api-hmr.html
 */
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePanels, import.meta.hot))
}
