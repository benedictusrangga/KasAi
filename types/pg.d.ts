declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string
    ssl?: boolean | object
  }

  export class Pool {
    constructor(config: PoolConfig)
  }
}
