"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroupSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const generalRules_1 = require("../../../common/utiliti/generalRules");
exports.createGroupSchema = {
    body: zod_1.default.strictObject({
        group: zod_1.default.string({ error: "group name is required" }),
        groupImage: zod_1.default.string().optional(),
        participants: zod_1.default.array(generalRules_1.generalRules.id)
            .min(1, "at least one participant required")
    }).superRefine((data, ctx) => {
        const unique = new Set(data.participants);
        if (unique.size !== data.participants.length) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "Duplicate participants not allowed"
            });
        }
        if (data.participants.length < 1) {
            ctx.addIssue({
                code: "custom",
                path: ["participants"],
                message: "group must have at least one participant"
            });
        }
    })
};
