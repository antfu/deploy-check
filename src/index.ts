/* eslint-disable no-console */
import { chromium } from 'playwright'
import sirv from 'sirv'
import polka from 'polka'

export interface Options {
  servePath: string
  port?: number
}

export interface LogError {
  type: 'error'
  error: unknown
}

export interface LogConsole {
  type: 'console'
  arguments: unknown[]
}

export type RuntimeLog = LogError | LogConsole

export async function deployCheck(options: Options) {
  const {
    port = 8238,
    servePath,
  } = options

  const URL = `http://localhost:${port}`

  polka()
    .use(sirv(servePath))
    .listen(port, (err: any) => {
      if (err)
        throw err
      console.log(`> Served on ${URL}`)
    })

  const browser = await chromium.launch()
  console.log('> Browser initialed')
  const page = await browser.newPage()
  console.log('> New page created')

  const errorLogs: RuntimeLog[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errorLogs.push({
        type: 'console',
        arguments: message.args(),
      })
    }
  })
  page.on('pageerror', (err) => {
    errorLogs.push({
      type: 'error',
      error: err,
    })
  })

  await page.goto(URL)
  console.log('> Navigated')

  Promise.all([
    page.close(),
    browser.close(),
  ]).catch()

  return errorLogs
}

