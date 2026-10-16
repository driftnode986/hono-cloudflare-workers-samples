// src/queue.ts
export interface JobMessage {
  type: string
  tenantId: string
  resourceId?: string
  timestamp: string
}

export default {
  async queue(
    batch: MessageBatch<JobMessage>,
    env: { DB: D1Database }
  ): Promise<void> {
    for (const message of batch.messages) {
      const { type, tenantId, resourceId } = message.body
      console.log(
        `[audit] tenant=${tenantId} action=${type} resource=${resourceId}`
      )
      message.ack()
    }
  },
}
