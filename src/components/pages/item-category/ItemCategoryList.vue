<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

const { getExpression, hasAuth } = useUserSession()
const api = useApi()
const router = useRouter()

const filters = ref('')
const cards = ref([])

const filteredData = computed(() => {
  if (!filters.value) {
    return cards.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return cards.value.filter((item) => {
      return (
        item.itemCategoryCode?.match(filterRe) || item.itemCategoryName?.match(filterRe)
      )
    })
  }
})

const openDetail = (id: number) => {
  router.push({
    name: 'item-category-slug',
    params: {
      slug: id,
    },
  })
}

onMounted(async () => {
  try {
    cards.value = (await api.get('ItemCategory')).data
  } catch (error) { }
})

const columns = {
  itemCategoryCode: getExpression('CategoryCode'),
  itemCategoryName: getExpression('CategoryName'),
  plantName: getExpression('Factory'),
  actions: {
    label: '#',
    align: 'center',
  },
} as const
</script>

<template>
  <div>
    <div class="list-flex-toolbar is-reversed">
      <VControl icon="feather:search">
        <input v-model="filters" class="input custom-text-filter" :placeholder="getExpression('Search')" />
      </VControl>

      <VButton v-if="hasAuth('ItemCategories', 'Write')" :color="'info'" :raised="true" icon="feather:plus"
        @click="openDetail(0)">{{ getExpression('NewCategory') }}</VButton>
    </div>

    <div class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage v-if="!filteredData.length" :title="getExpression('AnyDataDoesntExists')" subtitle="" larger>
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="filteredData.length" class="tab-content is-active">
        <VFlexTable :data="filteredData" :columns="columns" clickable compact separators>
          <template #body>
            <TransitionGroup name="list" tag="div" class="flex-list-inner">
              <!--Table item-->
              <div v-for="item in filteredData" :key="item.id" class="flex-table-item">
                <VFlexTableCell>
                  <span class="">{{ item.itemCategoryCode }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.itemCategoryName }}</span>
                </VFlexTableCell>
                <VFlexTableCell>
                  <span class="">{{ item.plantName }}</span>
                </VFlexTableCell>
                <VFlexTableCell :columns="{ align: 'end' }">
                  <button class="button v-button has-dot dark-outlined is-info is-pushed-mobile mx-auto"
                    @click="openDetail(item.id)">
                    <i aria-hidden="true" class="fas fa-search dot mr-0"></i>
                  </button>
                </VFlexTableCell>
              </div>
            </TransitionGroup>
          </template>
        </VFlexTable>

        <VFlex class="mt-5">
          <VCard class="p-1">
            <VSnack :title="filteredData.length + ' ' + getExpression('RecordsDisplayed')" size="small" solid
              class="mt-2 ml-2" color="info" icon="feather:info">
            </VSnack>
          </VCard>
        </VFlex>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.has-top-nav {

  .flex-list-wrapper,
  .list-flex-toolbar {
    max-width: 880px;
    margin-right: auto;
    margin-left: auto;
  }
}
</style>
