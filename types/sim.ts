import { Sim, SimHistory, SimStatus } from '@prisma/client'

export type SimWithHistory = Sim & {
  history: SimHistory[]
}

export interface SimListResponse {
  data: Sim[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface SimDetailResponse {
  sim: Sim
  history: Array<SimHistory & { usageTag?: { id: number; name: string } | null }>
}

export { SimStatus }
