import { resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import { printErrorLogs } from './log'
import type { CheckOptions } from './types'
import { serveAndCheck } from '.'

export default function VitePluginDeployCheck(
  options?: Partial<CheckOptions>,
): Plugin {
  let config: ResolvedConfig = undefined!

  return {
    name: 'vite-plugin-deploy-check',
    apply: 'build',
    enforce: 'post',
    configResolved(_config) {
      config = _config
    },
    buildEnd: {
      order: 'post',
      sequential: true,
      handler() {
        async function deployCheck() {
          const logs = await serveAndCheck({
            serve: resolve(config.root, config.build.outDir),
            ...options,
          })

          printErrorLogs(logs)

          if (logs.length)
            process.exitCode = 1
        }

        setTimeout(() => {
          deployCheck()
            .catch((e) => {
              console.error(e)
              process.exit(1)
            })
        }, 500)
      },
    },
  }
}
