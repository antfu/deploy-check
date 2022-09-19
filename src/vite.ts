import { resolve } from 'path'
import type { Plugin, ResolvedConfig } from 'vite'
import type { Options } from './types'
import { printErrorLogs, serveAndCheck } from '.'

export default function VitePluginDeployCheck(
  options?: Partial<Options>,
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
            servePath: resolve(config.root, config.build.outDir),
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
