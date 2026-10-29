// Hook "Stop" de Claude Code: al terminar una respuesta ejecuta `npm run check` si el código ha cambiado.
// Si falla, sale con código 2 para que Claude vea el error y lo corrija antes de terminar.
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// En Windows la unidad puede llegar en minúscula ("c:\..."); Vitest carga entonces dos copias de sí mismo y
// falla con "Cannot read properties of undefined (reading 'config')". Se normaliza a mayúscula.
const ROOT = (process.env.CLAUDE_PROJECT_DIR ?? process.cwd()).replace(/^[a-z]:/, (drive) => drive.toUpperCase())
const CACHE_FILE = join(ROOT, 'node_modules', '.tmp', 'claude-last-check')
const WATCHED = ['src', 'scripts', 'package.json', 'tsconfig*.json', 'vite*.config.ts', '.oxlintrc.json']
const MAX_OUTPUT_CHARS = 4000

const git = (...args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' }).stdout ?? ''

/** Huella del código pendiente de commit: diff de lo versionado + contenido de lo nuevo */
function pendingChangesHash() {
  const diff = git('diff', 'HEAD', '--', ...WATCHED)
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...WATCHED).split('\n').filter(Boolean)
  if (!diff && untracked.length === 0) return null
  const hash = createHash('sha1').update(diff)
  for (const file of untracked) hash.update(file).update(readFileSync(join(ROOT, file)))
  return hash.digest('hex')
}

const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
// Ya se bloqueó una vez en esta cadena: dejar terminar para no entrar en bucle
if (input.stop_hook_active) process.exit(0)

const hash = pendingChangesHash()
const lastPassed = existsSync(CACHE_FILE) ? readFileSync(CACHE_FILE, 'utf8') : ''
if (!hash || hash === lastPassed) process.exit(0)

const result = spawnSync('npm', ['run', 'check'], { cwd: ROOT, encoding: 'utf8', shell: true })
if (result.status === 0) {
  mkdirSync(join(ROOT, 'node_modules', '.tmp'), { recursive: true })
  writeFileSync(CACHE_FILE, hash)
  process.exit(0)
}

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-MAX_OUTPUT_CHARS)
process.stderr.write(`npm run check ha fallado. Corrígelo antes de terminar:\n\n${output}`)
process.exit(2)
