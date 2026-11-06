import { EntitySchema } from 'typeorm';

export const auth_AccountProfiles = new EntitySchema({ name: 'auth_AccountProfiles', tableName: 'AccountProfiles', schema: 'auth', synchronize: false,
  columns: {
    AccountId: { name: 'AccountId', type: 'uniqueidentifier', primary: true },
    StaffAccountId: { name: 'StaffAccountId', type: 'nvarchar', length: 40, nullable: true },
    AccessLevel: { name: 'AccessLevel', type: 'varchar', length: 20 },
    FieldCode: { name: 'FieldCode', type: 'varchar', length: 10, nullable: true },
    Revision: { name: 'Revision', type: 'int' },
  } });
