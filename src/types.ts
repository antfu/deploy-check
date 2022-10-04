export type WaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit'

export interface ServeOptions {
  static?: string
  script?: string
  port?: number
  host?: string
  /**
   * @default '/'
   */
  basePath?: string
}

export interface CollectOptions {
  /**
   * @default 'networkidle'
   */
  waitUntil?: WaitUntil
  /**
   * @default true
   */
  pageError?: boolean

  /**
   * @default true
   */
  consoleError?: boolean

  /**
   * @default false
   */
  consoleWarn?: boolean

  exclude?: (string | RegExp | ((error: RuntimeErrorLog) => boolean | void))[]
}

export interface RoutesOptions {
  /**
   * Custom routes to be checked
   */
  routes?: string[]
  /**
   * Follow client links to auto descover routes
   */
  followLinks?: boolean
  /**
   * @default 5
   */
  maxDepth?: number
  /**
   * @default 1000
   */
  maxPages?: number
  /**
   * Ignore query when dedupe with existing routes
   * @default true
   */
  ignoreQuery?: boolean
}

export interface CheckOptions {
  serve: string | ServeOptions
  collect?: CollectOptions
  routes?: RoutesOptions
}

export interface ErrorLogBase {
  route: string
  timestamp: number
}

export interface PageErrorLog extends ErrorLogBase {
  type: 'page-error'
  error: unknown
}

export interface ConsoleErrorLog extends ErrorLogBase {
  type: 'console-error' | 'console-warn'
  arguments: unknown[]
}

export type RuntimeErrorLog = PageErrorLog | ConsoleErrorLog
