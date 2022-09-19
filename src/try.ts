import { resolve } from 'path'
import { fileURLToPath } from 'url'
import c from 'picocolors'
import { deployCheck } from '.'

const root = resolve(fileURLToPath(import.meta.url), '../..')
const servePath = resolve(root, 'playground/dist')

const logs = await deployCheck({
  servePath,
})
if (logs.length) {
  console.error(c.inverse(c.bold(c.red(' DEPLOY CHECK '))) + c.red(` ${logs.length} Runtime errors found`))
  logs.forEach((log) => {
    if (log.type === 'error')
      console.error(log.error)
    else
      console.error(...log.arguments)
  })
  process.exit(1)
}
else {
  process.exit(0)
}

