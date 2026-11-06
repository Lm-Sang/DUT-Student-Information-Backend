import { EntitySchema } from 'typeorm';

export const auth_Tasks = new EntitySchema({ name: 'auth_Tasks', tableName: 'Tasks', schema: 'auth', synchronize: false,
  columns: {
    TaskId: { name: 'TaskId', type: 'int', primary: true },
    TaskCode: { name: 'TaskCode', type: 'varchar', length: 64 },
    TaskName: { name: 'TaskName', type: 'nvarchar', length: 150 },
    FieldCode: { name: 'FieldCode', type: 'varchar', length: 10 },
    IsActive: { name: 'IsActive', type: 'bit' },
  } });
