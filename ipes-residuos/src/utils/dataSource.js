// utils/dataSource.js
import { LocalStorageAdapter } from './adapters/localStorageAdapter.js'
import { HttpAdapter } from './adapters/httpAdapter.js'

const MODE = (import.meta.env.VITE_DATA_SOURCE || 'local').toLowerCase()
export const dataSource = MODE === 'api' ? HttpAdapter : LocalStorageAdapter
