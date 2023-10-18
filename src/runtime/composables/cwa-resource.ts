import { onMounted } from 'vue'
import { useCwa } from './cwa'
import { useCwaResourceManageable } from './cwa-resource-manageable'

export type IriProp = {
 iri: string
}

interface CwaResourceUtilsOps {
  name?: string
  manager?: {
    disabled?: boolean
  }
}

export const useCwaResource = (iri: string, ops?: CwaResourceUtilsOps) => {
  const $cwa = useCwa()

  // todo: the iri could be the published or draft one, but we want to resolve the iri that we expect to be displayed at the given time

  const manager = !ops?.manager?.disabled ? useCwaResourceManageable(iri) : undefined

  if (!manager) {
    onMounted(() => {
      $cwa.admin.eventBus.emit('componentMounted', iri)
    })
  }

  return {
    manager,
    // this needs to be a function so useCwa is not called early - would get issues from ComponentPosition and more
    getResource: () => $cwa.resources.getResource(iri),
    exposeMeta: {
      cwaResource: {
        name: ops?.name
      }
    }
  }
}
