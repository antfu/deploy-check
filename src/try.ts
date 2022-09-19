import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { deployCheck, printErrorLogs } from '.'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const servePath = resolve(root, 'playground/dist')

const logs = await deployCheck({
  servePath,
})

if (logs.length) {
  printErrorLogs(logs)
  process.exit(1)
}
else {
  process.exit(0)
}

