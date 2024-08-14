import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'
import type { Ref } from 'vue'
import { computed } from 'vue'
import ListContent from '#cwa/runtime/templates/components/core/admin/ListContent.vue'

export const useListPage = (listContent: Ref<InstanceType<typeof ListContent> | null>) => {
  const router = useRouter()

  const route = useRoute()

  function triggerReload () {
    listContent.value?.reloadItems()
  }

  function goToAdd () {
    router.push(computedItemLink.value('add'))
  }

  const computedItemLink = computed(() => {
    return (iri: string): RouteLocationRaw => {
      const currentRouteName = route.name?.toString()
      if (!currentRouteName) {
        return '#'
      }
      const upperRouteName = currentRouteName.replace(/-iri$/, '')

      return { name: `${upperRouteName}-iri`, params: { iri }, query: route.query }
    }
  })

  return {
    goToAdd,
    triggerReload,
    computedItemLink
  }
}