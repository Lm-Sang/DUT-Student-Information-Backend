import { EntitySchema } from 'typeorm';

export const auth_TaskPermissions = new EntitySchema({ name: 'auth_TaskPermissions', tableName: 'TaskPermissions', schema: 'auth', synchronize: false,
  columns: {
    TaskId: { name: 'TaskId', type: 'int', primary: true },
    PermissionName: { name: 'PermissionName', type: 'nvarchar', length: 100, primary: true },
  } });
