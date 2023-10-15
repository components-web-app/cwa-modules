import { Config } from 'tailwindcss'

export default {
  content: [
    './cwa/**/*.{js,vue,ts}'
  ],
  plugins: [
    require('@tailwindcss/forms')
  ]
} as Config
