import { FastifyInstance } from 'fastify'

import { authenticateWithPassword } from './auth/authenticate-with-password'
import { createPassword } from './auth/create-password'
import { getProfile } from './auth/get-profile'
import { requestPasswordRecover } from './auth/request-password-recover'
import { resetPassword } from './auth/reset-password'
import { verifyAuthenticationWithPassword } from './auth/verify-authentication-with-password'
import { createCustomer } from './customers/create-customer'
import { getCustomers } from './customers/get-customers'
import { updateCustomer } from './customers/update-customer'
import { createEmployee } from './employees/create-employee'
import { getEmployees } from './employees/get-employees'
import { updateEmployee } from './employees/update-employee'

export async function erpRoutes(app: FastifyInstance) {
  app.register(authenticateWithPassword)
  app.register(createPassword)
  app.register(getProfile)
  app.register(requestPasswordRecover)
  app.register(resetPassword)
  app.register(verifyAuthenticationWithPassword)

  app.register(createEmployee)
  app.register(getEmployees)
  app.register(updateEmployee)

  app.register(createCustomer)
  app.register(getCustomers)
  app.register(updateCustomer)
}
