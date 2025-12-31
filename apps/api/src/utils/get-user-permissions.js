"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPermissions = getUserPermissions;
const auth_1 = require("@cold-monitor/auth");
function getUserPermissions(userId, role) {
    const authUser = auth_1.userSchema.parse({
        id: userId,
        role: role,
    });
    const ability = (0, auth_1.defineAbilityFor)(authUser);
    return ability;
}
