// Composition root: infrastructure owns connections; features own entity schemas.
import {authEntities} from './modules/auth/entities/index.js';
import {svcdemoEntities} from './modules/student-requests/entities/index.js';
import {academicleaveEntities} from './modules/academic-leave/entities/index.js';
import {certificationEntities} from './modules/certifications/entities/index.js';
import {studentsEntities} from './modules/students/entities/index.js';
import {announcementsEntities} from './modules/announcements/entities/index.js';
import {curriculumEntities} from './modules/curriculum/entities/index.js';
import {configureLocalEntities,localDataSource} from './infrastructure/database/local-sql-server.js';
import {configureSchoolEntities} from './infrastructure/database/sql-server.js';
export const localEntities=[...authEntities,...svcdemoEntities,...academicleaveEntities,...certificationEntities];
configureLocalEntities(localEntities);
export const schoolEntities=[...studentsEntities,...announcementsEntities,...curriculumEntities];
configureSchoolEntities(schoolEntities);
// Compile mappings without opening SQL so QueryBuilders and isolated repository tests stay lazy.
await localDataSource.buildMetadatas();
const entitySchemas=new Map(localEntities.map(entity=>[`${entity.options.schema}.${entity.options.tableName}`,entity]));
export function entitySchema(table){const entity=entitySchemas.get(table);if(!entity)throw new Error(`No TypeORM entity registered for ${table}`);return entity;}
export {getLocalDataSource,localDataSource,queryLocalDatabase,transactionLocalDatabase,disconnectLocalDatabase} from './infrastructure/database/local-sql-server.js';
export {getSchoolDataSource,connectDatabase,disconnectDatabases} from './infrastructure/database/sql-server.js';
