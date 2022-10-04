<script setup lang="ts">
import { ref, watchPostEffect, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserSession } from '/@src/stores/userSession'
import type { SidebarTheme } from '/@src/components/navigation/desktop/Sidebar.vue'
import { useViewWrapper } from '/@src/stores/viewWrapper'

const props = withDefaults(
  defineProps<{
    theme?: SidebarTheme
    defaultSidebar?: string
    closeOnChange?: boolean
    openOnMounted?: boolean
    nowrap?: boolean
  }>(),
  {
    defaultSidebar: 'dashboard',
    theme: 'default',
  }
)

const { checkToken, getExpression } = useUserSession()
onMounted(async () => {
  await checkToken()
})

const viewWrapper = useViewWrapper()
const route = useRoute()
const isMobileSidebarOpen = ref(false)
const isDesktopSidebarOpen = ref(props.openOnMounted)
const activeMobileSubsidebar = ref(props.defaultSidebar)

function switchSidebar(id: string) {
  if (id === activeMobileSubsidebar.value) {
    isDesktopSidebarOpen.value = !isDesktopSidebarOpen.value
  } else {
    isDesktopSidebarOpen.value = true
    activeMobileSubsidebar.value = id
  }
}

/**
 * watchPostEffect callback will be executed each time dependent reactive values has changed
 */
watchPostEffect(() => {
  viewWrapper.setPushed(isDesktopSidebarOpen.value ?? false)
})
watch(
  () => route.fullPath,
  () => {
    isMobileSidebarOpen.value = false

    if (props.closeOnChange && isDesktopSidebarOpen.value) {
      isDesktopSidebarOpen.value = false
    }
  }
)
</script>

