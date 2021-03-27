import debounce from 'lodash.debounce'
import {
  Notification,
  NotificationLevels
} from '../templates/components/cwa-api-notifications/types'
import { NOTIFICATION_EVENTS } from '../events'
import ComponentMixin from './ComponentMixin'

export default {
  mixins: [ComponentMixin],
  props: {
    field: {
      required: true,
      type: String
    },
    notificationCategory: {
      required: false,
      default: null,
      type: String
    }
  },
  data() {
    return {
      inputValue: null,
      debouncedFn: null,
      outdated: false,
      error: null
    }
  },
  watch: {
    inputValue() {
      this.error = null
      if (this.resource[this.field] === this.inputValue) {
        return
      }
      this.outdated = true
      if (this.debouncedFn) {
        this.debouncedFn.cancel()
      }
      this.debouncedFn = debounce(this.update, 100)
      this.debouncedFn()
    }
  },
  mounted() {
    this.inputValue = this.resource[this.field]
  },
  methods: {
    async update() {
      try {
        await this.$cwa.updateResource(
          this.iri,
          { [this.field]: this.inputValue },
          this.category || null
        )
        this.outdated = false
      } catch (message) {
        this.error = message
        const notification: Notification = {
          code: 'input-error',
          title: 'Input Error',
          message,
          level: NotificationLevels.ERROR,
          endpoint: this.iri,
          field: this.field,
          category: this.notificationCategory
        }
        this.$cwa.$eventBus.$emit(NOTIFICATION_EVENTS.add, notification)
      }
    }
  }
}
