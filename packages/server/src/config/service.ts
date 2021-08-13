import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import yn from 'yn'
import { Service } from '../base/service'

export class ConfigService extends Service {
  // TODO: Add typings here
  current: any

  // We call this before setting up the whole app
  async setupEnv() {
    if (yn(process.env.SKIP_LOAD_ENV)) {
      return
    }

    if (process.env.NODE_ENV !== 'production') {
      dotenv.config({ path: path.resolve(process.cwd(), 'dist', '.env') })
    } else {
      dotenv.config()
    }
  }

  async setup() {
    if (yn(process.env.SKIP_LOAD_CONFIG)) {
      this.current = {}
      return
    }

    let configPath: string
    if (process.env.NODE_ENV !== 'production') {
      configPath = path.resolve(process.cwd(), 'res', 'config.json')
    } else {
      configPath = path.resolve(process.cwd(), 'config', 'config.json')
    }

    if (fs.existsSync(configPath)) {
      const file = fs.readFileSync(configPath)
      this.current = JSON.parse(file.toString())
    } else {
      this.current = {}
    }
  }
}
