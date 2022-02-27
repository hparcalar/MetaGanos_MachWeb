import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'

export type UserData = Record<string, any> | null

export const useUserSession = defineStore('userSession', () => {
  // token, user is synced with local storage
  const strToken = localStorage.getItem('token')
  const strUser = localStorage.getItem('user')

  // @see https://vueuse.org/core/usestorage/
  const token = ref(strToken)

  const user = ref<Partial<UserData>>(strUser != null ? JSON.parse(strUser) : {})
  const loading = ref(true)

  const isLoggedIn = computed(
    () => token.value !== undefined && token.value != null && token.value !== ''
  )

  function setUser(newUser: Partial<UserData>) {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setLoading(newLoading: boolean) {
    loading.value = newLoading
  }

  async function logoutUser() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    token.value = ''
    user.value = null
  }

  return {
    user,
    token,
    isLoggedIn,
    loading,
    logoutUser,
    setUser,
    setToken,
    setLoading,
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
