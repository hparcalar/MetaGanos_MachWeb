<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '/@src/composable/useApi'

const router = useRouter()
const api = useApi()

const totals = ref({ plantCount: 0 })

const goToRoute = (target: string, params?: Object) => {
  router.push({
    name: target,
    params: params,
  })
}

onMounted(async () => {
  try {
    const plantsCount = (await api.get('Plant/Count')).data

    totals.value.plantCount = plantsCount
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
        <div class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/@src/assets/illustrations/dashboards/home/factory.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">Fabrikalar</h3>
            <p>{{ totals.plantCount }} adet</p>
            <div class="description">
              <p>Fabrika Tanımları</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('plant')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>Liste</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('plant-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>Yeni</span>
              </button>
            </div>
          </div>
        </div>

        <!--Machines Card-->
        <div class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/@src/assets/illustrations/dashboards/home/automat.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">Makineler</h3>
            <p>5 adet</p>
            <div class="description">
              <p>Makine Tanımları</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('machine')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>Liste</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('machine-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>Yeni</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Departments Card -->
        <div class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/@src/assets/illustrations/dashboards/home/department.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">Departmanlar</h3>
            <p>3 adet</p>
            <div class="description">
              <p>Departman Tanımları</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('department')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>Liste</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('department-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>Yeni</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Employees Card -->
        <div class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/@src/assets/illustrations/dashboards/home/employee.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">Personeller</h3>
            <p>21 adet</p>
            <div class="description">
              <p>Personel Tanımları</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('employee')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>Liste</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('employee-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>Yeni</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Cards Card -->
        <div class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/@src/assets/illustrations/dashboards/home/card.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">Kartlar</h3>
            <p>21 adet</p>
            <div class="description">
              <p>Kart Tanımları</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('card')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>Liste</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('card-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>Yeni</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Items Card -->
        <div class="column is-4">
          <div class="card-grid-item">
            <VAvatar
              size="large"
              :picture="'/@src/assets/illustrations/dashboards/home/item.png?format=webp'"
              squared
            ></VAvatar>
            <h3 class="dark-inverted">Stoklar</h3>
            <p>105 adet</p>
            <div class="description">
              <p>Stok Tanımları</p>
            </div>
            <div class="buttons">
              <button
                class="button v-button is-outlined is-primary"
                @click="goToRoute('item-definition')"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:list"></i>
                </span>
                <span>Liste</span>
              </button>
              <button
                class="button v-button is-raised is-primary"
                @click="goToRoute('item-definition-slug', { slug: '0' })"
              >
                <span class="icon">
                  <i aria-hidden="true" class="iconify" data-icon="feather:plus"></i>
                </span>
                <span>Yeni</span>
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
