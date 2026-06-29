"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_error_handling_1 = require("../../common/utiliti/global-error-handling");
const chat_repository_1 = require("../../DB/Repository/chat.repository");
const user_repository_1 = require("../../DB/Repository/user.repository");
const radis_service_1 = __importDefault(require("../../common/service/radis.service"));
const mongoose_1 = require("mongoose");
const uuid_1 = require("uuid");
const S3_service_1 = require("../../common/service/S3.service");
class ChatService {
    constructor() { }
    _userRepo = new user_repository_1.UserRepository();
    _chatRepo = new chat_repository_1.ChatRepository();
    _S3Service = new S3_service_1.S3Service();
    getChat = async (req, res) => {
        const { userId } = req.params;
        const chat = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [req.user?._id, userId],
                },
                group: { $exists: false },
            },
            projection: {
                messages: { $slice: -5 }
            },
            options: {
                populate: [
                    {
                        path: "participants"
                    }
                ],
            }
        });
        if (!chat) {
            throw new global_error_handling_1.AppError("chat not found", 400);
        }
        return res.status(200).json({
            message: "Done",
            data: chat
        });
    };
    createGroup = async (req, res, next) => {
        let { group, groupImage, participants } = req.body;
        const createdBy = req.user?._id;
        const dbParticipants = participants.map((participant) => mongoose_1.Types.ObjectId.createFromHexString(participant));
        const users = await this._userRepo.find({
            filter: {
                _id: {
                    $in: dbParticipants
                },
                friends: {
                    $in: [createdBy]
                }
            }
        });
        if (users.length !== participants.length) {
            throw new global_error_handling_1.AppError("some users not found", 404);
        }
        const roomId = `${group.replaceAll(/\s+/g, "-")}_${(0, uuid_1.v4)()}`;
        if (req?.file) {
            groupImage = await this._S3Service.uploadFile({
                file: req.file,
                path: `chat/${roomId}`
            });
        }
        try {
            const chat = await this._chatRepo.create({
                group,
                groupImage: groupImage,
                participants: [...dbParticipants, createdBy],
                createdBy,
                roomId,
                messages: []
            });
            return res.status(200).json({ message: "success", chat });
        }
        catch (error) {
            console.log(error);
            throw new global_error_handling_1.AppError("chat not created");
        }
    };
    getGroupChat = async (req, res) => {
        const { groupId } = req.params;
        const chat = await this._chatRepo.findOne({
            filter: {
                _id: groupId,
                participants: {
                    $all: [req.user?._id],
                },
                group: { $exists: true },
            },
            projection: {
                messages: { $slice: -5 }
            },
            options: {
                populate: [
                    {
                        path: "messages.createdBy"
                    }
                ],
            }
        });
        if (!chat) {
            throw new global_error_handling_1.AppError("chat not found", 404);
        }
        return res.status(200).json({
            message: "Done",
            data: chat
        });
    };
    sayHi = (data) => {
        console.log("😒😒😒");
        console.log(data);
    };
    sendMessage = async (data, socket, io) => {
        console.log(data);
        const { sendTo, content } = data;
        const createdBy = socket.data.user._id;
        const user = await this._userRepo.findOne({ filter: { _id: sendTo } });
        if (!user) {
            throw new global_error_handling_1.AppError("user not found");
        }
        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                participants: {
                    $all: [sendTo, createdBy]
                },
                group: { $exists: false }
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
            }
        });
        if (!chat) {
            await this._chatRepo.create({
                createdBy,
                messages: [{
                        content,
                        createdBy
                    }],
                participants: [sendTo, createdBy]
            });
        }
        const conversation = await this._chatRepo.findOne({
            filter: {
                participants: {
                    $all: [createdBy, sendTo],
                },
                group: { $exists: false },
            },
            projection: {
                messages: { $slice: -5 }
            }
        });
        console.log(conversation);
        io.to(await radis_service_1.default.getSockets(createdBy)).emit("successMessage", { conversation });
        io.to(await radis_service_1.default.getSockets(sendTo)).emit("newMessage", { conversation, from: socket.data.user });
    };
    join_room = async (data, socket, io) => {
        console.log({ data });
        const { roomId } = data;
        const chat = await this._chatRepo.findOne({
            filter: {
                roomId,
                participants: {
                    $in: [socket.data.user._id]
                },
                group: { $exists: true }
            }
        });
        if (!chat) {
            throw new global_error_handling_1.AppError("chat not found", 404);
        }
        socket.join(chat?.roomId);
    };
    sendGroupMessage = async (data, socket, io) => {
        console.log(data);
        const { content, groupId } = data;
        const createdBy = socket.data.user._id;
        const chat = await this._chatRepo.findOneAndUpdate({
            filter: {
                _id: groupId,
                participants: {
                    $all: [createdBy]
                },
                group: { $exists: true }
            },
            update: {
                $push: {
                    messages: {
                        content,
                        createdBy
                    }
                }
            }
        });
        if (!chat) {
            throw new global_error_handling_1.AppError("chat not found", 404);
        }
        const conversation = await this._chatRepo.findOne({
            filter: {
                _id: groupId
            },
            projection: {
                messages: { $slice: -5 }
            },
            options: {
                populate: [
                    {
                        path: "messages.createdBy"
                    }
                ]
            }
        });
        io.to(await radis_service_1.default.getSockets(createdBy)).emit("successMessage", { conversation });
        io.to(chat.roomId).emit("newMessage", { conversation, from: socket.data.user, groupId });
    };
}
exports.default = new ChatService();
