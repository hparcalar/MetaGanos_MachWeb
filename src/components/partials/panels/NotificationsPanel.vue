<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserSession } from '/@src/stores/userSession'
import { useDarkmode } from '/@src/stores/darkmode'
import { useApi } from '/@src/composable/useApi'
import { usePanels } from '/@src/stores/panels'
import { dateToStr, timeToStr } from '/@src/composable/useHelpers'

const darkmode = useDarkmode()
const panels = usePanels()
const api = useApi()
const userSession = useUserSession()
const { locale, t } = useI18n()

const notifications = ref([])

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

async function deleteNotification(id) {
  const postResult = await api.post('MachineNotification/SetAsDeleted/' + id)
  await getNotifications()
}

async function deleteAllNotifications() {
  if (userSession.user.PlantId != null) {
    const postResult = await api.post(
      'MachineNotification/SetAllDeleted/' + userSession.user.PlantId
    )
  }
  await getNotifications()
}

async function getNotifications() {
  try {
    if (userSession.user.PlantId != null) {
      notifications.value = (
        await api.get('MachineNotification/' + userSession.user.PlantId)
      ).data
    }
  } catch (error) {
    userSession.logoutUser()
  }
}

async function closeNotificationPanel() {
  panels.close()
  await getNotifications()
}

onMounted(async () => {
  try {
    await getNotifications()
  } catch (error) { }
})
</script>

<template>
  <div id="notifications-panel" :class="[panels.active === 'notifications' && 'is-active']"
    class="right-panel-wrapper is-notifications">
    <div class="panel-overlay" tabindex="0" @keydown.space.prevent="panels.close()" @click="closeNotificationPanel()">
    </div>

    <div class="right-panel">
      <div class="right-panel-head">
        <h3>{{ t('notification') }}</h3>
        <div style="display: flex; flex-direction: row">
          <a class="close-panel" tabindex="0" @keydown.space.prevent="panels.close()" @click="deleteAllNotifications()">
            <i aria-hidden="true" class="iconify" data-icon="feather:trash"></i>
          </a>
          <a class="close-panel" tabindex="0" @keydown.space.prevent="panels.close()" @click="closeNotificationPanel()">
            <i aria-hidden="true" class="iconify" data-icon="feather:chevron-right"></i>
          </a>
        </div>
      </div>
      <div class="right-panel-body has-slimscroll">
        <!-- Notification -->
        <div v-for="i in notifications" style="flex-direction: column !important">
          <div class="dropdown-divider"></div>
          <div class="notifications-boxes" :class="(i.isSeen != true ? 'isSeenFalse' : '',
              darkmode.isDark == true ? 'notification-boxes-dark' : '')
            ">
            <div class="notification-icon">
              <img :src="notificationSrc" alt="" style="width: 32px" />
            </div>
            <div>
              <div class="notification-top">
                <div class="notification-top-element">
                  {{ i.isSeen == false ? ' * ' : '' }}
                  {{ i.notificationTitle }}
                </div>
                <div class="notification-top-element" style="font-size: smaller !important">
                  {{ dateToStr(i.createdDate) }}
                  {{ timeToStr(i.createdDate) }}
                </div>
              </div>
              <div class="notification-bottom">
                <div class="notification-message" :class="darkmode.isDark == true ? 'notification-message-dark' : ''">
                  {{ i.notificationMessage }}
                </div>

                <div class="notification-button">
                  <button class="btn" :class="darkmode.isDark == true ? 'whiteButton' : 'darkButton'"
                    @click="deleteNotification(i.id)">
                    <i aria-hidden="true" class="iconify" :class="darkmode.isDark == true ? 'whiteButton' : 'darkButton'"
                      data-icon="feather:trash"></i>
                    <!-- <i class="fa fa-trash" ></i> -->
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../../../scss/abstracts/mixins';

.right-panel-wrapper {
  &.is-notifications {
    .right-panel-head {
      padding: 0 30px;
    }

    .right-panel-body {
      display: flex;
      flex-direction: column;

      .notifications-boxes {
        display: flex;
        margin: 15px;
        flex-direction: row;
        border-radius: 25px;
      }

      .notifications-boxes-dark {
        background-color: #333;
      }

      .notification-top {
        display: flex;
        justify-content: space-between;
        width: 250px;
        margin-top: 10px;

        .notification-top-element {
          font-weight: bold;
        }
      }

      .notification-message {
        margin-top: 10%;
        font-weight: 400;
        overflow: hidden;
        height: 40px;
        border-radius: 15px;
        padding: 5px;
        justify-content: center;
        align-items: center;
      }

      .notification-message-dark {
        background-color: #444;
      }

      .notification-button {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 10%;
      }

      .notification-bottom {
        display: flex;
        justify-content: space-between;
        width: 250px;
      }
    }

    .notification-icon {
      padding: 40px 0;
      margin-right: 15px;
      margin-left: 10px;
      height: 110px;
    }

    .whiteButton {
      color: white;
      background-color: #444;
      border-radius: 25px;
    }

    .darkButton {
      color: black;
      background-color: white;
      border-radius: 25px;
    }

    .isSeenFalse {
      background-color: #444 !important;
      border-radius: 25px !important;
    }
  }
}
</style>
