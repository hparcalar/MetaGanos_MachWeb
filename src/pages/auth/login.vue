<script setup lang="ts">
import { ref } from 'vue'
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

const loginModel = ref({ Login: '', Password: '' })
const api = useApi()

const handleLogin = async () => {
  if (!isLoading.value) {
    isLoading.value = true

    try {
      const loginResult = await api.post('User/LoginDealer', {
        Login: loginModel.value.Login,
        Password: loginModel.value.Password,
      })

      if (loginResult.status === 200) {
        userSession.setToken(loginResult.data)
        userSession.setUser({ name: loginModel.value.Login })

        notif.dismissAll()
        router.push({
          name: 'app',
        })
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
      <div class="hero is-fullheight is-white">
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
          <div class="auth-logo">
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
                <div class="auth-content">
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
                      <!-- Username -->
                      <VField>
                        <VControl icon="feather:user">
                          <input
                            v-model="loginModel.Login"
                            class="input"
                            type="text"
                            placeholder="Username"
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
                            placeholder="Password"
                            autocomplete="current-password"
                          />
                        </VControl>
                      </VField>

                      <!-- Switch -->
                      <VControl class="setting-item">
                        <label for="remember-me" class="form-switch is-primary">
                          <input id="remember-me" type="checkbox" class="is-switch" />
                          <i aria-hidden="true"></i>
                        </label>
                        <div class="setting-meta">
                          <label for="remember-me">
                            <span>Beni hatırla</span>
                          </label>
                        </div>
                      </VControl>

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