<template>
  <div class="sidebar-layout">
    <div class="app-overlay"></div>

    <!-- Mobile navigation -->
    <MobileNavbar
      :is-open="isMobileSidebarOpen"
      @toggle="isMobileSidebarOpen = !isMobileSidebarOpen"
    >
      <template #brand>
        <RouterLink :to="{ name: 'app' }" class="navbar-item is-brand">
          <!-- <AnimatedLogo width="38px" height="38px" /> -->
          <img
            class="light-image"
            src="/@src/assets/illustrations/apps/appicon.png?format=webp"
            alt=""
          />
        </RouterLink>

        <div class="brand-end">
          <!-- <NotificationsMobileDropdown /> -->
          <UserProfileDropdown />
        </div>
      </template>
    </MobileNavbar>

    <!-- Mobile sidebar links -->
    <MobileSidebar
      :is-open="isMobileSidebarOpen"
      @toggle="isMobileSidebarOpen = !isMobileSidebarOpen"
    >
      <template #links>
        <li>
          <RouterLink :to="{ name: 'app' }">
            <i aria-hidden="true" class="iconify" data-icon="feather:box"></i>
          </RouterLink>
        </li>
        <li>
          <a
            :class="[activeMobileSubsidebar === 'movements' && 'is-active']"
            data-content="Hareketler"
            tabindex="0"
            @keydown.space.prevent="switchSidebar('movements')"
            @click="switchSidebar('movements')"
          >
            <i
              aria-hidden="true"
              class="iconify sidebar-svg"
              data-icon="feather:sliders"
            ></i>
          </a>
        </li>
      </template>

      <template #bottom-links>
        <li>
          <a href="#">
            <i aria-hidden="true" class="iconify" data-icon="feather:settings"></i>
          </a>
        </li>
      </template>
    </MobileSidebar>

    <!-- Mobile subsidebar links -->
    <Transition name="slide-x">
      <DefinitionsMobileSubsidebar
        v-if="isMobileSidebarOpen && activeMobileSubsidebar === 'dashboard'"
      />
    </Transition>

    <Transition name="slide-x">
      <MovementsMobileSubsidebar
        v-if="isMobileSidebarOpen && activeMobileSubsidebar === 'movements'"
      />
    </Transition>

    <Transition name="slide-x">
      <ReportsMobileSubsidebar
        v-if="isMobileSidebarOpen && activeMobileSubsidebar === 'reports'"
      />
    </Transition>

    <Sidebar :theme="props.theme" :is-open="isDesktopSidebarOpen">
      <template #links>
        <!-- Dashboards -->
        <li>
          <a
            :class="[activeMobileSubsidebar === 'dashboard' && 'is-active']"
            data-content="Tanımlar"
            tabindex="0"
            @keydown.space.prevent="switchSidebar('dashboard')"
            @click="switchSidebar('dashboard')"
          >
            <i aria-hidden="true" class="iconify sidebar-svg" data-icon="feather:box"></i>
            <p>{{ getExpression('Definitions') }}</p>
          </a>
        </li>
        <li>
          <a
            :class="[activeMobileSubsidebar === 'movements' && 'is-active']"
            data-content="Hareketler"
            tabindex="0"
            @keydown.space.prevent="switchSidebar('movements')"
            @click="switchSidebar('movements')"
          >
            <i
              aria-hidden="true"
              class="iconify sidebar-svg"
              data-icon="feather:sliders"
            ></i>
            <p>{{ getExpression('Actions') }}</p>
          </a>
        </li>
        <li>
          <a
            :class="[activeMobileSubsidebar === 'reports' && 'is-active']"
            data-content="Raporlar"
            tabindex="0"
            @keydown.space.prevent="switchSidebar('reports')"
            @click="switchSidebar('reports')"
          >
            <i
              aria-hidden="true"
              class="iconify sidebar-svg"
              data-icon="feather:pie-chart"
            ></i>
            <p>Raporlar</p>
          </a>
        </li>
        <!-- <li>
          <a
            :class="[activeMobileSubsidebar === 'warehouse' && 'is-active']"
            data-content="Depo Yönetimi"
            tabindex="0"
            @keydown.space.prevent="switchSidebar('warehouse')"
            @click="switchSidebar('warehouse')"
          >
            <i
              aria-hidden="true"
              class="iconify sidebar-svg"
              data-icon="feather:archive"
            ></i>
            <p>Depo</p>
          </a>
        </li> -->
      </template>
    </Sidebar>

    <Transition name="slide-x">
      <DefinitionsSubsidebar
        v-if="isDesktopSidebarOpen && activeMobileSubsidebar === 'dashboard'"
        @close="isDesktopSidebarOpen = false"
      />
    </Transition>

    <Transition name="slide-x">
      <MovementsSubsidebar
        v-if="isDesktopSidebarOpen && activeMobileSubsidebar === 'movements'"
        @close="isDesktopSidebarOpen = false"
      />
    </Transition>

    <Transition name="slide-x">
      <ReportsSubsidebar
        v-if="isDesktopSidebarOpen && activeMobileSubsidebar === 'reports'"
        @close="isDesktopSidebarOpen = false"
      />
    </Transition>

    <!-- <Transition name="slide-x">
      <WarehouseSubsidebar
        v-if="isDesktopSidebarOpen && activeMobileSubsidebar === 'warehouse'"
        @close="isDesktopSidebarOpen = false"
      />
    </Transition> -->

    <LanguagesPanel />

    <VViewWrapper>
      <VPageContentWrapper>
        <template v-if="props.nowrap">
          <slot></slot>
        </template>
        <VPageContent v-else class="is-relative">
          <div class="page-title has-text-centered">
            <!-- Sidebar Trigger -->
            <div
              class="vuero-hamburger nav-trigger push-resize"
              tabindex="0"
              @keydown.space.prevent="isDesktopSidebarOpen = !isDesktopSidebarOpen"
              @click="isDesktopSidebarOpen = !isDesktopSidebarOpen"
            >
              <span class="menu-toggle has-chevron">
                <span :class="[isDesktopSidebarOpen && 'active']" class="icon-box-toggle">
                  <span class="rotate">
                    <i aria-hidden="true" class="icon-line-top"></i>
                    <i aria-hidden="true" class="icon-line-center"></i>
                    <i aria-hidden="true" class="icon-line-bottom"></i>
                  </span>
                </span>
              </span>
            </div>

            <div class="title-wrap">
              <h1 class="title is-4">{{ viewWrapper.pageTitle }}</h1>
            </div>

            <Toolbar class="desktop-toolbar" />
          </div>

          <slot></slot>
        </VPageContent>
      </VPageContentWrapper>
    </VViewWrapper>
  </div>
</template>