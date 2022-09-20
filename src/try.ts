import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { printErrorLogs } from './log'
import { serveAndCheck } from '.'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const serve = resolve(root, 'playground/dist')

const logs = await serveAndCheck({
  serve,
})

if (logs.length) {
  printErrorLogs(logs)
  process.exit(1)
}
else {
  process.exit(0)
}

