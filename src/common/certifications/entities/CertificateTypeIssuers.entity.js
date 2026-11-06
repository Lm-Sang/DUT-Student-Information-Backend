import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_CertificateTypeIssuers=new EntitySchema({
  "name": "certification_CertificateTypeIssuers",
  "tableName": "CertificateTypeIssuers",
  "schema": "certification",
  "synchronize": false,
  "columns": {
    "CertificateTypeId": {
      "name": "CertificateTypeId",
      "type": "int",
      "nullable": false,
      "primary": true
    },
    "IssuingOrganizationId": {
      "name": "IssuingOrganizationId",
      "type": "int",
      "nullable": false,
      "primary": true
    },
    "IsActive": {
      "name": "IsActive",
      "type": "bit",
      "nullable": false
    }
  },
  "relations": {
    "FK__Certifica__Certi__7BDB408F": {
      "type": "many-to-one",
      "target": "certification_CertificateTypes",
      "joinColumn": [
        {
          "name": "CertificateTypeId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__Certifica__Issui__7CCF64C8": {
      "type": "many-to-one",
      "target": "certification_IssuingOrganizations",
      "joinColumn": [
        {
          "name": "IssuingOrganizationId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
