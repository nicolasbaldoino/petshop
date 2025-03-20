import { env } from '@petshop/env'

import { app } from './app'

app.listen({ port: env.PORT, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running!')
})
