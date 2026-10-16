// src/routes/config.ts
const keys = ['config:theme', 'config:locale', 'config:timezone']
const results = await Promise.all(
  keys.map((key) => c.env.MY_KV.get(key, 'json'))
)

// results は (object | null)[] の配列
keys.forEach((key, i) => {
  console.log(key, results[i])
})
