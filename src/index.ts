import http from 'http'
import { chromium } from 'playwright'
import sirv from 'sirv'
import createDebug from 'debug'
import { withQuery } from 'ufo'
import type { CheckOptions, RuntimeErrorLog, ServeOptions } from './types'

const debug = createDebug('deploy-check')

export function serve(options: string | ServeOptions) {
  if (typeof options === 'string') {
    options = {
      static: options,
    }
  }

  const {
    basePath = '',
    static: servePath,
    // TODO:
    // script,
    port = 8238,
    host = '127.0.0.1',
  } = options

  const baseUrl = `http://${host}:${port}${basePath}`

  const serve = sirv(servePath, {
    dev: true,
    single: true,
    dotfiles: true,
  })
  const server = http.createServer((req, res) => {
    serve(req, res)
  })
  server.listen(port, host)

  return {
    basePath,
    baseUrl,
    stop() {
      return server.close()
    },
  }
}

export async function serveAndCheck(options: CheckOptions) {
  const {
    collect: collectOptions = {},
    routes: routesOptions = {},
  } = options

  const {
    waitUntil = 'networkidle',
    pageError: collectPageError = true,
    consoleError: collectConsoleError = true,
    consoleWarn: collectConsoleWarn = true,
  } = collectOptions

  const {
    routes = ['/'],
    followLinks = true,
    maxDepth = 5,
    maxPages = 500,
    ignoreQuery = true,
  } = routesOptions

  const {
    stop: stopServe,
    baseUrl,
    basePath,
  } = serve(options.serve)

  const browser = await chromium.launch()
  debug('> Browser initialed')

  const errorLogs: RuntimeErrorLog[] = []
  const visited = new Set()

  async function visit(route: string, depth: number) {
    if (ignoreQuery)
      route = withQuery(route, {})
    if (visited.has(route))
      return

    if (depth > maxDepth)
      return
    if (visited.size > maxPages)
      return
    visited.add(route)

    const page = await browser.newPage()
    page.on('console', async (message) => {
      if (collectConsoleError && message.type() === 'error') {
        errorLogs.push({
          type: 'console-error',
          route,
          timestamp: Date.now(),
          arguments: await Promise.all(message.args().map(i => i.jsonValue())),
        })
      }
      else if (collectConsoleWarn && message.type() === 'warning') {
        errorLogs.push({
          type: 'console-warn',
          route,
          timestamp: Date.now(),
          arguments: await Promise.all(message.args().map(i => i.jsonValue())),
        })
      }
    })
    page.on('pageerror', (err) => {
      if (collectPageError) {
        errorLogs.push({
          type: 'page-error',
          route,
          timestamp: Date.now(),
          error: err,
        })
      }
    })

    debug(`> Navigate to ${route}`)
    await page.goto(baseUrl + route, { waitUntil })

    if (followLinks) {
      const links = await page.evaluate(() => {
        // @ts-expect-error client
        const origin = location.origin
        // @ts-expect-error client
        return [...document.querySelectorAll('a[href]')]
          .map(i => i.href)
          .filter(i => i.startsWith(origin))
          .map(i => i.slice(origin.length))
      })
      const routes = links.filter(i => i.startsWith(basePath)).map(i => i.slice(basePath.length))
      await Promise.all(routes.map(i => visit(i, depth + 1)))
    }
  }

  await Promise.all(routes.map(i => visit(i, 0)))

  await Promise.all([
    browser.close(),
    stopServe(),
  ])

  return errorLogs
}

