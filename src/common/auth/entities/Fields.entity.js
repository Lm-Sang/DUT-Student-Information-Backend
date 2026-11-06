import { EntitySchema } from 'typeorm';

// Matches the additive auth organization migration; synchronization stays disabled.
export const auth_Fields = new EntitySchema({ name: 'auth_Fields', tableName: 'Fields', schema: 'auth', synchronize: false,
  columns: {
    FieldCode: { name: 'FieldCode', type: 'varchar', length: 10, primary: true },
    FieldName: { name: 'FieldName', type: 'nvarchar', length: 150 },
    IsActive: { name: 'IsActive', type: 'bit' },
  } });
