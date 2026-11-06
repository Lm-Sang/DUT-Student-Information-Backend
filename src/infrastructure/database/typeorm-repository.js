import {localDataSource,queryLocalDatabase,entitySchema} from '../../database.js';

// EntitySchemas retain SQL names; DTO aliases are selected explicitly at the repository boundary.
// The optional executor is the same parameterized interface used by isolated repository tests.
export function selectEntity(entity,alias){
  return localDataSource.getRepository(typeof entity==='string'?entitySchema(entity):entity).createQueryBuilder(alias);
}
export async function selectRows(builder,query=queryLocalDatabase){
  const [statement,parameters]=builder.getQueryAndParameters();return(await query(statement,parameters)).first??[];
}
export async function selectOne(builder,query=queryLocalDatabase){return(await selectRows(builder.take(1),query))[0]??null;}
