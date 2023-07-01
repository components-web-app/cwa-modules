import { useCwa } from './cwa'
import { useCwaManagerResource } from './cwaManagerResource'

export type IriProp = {
 iri: string
}

interface cwaResourceUtilsOps {
  iri: string
  disableManager?: boolean
}

export const useCwaResourceUtils = (iri: string, ops?: cwaResourceUtilsOps) => {
  const manager = !ops?.disableManager ? useCwaManagerResource(iri) : undefined
  return {
    manager,
    // this needs to be a function so useCwa is not called early - would get issues from ComponentPosition and more
    getResource: () => useCwa().resources.getResource(iri)
  }
}
