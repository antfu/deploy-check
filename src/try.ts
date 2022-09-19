import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { printErrorLogs, serveAndCheck } from '.'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const servePath = resolve(root, 'playground/dist')

const logs = await serveAndCheck({
  servePath,
})

if (logs.length) {
  printErrorLogs(logs)
  process.exit(1)
}
else {
  process.exit(0)
}

