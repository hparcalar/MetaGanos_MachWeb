<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'

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
        item.itemCategoryCode.match(filterRe) || item.itemCategoryName.match(filterRe)
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
  } catch (error) {}
})

const columns = {
  itemCategoryCode: 'Kategori Kodu',
  itemCategoryName: 'Kategori Adı',
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
        <input
          v-model="filters"
          class="input custom-text-filter"
          placeholder="Arama..."
        />
      </VControl>

      <VButton :color="'info'" :raised="true" icon="feather:plus" @click="openDetail(0)"
        >Yeni Kategori</VButton
      >
    </div>

    <div class="flex-list-wrapper flex-list-v3">
      <!--List Empty Search Placeholder -->
      <VPlaceholderPage
        v-if="!filteredData.length"
        title="Henüz bir stok kategori tanımı mevcut değil."
        subtitle="Yeni bir stok kategorisi tanımlayın."
        larger
      >
      </VPlaceholderPage>

      <!--Active Tab-->
      <div v-else-if="filteredData.length" class="tab-content is-active">
        <VFlexTable :data="filteredData" :columns="columns" rounded>
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
                <VFlexTableCell :columns="{ align: 'end' }">
                  <button
                    class="button v-button has-dot dark-outlined is-warning is-pushed-mobile"
                    @click="openDetail(item.id)"
                  >
                    <i aria-hidden="true" class="fas fa-edit dot mr-2"></i>
                    Düzenle
                  </button>
                </VFlexTableCell>
              </div>
            </TransitionGroup>
          </template>
        </VFlexTable>

        <!--Table Pagination-->
        <VFlexPagination
          v-if="filteredData.length > 5"
          :item-per-page="10"
          :total-items="filteredData.length"
          :current-page="1"
          :max-links-displayed="10"
        />
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
