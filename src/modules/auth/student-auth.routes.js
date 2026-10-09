import { createAuthRouter } from './auth.routes.js';
import { authService } from './auth.service.js';
import { studentAuthController } from './student-auth.controller.js';

export const studentAuthRouter = createAuthRouter('student', studentAuthController, authService);
