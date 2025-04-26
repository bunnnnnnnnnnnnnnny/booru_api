// https://nitro.unjs.io/config

export default defineNitroConfig({
  compatibilityDate: '2024-11-14',
  srcDir: 'server',
  runtimeConfig: {
    passwordSecret: 'awawawawawawawawawawawawawawawawawawawawawawa',
    pg: {
      database: '',
      host: '',
      user: '',
      password: '',
      port: '',
    },
  },
});
