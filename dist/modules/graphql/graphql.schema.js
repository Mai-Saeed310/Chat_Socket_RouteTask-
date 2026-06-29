"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.qpl_schema = void 0;
const graphql_1 = require("graphql");
const user_feilds_1 = __importDefault(require("../auth/graghql/user.feilds"));
exports.qpl_schema = new graphql_1.GraphQLSchema({
    query: new graphql_1.GraphQLObjectType({
        name: "query",
        description: "query info",
        fields: {
            ...user_feilds_1.default.query()
        }
    }),
});
