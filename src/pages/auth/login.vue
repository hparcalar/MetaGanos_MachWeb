<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'

import { useDarkmode } from '/@src/stores/darkmode'
import { useUserSession } from '/@src/stores/userSession'
import { useNotyf } from '/@src/composable/useNotyf'
import { useApi } from '/@src/composable/useApi'

const isLoading = ref(false)
const darkmode = useDarkmode()
const router = useRouter()
const route = useRoute()
const notif = useNotyf()
const userSession = useUserSession()
const redirect = route.query.redirect as string
const dealersCount = ref(0)

const loginModel = ref({ Login: '', Password: '', DealerCode: '' })
const api = useApi()

const props = defineProps({
  isConfirmation: {
    type: Boolean,
    default: false,
    required: false,
  },
})

const emit = defineEmits({
  submit: () => true,
})

onMounted(async () => {
  try {
    dealersCount.value = (await api.get('Dealer/Count')).data
  } catch (error) {}
})

const handleLogin = async () => {
  if (!isLoading.value) {
    isLoading.value = true

    try {
      let loginResult: any = null

      loginResult = await api.post('User/LoginPanelUser', {
        DealerCode: loginModel.value.DealerCode,
        Login: loginModel.value.Login,
        Password: loginModel.value.Password,
      })

      if (loginResult.status === 200) {
        const postResult = loginResult.data

        if (!props.isConfirmation) {
          if (postResult.DefaultLanguage == null) postResult.DefaultLanguage = 'tr'

          userSession.setToken(postResult.Token)
          userSession.setUser({ name: postResult.Username, ...postResult })

          notif.dismissAll()
          router.push({
            name: 'app',
          })
        } else {
          emit('submit')
        }
      }
    } catch (error) {
      notif.error('Hatalı giriş')
    }

    isLoading.value = false
  }
}

useHead({
  title: 'MetaGanos Giriş',
})
</script>

<template>
  <div class="auth-wrapper-inner columns is-gapless">
    <!-- Image section (hidden on mobile) -->
    <!-- <div class="column login-column is-8 h-hidden-mobile h-hidden-tablet-p hero-banner">
      <div class="hero login-hero is-fullheight is-app-grey">
        <div class="hero-body">
          <div class="columns">
            <div class="column is-10 is-offset-1">
              <img
                class="light-image has-light-shadow has-light-border"
                src="/@src/assets/illustrations/apps/safety-bg.jpg?format=webp"
                alt=""
              />
              <img
                class="dark-image has-light-shadow"
                src="/@src/assets/illustrations/apps/safety-bg.jpg.png?format=webp"
                alt=""
              />
            </div>
          </div>
        </div>
        <div class="hero-footer">
          <p class="has-text-centered"></p>
        </div>
      </div>
    </div> -->

    <!-- Form section -->
    <div class="column">
      <div class="is-white" :class="{ 'hero is-fullheight': !isConfirmation }">
        <div class="hero-heading">
          <!-- <label
            class="dark-mode ml-auto"
            tabindex="0"
            @keydown.space.prevent="(e) => (e.target as HTMLLabelElement).click()"
          >
            <input
              type="checkbox"
              :checked="!darkmode.isDark"
              @change="darkmode.onChange"
            />
            <span></span>
          </label> -->
          <div v-if="!isConfirmation" class="auth-logo">
            <RouterLink :to="{ name: 'index' }">
              <img
                class="light-image"
                src="/@src/assets/illustrations/apps/appicon.png?format=webp"
                alt=""
              />
              <!-- <AnimatedLogo width="36px" height="36px" /> -->
            </RouterLink>
          </div>
        </div>
        <div class="hero-body">
          <div class="container">
            <div class="columns">
              <div class="column is-12">
                <div v-if="!isConfirmation" class="auth-content">
                  <h2 style="text-align: center">Otomat Yönetim Sistemi</h2>
                  <p></p>
                  <!-- <RouterLink :to="{ name: 'auth-signup' }">
                    I do not have an account yet
                  </RouterLink> -->
                </div>
                <div class="auth-form-wrapper">
                  <!-- Login Form -->
                  <form @submit.prevent="handleLogin">
                    <div class="login-form">
                      <!-- Dealer code -->
                      <VField v-show="dealersCount > 1">
                        <VControl icon="feather:user">
                          <input
                            v-model="loginModel.DealerCode"
                            class="input"
                            type="text"
                            placeholder="Bayi Kodu"
                            autocomplete="username"
                          />
                        </VControl>
                      </VField>

                      <!-- Officer code -->
                      <VField>
                        <VControl icon="feather:user">
                          <input
                            v-model="loginModel.Login"
                            class="input"
                            type="text"
                            placeholder="Kullanıcı"
                            autocomplete="username"
                          />
                        </VControl>
                      </VField>

                      <!-- Password -->
                      <VField>
                        <VControl icon="feather:lock">
                          <input
                            v-model="loginModel.Password"
                            class="input"
                            type="password"
                            placeholder="Parola"
                            autocomplete="current-password"
                          />
                        </VControl>
                      </VField>

                      <!-- Switch -->
                      <!-- <VControl class="setting-item">
                        <label for="remember-me" class="form-switch is-primary">
                          <input id="remember-me" type="checkbox" class="is-switch" />
                          <i aria-hidden="true"></i>
                        </label>
                        <div class="setting-meta">
                          <label for="remember-me">
                            <span>Beni hatırla</span>
                          </label>
                        </div>
                      </VControl> -->

                      <!-- Submit -->
                      <VControl class="login">
                        <VButton
                          :loading="isLoading"
                          color="primary"
                          type="submit"
                          bold
                          fullwidth
                          raised
                        >
                          Giriş Yap
                        </VButton>
                      </VControl>

                      <!-- <div class="forgot-link has-text-centered">
                        <a>Forgot Password?</a>
                      </div> -->
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
