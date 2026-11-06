import { EntitySchema } from 'typeorm';

export const auth_AccountTasks = new EntitySchema({ name: 'auth_AccountTasks', tableName: 'AccountTasks', schema: 'auth', synchronize: false,
  columns: {
    AccountId: { name: 'AccountId', type: 'uniqueidentifier', primary: true },
    TaskId: { name: 'TaskId', type: 'int', primary: true },
    FieldCode: { name: 'FieldCode', type: 'varchar', length: 10 },
  } });
