<script setup lang=ts>
import { ref, onMounted } from 'vue'
import { useUserSession } from '/@src/stores/userSession'
import { useRouter } from 'vue-router'

const props = defineProps({
  isUp: {
    type: Boolean,
    default: false,
  },
})
const router = useRouter()

const userSession = useUserSession()
const userData = ref()

onMounted(() => {
  userData.value = userSession.user
})

const doLogout = () => {
  userSession.logoutUser()
  router.push({
    name: 'auth',
  })
}
</script>
<template>
  <VDropdown
    right
    spaced
    class="user-dropdown profile-dropdown"
    :class="{ 'is-up': props.isUp }"
  >
    <template #button="{ toggle }">
      <a
        tabindex="0"
        class="is-trigger dropdown-trigger"
        aria-haspopup="true"
        @keydown.space.prevent="toggle"
        @click="toggle"
      >
        <VAvatar picture="/images/avatars/placeholder.jpg" />
      </a>
    </template>

    <template #content>
      <div class="dropdown-head">
        <VAvatar size="large" picture="/images/avatars/placeholder.jpg" />

        <div class="meta">
          <span>{{ userData?.name }}</span>
          <span>{{ userData?.AuthType == 'Dealer' ? 'Bayi' : 'Fabrika Yetkilisi' }}</span>
        </div>
      </div>

      <!-- <a href="#" role="menuitem" class="dropdown-item is-media">
        <div class="icon">
          <i aria-hidden="true" class="lnil lnil-user-alt"></i>
        </div>
        <div class="meta">
          <span>Profil</span>
          <span>Ayarlarınızı değiştirin</span>
        </div>
      </a>

      <hr class="dropdown-divider" />

      <a href="#" role="menuitem" class="dropdown-item is-media">
        <div class="icon">
          <i aria-hidden="true" class="lnil lnil-briefcase"></i>
        </div>
        <div class="meta">
          <span>Projects</span>
          <span>All my projects</span>
        </div>
      </a> -->

      <!-- <a href="#" role="menuitem" class="dropdown-item is-media">
        <div class="icon">
          <i aria-hidden="true" class="lnil lnil-users-alt"></i>
        </div>
        <div class="meta">
          <span>Team</span>
          <span>Manage your team</span>
        </div>
      </a>

      <hr class="dropdown-divider" /> -->

      <a href="#" role="menuitem" class="dropdown-item is-media">
        <div class="icon">
          <i aria-hidden="true" class="lnil lnil-cog"></i>
        </div>
        <div class="meta">
          <span>Ayarlar</span>
          <span>Hesap ayarları</span>
        </div>
      </a>

      <hr class="dropdown-divider" />

      <div class="dropdown-item is-button">
        <VButton
          class="logout-button"
          icon="feather:log-out"
          color="primary"
          role="menuitem"
          raised
          fullwidth
          @click="doLogout"
        >
          Çıkış Yap
        </VButton>
      </div>
    </template>
  </VDropdown>
</template>
