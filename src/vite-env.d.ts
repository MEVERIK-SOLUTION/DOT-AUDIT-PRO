/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HLIDAC_STATU_TOKEN: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    readonly GEMINI_API_KEY: string
  }
}
