// src/types.ts
export type Bindings = {
  DB: D1Database
  PLAN_KV: KVNamespace
  JOB_QUEUE: Queue
  JWT_SECRET: string
}

export type Variables = {
  tenantId: string
  tenantPlan: string
}
