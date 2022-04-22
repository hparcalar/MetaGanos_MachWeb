<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'
import { useUserSession } from '/@src/stores/userSession'

const router = useRouter()
const api = useApi()
const userSession = useUserSession()
const { isDealer, isOfficer } = userSession

const totals = ref({
  plantCount: 0,
  machineCount: 0,
  departmentCount: 0,
  employeeCount: 0,
  officerCount: 0,
  itemCount: 0,
})

const goToRoute = (target: string, params?: Object) => {
  router.push({
    name: target,
    params: params,
  })
}

onMounted(async () => {
  try {
    totals.value.plantCount = (await api.get('Plant/Count')).data
    totals.value.machineCount = (await api.get('Machine/Count')).data
    totals.value.departmentCount = (await api.get('Department/Count')).data
    totals.value.employeeCount = (await api.get('Employee/Count')).data
    totals.value.officerCount = (await api.get('Officer/Count')).data
    totals.value.itemCount = (await api.get('Item/Count')).data
  } catch (error) {}
})
</script>

<template>
  <div>
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
        <div class="column is-4">
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
        <div class="column is-4">
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
        <div class="column is-4">
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
                @click="goToRoute('card-slug', { slug: '0' })"
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
        <div class="column is-4">
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
</style>
