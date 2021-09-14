module.exports = {
  extends: [
    '@nuxtjs/eslint-config-typescript',
    'prettier',
    'plugin:cypress/recommended',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended'
  ],
  rules: {
    'vue/no-v-html': 0,
    'vue/custom-event-name-casing': [
      'error',
      {
        ignores: [
          '/^cwa:[a-z]+(?:-[a-z]+)*:[a-z]+(?:-[a-z]+)*(:[a-z]+(?:-[a-z]+)*)?$/u'
        ]
      }
    ]
  }
}