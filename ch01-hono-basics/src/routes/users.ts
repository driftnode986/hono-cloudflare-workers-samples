// src/routes/users.ts
import { Hono } from 'hono'

const users = new Hono()

users.get('/', (c) => c.json({ users: [] }))
users.get('/:id', (c) => c.json({ id: c.req.param('id') }))
users.post('/', (c) => c.json({ message: 'Created' }, 201))

export default users
