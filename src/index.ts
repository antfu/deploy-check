import http from 'http'
import { chromium } from 'playwright'
import sirv from 'sirv'
import createDebug from 'debug'
import type { CheckOptions, RuntimeErrorLog, ServeOptions } from './types'

const debug = createDebug('deploy-check')

export function serve(options: string | ServeOptions) {
  if (typeof options === 'string') {
    options = {
      static: options,
    }
  }

  const {
    basePath = '/',
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
    baseUrl,
    stop() {
      return server.close()
    },
  }
}

export async function serveAndCheck(options: CheckOptions) {
  const {
    collect,
  } = options

  const {
    waitUntil = 'networkidle',
    pageError: collectPageError = true,
    consoleError: collectConsoleError = true,
    consoleWarn: collectConsoleWarn = true,
  } = collect || {}

  const { stop: stopServe, baseUrl } = serve(options.serve)

  const browser = await chromium.launch()
  debug('> Browser initialed')
  const page = await browser.newPage()
  debug('> New page created')

  const errorLogs: RuntimeErrorLog[] = []

  page.on('console', async (message) => {
    if (collectConsoleError && message.type() === 'error') {
      errorLogs.push({
        type: 'console-error',
        route: page.url(),
        timestamp: Date.now(),
        arguments: await Promise.all(message.args().map(i => i.jsonValue())),
      })
    }
    else if (collectConsoleWarn && message.type() === 'warn') {
      errorLogs.push({
        type: 'console-warn',
        route: page.url(),
        timestamp: Date.now(),
        arguments: await Promise.all(message.args().map(i => i.jsonValue())),
      })
    }
  })
  page.on('pageerror', (err) => {
    if (collectPageError) {
      errorLogs.push({
        type: 'page-error',
        route: page.url(),
        timestamp: Date.now(),
        error: err,
      })
    }
  })

  await page.goto(baseUrl, { waitUntil })
  debug(`> Navigate to ${URL}`)

  await Promise.all([
    browser.close(),
    stopServe(),
  ])

  return errorLogs
}

