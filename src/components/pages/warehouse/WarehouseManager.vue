<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Ref } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

const api = useApi()
const { getExpression } = useUserSession()

const filters = ref('')
const reportData = ref([])
const filteredData = computed(() => {
  if (!filters.value) {
    return reportData.value
  } else {
    const filterRe = new RegExp(filters.value, 'i')

    return reportData.value.filter((item: any) => {
      return (
        item.itemCode?.match(filterRe) ||
        item.itemName?.match(filterRe) ||
        item.itemGroupName?.match(filterRe) ||
        item.itemCategoryName?.match(filterRe) ||
        item.warehouseName?.match(filterRe)
      )
    })
  }
})
const lastFilterModel: Ref<any> = ref(null)

onMounted(async () => {
  await bindModel()
})

const bindModel = async () => {
  try {
    await getReportData(null)
    await getMoveData()
  } catch (error) { }
}

const getReportData = async (filterModel: any) => {
  try {
    if (!filterModel) {
      filterModel = {
        plantId: null,
        categoryId: null,
        groupId: null,
        itemId: null,
      }
    }

    lastFilterModel.value = filterModel

    const filterPrm = {
      ...filterModel,
    }

    reportData.value = (await api.post('Warehouse/ItemStatusReport', filterPrm)).data
  } catch (error) { }
}

const exportToExcel = async () => {
  if (!lastFilterModel.value) {
    lastFilterModel.value = {
      plantId: null,
      categoryId: null,
      groupId: null,
      itemId: null,
    }
  }

  const filterPrm = {
    ...lastFilterModel.value,
  }

  const bs64Str = (await api.post('Warehouse/ExcelItemStatusReport', filterPrm)).data
  downloadFile(bs64Str)
}

const downloadFile = function (base64: any) {
  let bytes = base64ToByteArray(base64)

  let blob = new Blob([bytes], { type: 'application/octet-stream' })
  let link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)

  let fileName = 'depo_raporu.xlsx'
  link.download = fileName
  link.click()
}

const base64ToByteArray = function (base64: any) {
  let binaryString = window.atob(base64)
  let len = binaryString.length

  let bytes = new Uint8Array(len)

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

const columns = {
  itemCode: 'Stok Kodu',
  itemName: 'Stok Adı',
  warehouseName: 'Depo',
  itemCategoryName: 'Kategori',
  itemGroupName: 'Grup',
  inQuantity: 'Giriş',
  outQuantity: 'Çıkış',
  totalQuantity: 'Kalan',
} as const

const onFilterSubmit = async (filter: any) => {
  await getReportData(filter)
}

const { y } = useWindowScroll()

const isStuck = computed(() => {
  return y.value > 30
})
</script>
    
<template>
  <form class="form-layout" @submit.prevent>
    <div class="form-outer">
      <div :class="[isStuck && 'is-stuck']" class="form-header stuck-header">
        <div class="form-header-inner">
          <div class="left">
            <h3>Depo Durum Raporu</h3>
          </div>
          <div class="right"></div>
        </div>
      </div>
      <div class="form-body">
        <div>
          <WarehouseItemStatusFilter class="mb-5" @search-triggered="onFilterSubmit" />
        </div>
        <div class="list-flex-toolbar is-reversed">
          <VControl icon="feather:search">
            <input v-model="filters" class="input custom-text-filter" :placeholder="getExpression('Search')" />
          </VControl>

          <VButton color="success" icon="feather:download" raised @click="exportToExcel">
            {{ getExpression('Export') }}
          </VButton>
        </div>

        <div class="flex-list-wrapper flex-list-v3">
          <!--List Empty Search Placeholder -->
          <VPlaceholderPage v-if="!filteredData.length" :title="getExpression('AnyDataDoesntExists')" subtitle="" larger>
          </VPlaceholderPage>

          <!--Active Tab-->
          <div v-else-if="filteredData.length" class="tab-content is-active">
            <VFlexTable id="reportTable" :data="filteredData" :columns="columns" clickable compact separators>
              <template #body>
                <TransitionGroup name="list" tag="div" class="flex-list-inner">
                  <!--Table item-->
                  <div v-for="item in filteredData" :key="item" class="flex-table-item">
                    <VFlexTableCell>
                      <span class="">{{ item.itemCode }}</span>
                    </VFlexTableCell>
                    <VFlexTableCell>
                      <span class="">{{ item.itemName }}</span>
                    </VFlexTableCell>
                    <VFlexTableCell>
                      <span class="">{{ item.warehouseName }}</span>
                    </VFlexTableCell>
                    <VFlexTableCell>
                      <span class="">{{ item.itemCategoryName }}</span>
                    </VFlexTableCell>
                    <VFlexTableCell>
                      <span class="">{{ item.itemGroupName }}</span>
                    </VFlexTableCell>
                    <VFlexTableCell>
                      <span class="">{{ item.inQuantity }}</span>
                    </VFlexTableCell>
                    <VFlexTableCell>
                      <span class="">{{ item.outQuantity }}</span>
                    </VFlexTableCell>
                    <VFlexTableCell>
                      <span class="">{{ item.totalQuantity }}</span>
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
    </div>
  </form>
</template>
    
<style lang="scss">
@import '../../../scss/abstracts/mixins';

.selected-row,
.selected-row .flex-table-cell {
  background-color: #cccccc !important;
}

.is-navbar {
  .form-layout {
    margin-top: 30px;
  }
}

.form-layout {
  // max-width: 740px;
  margin: 0 auto;

  .form-outer {
    @include vuero-s-card;

    padding: 0;

    .form-header {
      padding: 12px 20px;
      border-bottom: 1px solid var(--fade-grey-dark-3);
      transition: all 0.3s; // transition-all test

      &.is-stuck {
        background: var(--white);
        padding-right: 80px;
        border-left: 1px solid var(--fade-grey-dark-3);
      }

      .form-header-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .left {
        h3 {
          font-family: var(--font-alt);
          font-size: 1.2rem;
          font-weight: 600;
          line-height: 1.3;
        }

        p {
          font-size: 0.95rem;
        }
      }
    }

    .form-body {
      padding: 20px 40px 40px;
    }
  }
}

.is-dark {
  .form-layout {
    .form-outer {
      @include vuero-card--dark;

      .form-header {
        border-color: var(--dark-sidebar-light-12);

        &.is-stuck {
          background: var(--dark-sidebar);
          border-color: var(--dark-sidebar-light-6);
        }

        .left {
          h3 {
            color: var(--dark-dark-text);
          }
        }
      }

      .form-body {
        .field {
          .control {

            .input,
            .textarea {
              &:focus {
                border-color: var(--primary);
              }
            }
          }
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .form-layout {
    .form-outer {
      .form-header {
        .form-header-inner {
          flex-direction: column;

          .left {
            text-align: center;
            margin-bottom: 12px;
          }

          .right {
            width: 100%;

            .buttons {
              display: flex;
              justify-content: space-between;
              margin: 0;

              .button {
                margin: 0;
                width: 49%;
              }
            }
          }
        }
      }
    }
  }
}
</style>