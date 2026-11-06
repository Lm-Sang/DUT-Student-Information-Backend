import { createAuthRouter } from '../routes/auth.routes.js';
import { authService } from '../services/auth.service.js';
import { studentAuthController } from './student-auth.controller.js';

export const studentAuthRouter = createAuthRouter('student', studentAuthController, authService);
