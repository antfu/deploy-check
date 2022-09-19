/* eslint-disable no-console */
import http from 'http'
import { chromium } from 'playwright'
import sirv from 'sirv'
import c from 'picocolors'
import createDebug from 'debug'
import type { Options, RuntimeErrorLog } from './types'

const debug = createDebug('deploy-check')

export async function serveAndCheck(options: Options) {
  const {
    port = 8238,
    host = '127.0.0.1',
    servePath,
    waitUntil = 'networkidle',
  } = options

  const URL = `http://${host}:${port}`

  const serve = sirv(servePath, {
    dev: true,
    single: true,
    dotfiles: true,
  })
  const server = http.createServer((req, res) => {
    serve(req, res)
  })

  server.listen(port, host)

  const browser = await chromium.launch()
  debug('> Browser initialed')
  const page = await browser.newPage()
  debug('> New page created')

  const errorLogs: RuntimeErrorLog[] = []

  page.on('console', async (message) => {
    if (message.type() === 'error') {
      errorLogs.push({
        type: 'console',
        timestamp: Date.now(),
        arguments: await Promise.all(message.args().map(i => i.jsonValue())),
      })
    }
  })
  page.on('pageerror', (err) => {
    errorLogs.push({
      type: 'error',
      timestamp: Date.now(),
      error: err,
    })
  })

  await page.goto(URL, { waitUntil })
  debug(`> Navigate to ${URL}`)

  await Promise.all([
    browser.close(),
    server.close(),
  ])

  return errorLogs
}

export function printErrorLogs(logs: RuntimeErrorLog[]) {
  if (!logs.length) {
    console.log()
    console.log(c.inverse(c.bold(c.green(' DEPLOY CHECK '))) + c.green(' No runtime errors found'))
    return
  }
  console.error()
  console.error(c.inverse(c.bold(c.red(' DEPLOY CHECK '))) + c.red(` ${logs.length} Runtime errors found`))
  logs.forEach((log, idx) => {
    console.error(c.yellow(`\n--- Error ${idx + 1} -------- ${c.gray(new Date(log.timestamp).toLocaleTimeString())} ---`))
    if (log.type === 'error')
      console.error(log.error)
    else
      console.error(...log.arguments)
  })
}
