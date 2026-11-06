// Compatibility export for existing migration commands. No demo grants are used.
import { workflowPermissionsViewSql } from '../../auth/index.js';
export const effectivePermissionsViewSql = workflowPermissionsViewSql;
export const organizationPermissionsViewSql = workflowPermissionsViewSql;
