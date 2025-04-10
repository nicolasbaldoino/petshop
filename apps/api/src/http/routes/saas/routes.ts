import { FastifyInstance } from 'fastify'

import { authenticateWithPassword } from './auth/authenticate-with-password'
import { createAccount } from './auth/create-account'
import { getProfile } from './auth/get-profile'
import { requestPasswordRecover } from './auth/request-password-recover'
import { resetPassword } from './auth/reset-password'
import { getWorkspaceBilling } from './billing/get-workspace-billing'
import { createCustomer } from './customers/create-customer'
import { getCustomers } from './customers/get-customers'
import { updateCustomer } from './customers/update-customer'
import { createEmployee } from './employees/create-employee'
import { getEmployees } from './employees/get-employees'
import { updateEmployee } from './employees/update-employee'
import { createWorkspace } from './workspaces/create-workspace'
import { updateWorkspace } from './workspaces/update-workspace'

export async function saasRoutes(app: FastifyInstance) {
  app.register(createAccount)
  app.register(authenticateWithPassword)
  app.register(getProfile)
  app.register(requestPasswordRecover)
  app.register(resetPassword)

  app.register(createWorkspace)
  app.register(updateWorkspace)

  app.register(getWorkspaceBilling)

  app.register(createEmployee)
  app.register(getEmployees)
  app.register(updateEmployee)

  app.register(createCustomer)
  app.register(getCustomers)
  app.register(updateCustomer)
}
