export type WaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit'

export interface Options {
  servePath: string
  port?: number
  waitUntil?: WaitUntil
}

export interface ErrorLog {
  type: 'error'
  timestamp: number
  error: unknown
}

export interface ConsoleErrorLog {
  type: 'console'
  timestamp: number
  arguments: unknown[]
}

export type RuntimeErrorLog = ErrorLog | ConsoleErrorLog
