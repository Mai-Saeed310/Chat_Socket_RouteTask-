"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
const global_error_handling_1 = require("../utiliti/global-error-handling");
const authorization = async (roles = [], role) => {
    if (!roles.includes(role)) {
        throw new global_error_handling_1.AppError("unAuthorized");
    }
};
exports.authorization = authorization;
