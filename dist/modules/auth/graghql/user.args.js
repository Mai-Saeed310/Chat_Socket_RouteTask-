"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserArgs = exports.getUserArgs = void 0;
const graphql_1 = require("graphql");
const user_type_1 = require("./user.type");
exports.getUserArgs = {
    _id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) }
};
exports.createUserArgs = {
    id: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLID) },
    age: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLInt) },
    name: { type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString) },
    gender: { type: new graphql_1.GraphQLNonNull(user_type_1.GenderType) }
};
