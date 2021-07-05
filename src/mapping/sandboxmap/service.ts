import { Service } from '../../base/service'
import { uuid } from '../../base/types'
import { ServerCache } from '../../caching/cache'
import { CachingService } from '../../caching/service'
import { DatabaseService } from '../../database/service'
import { Endpoint } from '../types'
import { SandboxmapTable } from './table'
import { Sandboxmap } from './types'

export class SandboxmapService extends Service {
  private table: SandboxmapTable
  private cache!: ServerCache<string, Sandboxmap>

  constructor(private db: DatabaseService, private caching: CachingService) {
    super()

    this.table = new SandboxmapTable()
  }

  async setup() {
    this.cache = await this.caching.newServerCache('cache_sandboxmap')

    await this.db.registerTable(this.table)
  }

  async create(conduitId: uuid, endpoint: Endpoint, clientId: uuid): Promise<Sandboxmap> {
    const sandboxmap = {
      conduitId,
      identity: endpoint.identity || '*',
      sender: endpoint.sender || '*',
      thread: endpoint.thread || '*',
      clientId
    }

    await this.query().insert(sandboxmap)
    this.cache.set(this.getCacheKey(conduitId, endpoint), sandboxmap)

    return sandboxmap
  }

  async get(conduitId: uuid, endpoint: Endpoint): Promise<Sandboxmap | undefined> {
    const key = this.getCacheKey(conduitId, endpoint)
    const cached = this.cache.get(key)
    if (cached) {
      return cached
    }

    const rows = await this.query().where({
      conduitId,
      identity: endpoint.identity || '*',
      sender: endpoint.sender || '*',
      thread: endpoint.thread || '*'
    })

    if (rows?.length) {
      const sandboxmap = rows[0] as Sandboxmap
      this.cache.set(key, sandboxmap)
      return sandboxmap
    } else {
      return undefined
    }
  }

  private getCacheKey(conduitId: uuid, endpoint: Endpoint) {
    return `${conduitId}~${endpoint.identity || '*'}~${endpoint.sender || '*'}~${endpoint.thread || '*'}`
  }

  private query() {
    return this.db.knex(this.table.id)
  }
}