"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserFeilds = void 0;
const authorization_1 = require("./../../../common/middlware/authorization");
const graphql_1 = require("graphql");
const user_type_1 = require("./user.type");
const user_args_1 = require("./user.args");
const user_service_1 = __importDefault(require("../user.service"));
const authentication_1 = require("../../../common/middlware/authentication");
const validation_1 = require("../../../common/middlware/validation");
const user_validation_1 = require("../user.validation");
class UserFeilds {
    constructor() { }
    query = () => {
        return {
            getUser: {
                type: user_type_1.UserType,
                args: user_args_1.getUserArgs,
                resolve: async (parent, args, contex) => {
                    await (0, validation_1.Validation_GQL)(user_validation_1.getUserSchema, args);
                    const { user, decoded } = await (0, authentication_1.authentication_gql)(contex.req.headers.authorization);
                    await (0, authorization_1.authorization)(["user", "admin"], user.role);
                    return user_service_1.default.getUser(parent, args);
                }
            },
            listUsers: {
                type: new graphql_1.GraphQLList(user_type_1.UserType),
                resolve: () => {
                    return user_service_1.default.getUsers();
                }
            }
        };
    };
}
exports.UserFeilds = UserFeilds;
exports.default = new UserFeilds();
