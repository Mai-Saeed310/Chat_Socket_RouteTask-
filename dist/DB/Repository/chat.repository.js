"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const base_repository_1 = require("./base.repository");
const chat_model_1 = require("../../models/chat.model");
class ChatRepository extends base_repository_1.BaseRepository {
    model;
    constructor(model = chat_model_1.chatModel) {
        super(model);
        this.model = model;
    }
}
exports.ChatRepository = ChatRepository;
