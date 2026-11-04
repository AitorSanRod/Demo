// Los mapas (src/data/maps) escriben sus imágenes con new URL(…, import.meta.url), que los tipos de Workers no declaran
interface ImportMeta {
  readonly url: string
}
