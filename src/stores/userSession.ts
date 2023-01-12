import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { routerKey } from 'vue-router'

export type UserData = Record<string, any> | null

export const useUserSession = defineStore('userSession', () => {
  // token, user is synced with local storage
  let strToken = localStorage.getItem('token')
  const strUser = localStorage.getItem('user')
  const strDict = localStorage.getItem('dict')

  // @see https://vueuse.org/core/usestorage/
  const token = ref(strToken)

  const user = ref<Partial<UserData>>(strUser != null ? JSON.parse(strUser) : {})
  const loading = ref(true)

  const isLoggedIn = computed(
    () => token.value !== undefined && token.value != null && token.value !== ''
  )

  const getLocale = computed(() => {
    if (user.value && user.value.languageCode) return user.value.languageCode
    return ''
  })

  let memoryDict: any[] = []
  const getDict = computed(() => {
    if (memoryDict.length == 0) {
      if (strDict && strDict.length > 0) memoryDict = JSON.parse(strDict)
      else memoryDict = []
    }

    return memoryDict
  })

  const isDealer = computed(
    () => user.value && user.value.AuthType && user.value.AuthType == 'Dealer'
  )
  const isOfficer = computed(
    () => user.value && user.value.AuthType && user.value.AuthType == 'FactoryOfficer'
  )

  const getExpression = (expression: string) => {
    if (getDict.value && getDict.value.length > 0) {
      const dictItem = getDict.value.find((d) => d.expression == expression)
      if (dictItem && dictItem.equalResponse) return dictItem.equalResponse
    }

    return expression
  }

  async function setUser(newUser: Partial<UserData>) {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
    if (user.value && user.value.DefaultLanguage && user.value.DefaultLanguage.length > 0)
      setLanguage(user.value.DefaultLanguage)
    if (user.value && user.value.AuthType && user.value.AuthType === 'FactoryOfficer') {
      try {
        const api = useApi()
        const plantInfo = (await api.get('Plant/' + user.value.FactoryId)).data
        if (plantInfo) user.value.PlantName = plantInfo.plantName

        const officerData = (await api.get('Officer/' + user.value.UserId)).data
        if (officerData && officerData.authUnits)
          user.value.authUnits = officerData.authUnits
      } catch (error) {}
    }
  }

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  async function setLanguage(languageCode: string, autoRefresh: boolean = true) {
    if (user.value) {
      let needsRefresh: boolean = false
      try {
        if (languageCode != user.value.languageCode) needsRefresh = true

        user.value.languageCode = languageCode
        const api = useApi()
        const langData = (await api.get('Language/Find/' + languageCode)).data
        if (langData && langData.id) {
          const dictData = (await api.get('Language/' + langData.id + '/Dict')).data
          if (dictData && dictData.length > 0) {
            memoryDict = dictData
            localStorage.setItem('dict', JSON.stringify(memoryDict))
          }

          await api.post('User/SetLanguage', {
            authType: user.value.AuthType,
            userId: user.value.UserId,
            languageCode: languageCode,
          })
        }
      } catch (error) {}

      localStorage.setItem('user', JSON.stringify(user.value))
      if (needsRefresh && autoRefresh) window.location.reload()
    }
  }

  function setLoading(newLoading: boolean) {
    loading.value = newLoading
  }

  async function logoutUser() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('dict')
    token.value = ''
    user.value = null
    window.location.reload()
  }

  async function checkToken() {
    // check token is alive
    if (strToken !== undefined && strToken != null && strToken !== '') {
      strToken = localStorage.getItem('token')
      token.value = strToken
      const api = useApi()

      try {
        const tokenResp = await api.get('User/CheckToken')
        if (tokenResp.status == 401) {
          logoutUser()
        }
      } catch (error) {
        logoutUser()
      }
    } else {
      logoutUser()
    }
  }

  const hasAuth = (section: string, actionType: string) => {
    try {
      if (user.value && user.value.AuthType == 'Dealer') return true

      if (user.value && user.value.AuthType == 'FactoryOfficer') {
        if (
          user.value.authUnits &&
          user.value.authUnits.some(
            (d: any) =>
              d.section == section &&
              ((actionType == 'Read' && d.canRead == true) ||
                (actionType == 'Write' && d.canWrite == true) ||
                (actionType == 'Delete' && d.canDelete == true))
          )
        )
          return true
      }
    } catch (error) {}

    return false
  }

  if (user.value && user.value.languageCode && user.value.languageCode.length > 0)
    setLanguage(user.value.languageCode)

  return {
    user,
    token,
    isLoggedIn,
    loading,
    logoutUser,
    setUser,
    setToken,
    setLoading,
    checkToken,
    getExpression,
    setLanguage,
    getLocale,
    isDealer,
    isOfficer,
    hasAuth,
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
  import.meta.hot.accept(acceptHMRUpdate(useUserSession, import.meta.hot))
}
