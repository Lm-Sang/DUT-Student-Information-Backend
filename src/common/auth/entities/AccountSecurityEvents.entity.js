import { EntitySchema } from 'typeorm';
export const auth_AccountSecurityEvents = new EntitySchema({ name:'auth_AccountSecurityEvents',tableName:'AccountSecurityEvents',schema:'auth',synchronize:false,
  columns:{
    Id:{name:'Id',type:'bigint',primary:true,generated:'increment'},
    ActorId:{name:'ActorId',type:'uniqueidentifier'},TargetId:{name:'TargetId',type:'uniqueidentifier'},
    Action:{name:'Action',type:'varchar',length:32},CreatedAt:{name:'CreatedAt',type:'datetime2'},
  } });
