// src/types.ts
export type Bindings = {
  DB: D1Database
  PLAN_KV: KVNamespace
  JOB_QUEUE: Queue
}

export type Variables = {
  tenantId: string
  tenantPlan: string
}
