import { FastifyInstance } from 'fastify'

import { authenticateWithPassword } from './auth/authenticate-with-password'
import { createPassword } from './auth/create-password'
import { getProfile } from './auth/get-profile'
import { requestPasswordRecover } from './auth/request-password-recover'
import { resetPassword } from './auth/reset-password'
import { verifyAuthenticationWithPassword } from './auth/verify-authentication-with-password'

export async function erpRoutes(app: FastifyInstance) {
  app.register(authenticateWithPassword)
  app.register(createPassword)
  app.register(getProfile)
  app.register(requestPasswordRecover)
  app.register(resetPassword)
  app.register(verifyAuthenticationWithPassword)
}
