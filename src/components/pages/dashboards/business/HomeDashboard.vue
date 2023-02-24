<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'
import ApexChart from 'vue3-apexcharts'

const router = useRouter()
const api = useApi()
const userSession = useUserSession()
const { getExpression } = useUserSession()
const userData: Ref<any> = ref({})
const { isDealer, isOfficer, hasAuth } = userSession

const totals = ref({
  plantCount: 0,
  machineCount: 0,
  departmentCount: 0,
  employeeCount: 0,
  officerCount: 0,
  itemCount: 0,
})
const overallStats = ref({})

const plants: Ref<any[]> = ref([])
const selectedPlants: Ref<any[]> = ref(null)
const isStatsLoading = ref(false)

const series = ref([])

const barOptions = ref({
  chart: {
    height: 250,
    type: 'bar',
    toolbar: {
      show: false,
    },
  },
  // colors: [themeColors.accent, themeColors.purple, themeColors.green],
  legend: {
    position: 'top',
  },
  plotOptions: {
    bar: {
      horizontal: false,
      endingShape: 'rounded',
      columnWidth: '55%',
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    show: true,
    width: 2,
    colors: ['transparent'],
  },
  series: series.value,
  xaxis: {
    categories: [
      'Oca',
      'Şub',
      'Mar',
      'Nis',
      'May',
      'Haz',
      'Tem',
      'Agu',
      'Eyl',
      'Ekm',
      'Kas',
      'Ara',
    ],
  },
  yaxis: {
    labels: {
      formatter: function (val: string) {
        return val
      },
    },
  },
  fill: {
    opacity: 1,
  },
  tooltip: {
    y: {
      formatter: function (val: string) {
        return val
      },
    },
  },
})

const onChangePlant = async (plantId: any) => {
  selectedPlants.value = plantId
  await getStats()
}

const goToRoute = (target: string, params?: Object) => {
  router.push({
    name: target,
    params: params,
  })
}

const getStats = async () => {
  isStatsLoading.value = true
  let plantsFilter = selectedPlants.value
  if (!selectedPlants.value || selectedPlants.value.length == 0)
    plantsFilter = plants.value.map((d: any) => d.id)

  if (plantsFilter) {
    try {
      overallStats.value = (await api.post('Plant/OverallStats', plantsFilter)).data
      if (overallStats.value) {
        series.value = []
        series.value = overallStats.value?.categoryStats.map((d: any) => {
          return {
            name: d.categoryName,
            data: d.monthlyStats,
          }
        })
      }
    } catch (error) {}
  }

  isStatsLoading.value = false
}

onMounted(async () => {
  try {
    userData.value = userSession.user
    totals.value.plantCount = (await api.get('Plant/Count')).data
    totals.value.machineCount = (await api.get('Machine/Count')).data
    totals.value.departmentCount = (await api.get('Department/Count')).data
    totals.value.employeeCount = (await api.get('Employee/Count')).data
    totals.value.officerCount = (await api.get('Officer/Count')).data
    totals.value.itemCount = (await api.get('Item/Count')).data
    plants.value = (await api.get('Plant')).data

    if (userData.value?.AuthType == 'FactoryOfficer')
      selectedPlants.value = [userData.value.FactoryId]

    await getStats()
  } catch (error) {}
})
</script>

<template>
  <div class="analytics-dashboard">
    <div v-if="userData?.AuthType == 'Dealer'" class="columns">
      <div class="column is-4">
        <VField>
          <label>{{ getExpression('Factory') }}</label>
          <VControl>
            <Multiselect
              v-model="selectedPlants"
              mode="tags"
              class="is-stacked"
              :value-prop="'id'"
              :label="'plantName'"
              placeholder=""
              :searchable="true"
              :options="plants"
              @change="onChangePlant"
            />
          </VControl>
        </VField>
      </div>
    </div>
    <div class="columns">
      <div class="column is-12">
        <div class="columns is-multiline">
          <!--Most Consumed Item-->
          <div class="column is-3">
            <div class="dashboard-tile">
              <div class="tile-head">
                <h3 class="dark-inverted">{{ getExpression('MostConsumed') }}</h3>
                <VIconBox color="primary" size="small" rounded>
                  <i aria-hidden="true" class="fas fa-gem"></i>
                </VIconBox>
              </div>
              <div class="tile-body">
                <VLoader :active="isStatsLoading">
                  <span
                    v-show="overallStats && overallStats.mostConsumedItemCount"
                    class="dark-inverted"
                  >
                    {{ overallStats?.mostConsumedItemCount }}
                  </span>
                </VLoader>
              </div>
              <div class="tile-foot">
                <span class="text-h-green">
                  <!-- <i aria-hidden="true" class="iconify" data-icon="feather:trending-up" /> -->
                </span>
                <p class="subtitle is-6">
                  <VLoader :active="isStatsLoading">
                    <span v-show="overallStats && overallStats.mostConsumedItemName">{{
                      overallStats?.mostConsumedItemName
                    }}</span>
                  </VLoader>
                </p>
              </div>
            </div>
          </div>

          <!--Active Machine Stats-->
          <div class="column is-3">
            <div class="dashboard-tile">
              <div class="tile-head">
                <h3 class="dark-inverted">{{ getExpression('ActiveAutomats') }}</h3>
                <VIconBox color="green" size="small" rounded>
                  <i class="iconify" data-icon="feather:activity"></i>
                </VIconBox>
              </div>
              <div class="tile-body">
                <VLoader :active="isStatsLoading">
                  <span v-show="overallStats" class="dark-inverted">{{
                    (overallStats.activeMachineCount ?? 0) +
                    ' / ' +
                    (overallStats?.totalMachineCount ?? 0)
                  }}</span>
                </VLoader>
              </div>
              <div class="tile-foot">
                <span class="text-h-red">
                  <!-- <i
                    aria-hidden="true"
                    class="iconify"
                    data-icon="feather:trending-down"
                  /> -->
                </span>
                <p class="subtitle is-6">&nbsp;</p>
              </div>
            </div>
          </div>

          <!--In-Fault Engines-->
          <div class="column is-3">
            <div class="dashboard-tile">
              <div class="tile-head">
                <h3 class="dark-inverted">Arızalı Motorlar</h3>
                <VIconBox color="danger" size="small" rounded>
                  <i class="iconify" data-icon="feather:alert-octagon"></i>
                </VIconBox>
              </div>
              <div class="tile-body">
                <VLoader :active="isStatsLoading">
                  <span class="dark-inverted">{{
                    overallStats?.inFaultSpiralCount ?? 0
                  }}</span>
                </VLoader>
              </div>
              <div class="tile-foot">
                <span class="text-h-green">
                  <!-- <i aria-hidden="true" class="iconify" data-icon="feather:trending-up" /> -->
                </span>
                <p class="subtitle is-6">&nbsp;</p>
              </div>
            </div>
          </div>

          <!-- User Card -->
          <div class="column is-3">
            <!--Widget-->
            <ContactWidget
              picture="/images/avatars/placeholder.jpg"
              :username="userData.name"
              :company="userData?.AuthType == 'Dealer' ? 'Bayi' : userData?.PlantName"
              :position="userData?.AuthType == 'Dealer' ? '' : 'Fabrika Yetkilisi'"
              squared
              reversed
              straight
            />
          </div>

          <!--Category Stats-->
          <div class="column is-12">
            <div class="dashboard-card">
              <div class="card-head">
                <h3 class="dark-inverted">
                  {{ getExpression('ConsumptionsBasedCategory') }}
                </h3>
              </div>
              <ApexChart
                id="profit-chart"
                :height="250"
                :type="barOptions.chart.type"
                :series="series"
                :options="barOptions"
              >
              </ApexChart>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card-grid card-grid-v3">
      <!--Card Grid v3-->
      <div
        name="list"
        tag="div"
        class="columns is-multiline is-flex-tablet-p is-half-tablet-p"
      >
        <!-- Factories Card -->
        <div v-if="isDealer" class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/assets/factory.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">{{ userSession.getExpression('Factories') }}</h3>
            <p>{{ totals.plantCount }} {{ userSession.getExpression('Count') }}</p>
            <div class="description">
              <p>{{ userSession.getExpression('FactoryDefinitions') }}</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('plant')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>{{ userSession.getExpression('List') }}</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('plant-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>{{ userSession.getExpression('New') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!--Machines Card-->
        <div v-if="hasAuth('Machines', 'Read')" class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/assets/automat.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">{{ userSession.getExpression('Machines') }}</h3>
            <p>{{ totals.machineCount }} {{ userSession.getExpression('Count') }}</p>
            <div class="description">
              <p>{{ userSession.getExpression('MachineDefinitions') }}</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('machine')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>{{ userSession.getExpression('List') }}</span>
              </button>
              <button
                v-if="hasAuth('Machines', 'Write')"
                class="button v-button is-raised is-primary"
                @click="goToRoute('machine-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>{{ userSession.getExpression('New') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Departments Card -->
        <div v-if="hasAuth('Departments', 'Read')" class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/assets/department.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">{{ userSession.getExpression('Departments') }}</h3>
            <p>{{ totals.departmentCount }} {{ userSession.getExpression('Count') }}</p>
            <div class="description">
              <p>{{ userSession.getExpression('DepartmentDefinitions') }}</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('department')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>{{ userSession.getExpression('List') }}</span>
              </button>
              <button
                v-if="hasAuth('Departments', 'Write')"
                class="button v-button is-raised is-primary"
                @click="goToRoute('department-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>{{ userSession.getExpression('New') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Employees Card -->
        <div v-if="hasAuth('Employees', 'Read')" class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/assets/employee.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">{{ userSession.getExpression('Employees') }}</h3>
            <p>{{ totals.employeeCount }} {{ userSession.getExpression('Count') }}</p>
            <div class="description">
              <p>{{ userSession.getExpression('EmployeeDefinitions') }}</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('employee')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>{{ userSession.getExpression('List') }}</span>
              </button>
              <button
                v-if="hasAuth('Employees', 'Write')"
                class="button v-button is-raised is-primary"
                @click="goToRoute('employee-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>{{ userSession.getExpression('New') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Officers Card -->
        <div v-if="isDealer" class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/assets/officer.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">{{ userSession.getExpression('Officers') }}</h3>
            <p>{{ totals.officerCount }} {{ userSession.getExpression('Count') }}</p>
            <div class="description">
              <p>{{ userSession.getExpression('OfficerDefinitions') }}</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('officer')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>{{ userSession.getExpression('List') }}</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('officer-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>{{ userSession.getExpression('New') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Items Card -->
        <div v-if="hasAuth('Items', 'Read')" class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/assets/item.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">{{ userSession.getExpression('Items') }}</h3>
            <p>{{ totals.itemCount }} {{ userSession.getExpression('Count') }}</p>
            <div class="description">
              <p>{{ userSession.getExpression('ItemDefinitions') }}</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('item-definition')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>{{ userSession.getExpression('List') }}</span>
              </button>
              <button
                v-if="hasAuth('Items', 'Write')"
                class="button v-button is-raised is-primary"
                @click="goToRoute('item-definition-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>{{ userSession.getExpression('New') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import '../../../../scss/abstracts/mixins';

.card-grid {
  .columns {
    margin-left: -0.5rem !important;
    margin-right: -0.5rem !important;
    margin-top: -0.5rem !important;
  }

  .column {
    padding: 0.5rem !important;
  }
}

.card-grid-v3 {
  .card-grid-item {
    @include vuero-s-card;

    position: relative;
    text-align: center;
    padding: 30px;

    .h-toggle {
      position: absolute;
      top: 28px;
      right: 10px;
      transform: scale(0.85);
    }

    > .v-avatar {
      display: block;
      margin: 0 auto 10px;
      border-radius: 16px;

      .avatar {
        object-fit: cover;
        border: 1px solid var(--fade-grey-dark-4);
        box-shadow: var(--light-box-shadow);
      }

      .badge {
        bottom: 22px;
        right: -12px;
      }
    }

    > h3 {
      font-size: 1.1rem;
      font-weight: 600;
      font-family: var(--font-alt);
      color: var(--dark-text);
    }

    > p {
      font-size: 0.9rem;
    }

    .description {
      padding: 12px 0;
    }

    .people {
      display: flex;
      justify-content: center;
      padding: 8px 0 30px;

      .v-avatar {
        margin: 0 4px;
      }
    }

    .buttons {
      display: flex;
      justify-content: space-between;

      .button {
        width: calc(50% - 4px);

        &:hover,
        &:focus {
          box-shadow: var(--light-box-shadow);
        }
      }
    }
  }
}

.is-dark {
  .card-grid-v3 {
    .card-grid-item {
      @include vuero-card--dark;
    }
  }
}

@media only screen and (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .card-grid-v3 .card-grid-item > h3 {
    font-size: 1rem;
  }
}

.analytics-dashboard {
  .text-h-green {
    color: var(--green);
  }

  .text-h-red {
    color: var(--red);
  }

  .text-widget {
    color: var(--widget-grey);
  }

  .dashboard-tile {
    @include vuero-s-card;

    font-family: var(--font);

    .tile-head {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h3 {
        font-family: var(--font-alt);
        color: var(--dark-text);
        font-weight: 600;
      }
    }

    .tile-body {
      font-size: 2rem;
      padding: 4px 0 8px;

      span {
        color: var(--dark-text);
        font-weight: 600;
      }
    }

    .tile-foot {
      span {
        &:first-child {
          font-weight: 500;

          svg {
            height: 16px;
            width: 16px;
            margin-right: 6px;
            stroke-width: 3px;
          }
        }

        &:nth-child(2) {
          color: var(--light-text);
          font-size: 0.9rem;
        }
      }
    }
  }

  .dashboard-card {
    @include vuero-s-card;

    font-family: var(--font);
    height: 100%;

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h3 {
        font-family: var(--font-alt);
        font-size: 1rem;
        font-weight: 600;
        color: var(--dark-text);
      }
    }

    .revenue-stats {
      display: flex;

      .revenue-stat {
        margin-right: 30px;
        font-family: var(--font);

        span {
          display: block;

          &:first-child {
            color: var(--light-text);
            font-size: 0.9rem;
          }

          &:nth-child(2) {
            color: var(--dark-text);
            font-size: 1.2rem;
            font-weight: 600;
          }

          &.current {
            color: var(--primary);
          }
        }
      }
    }

    .radial-wrap {
      display: flex;
      flex-direction: column;
      height: calc(100% - 44px);

      .radial-stats {
        margin-top: auto;
        display: flex;
        padding-top: 20px;
        border-top: 1px solid var(--fade-grey-dark-3);

        .radial-stat {
          width: 50%;
          text-align: center;

          &:first-child {
            border-right: 1px solid var(--fade-grey-dark-3);
          }

          span {
            display: block;

            &:first-child {
              color: var(--light-text);
              font-size: 0.9rem;
            }

            &:nth-child(2) {
              color: var(--dark-text);
              font-size: 1.3rem;
              font-weight: 600;
            }
          }
        }
      }
    }

    .progress-block {
      display: flex;
      flex-direction: column;
      height: calc(100% - 44px);
      font-family: var(--font);

      .value {
        font-size: 1.4rem;
        font-weight: 600;

        span {
          color: var(--dark-text);
        }
      }

      .progress {
        margin-bottom: 8px;
      }

      .progress-foot {
        span {
          &:first-child {
            font-weight: 500;

            svg {
              height: 16px;
              width: 16px;
              margin-right: 6px;
              stroke-width: 3px;
            }
          }

          &:nth-child(2) {
            color: var(--light-text);
            font-size: 0.9rem;
          }
        }
      }

      .circle-chart-wrapper {
        margin-top: auto;
      }
    }
  }
}

.is-dark {
  .analytics-dashboard {
    .dashboard-tile,
    .dashboard-card {
      @include vuero-card--dark;
    }
  }
}
</style>
