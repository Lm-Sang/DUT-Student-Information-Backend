// Staff authentication belongs to the admin frontend. Preserve its existing
// audience, cookie paths and URL until a separate authentication migration.
export { createStaffAuthModule } from "../../../common/auth/index.js";
