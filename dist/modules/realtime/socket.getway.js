"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const chat_getway_1 = __importDefault(require("../chat/realtime/chat.getway"));
const authentication_1 = require("../../common/middlware/authentication");
const radis_service_1 = __importDefault(require("../../common/service/radis.service"));
class socketGetWay {
    constructor() { }
    init = async (httpServer) => {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: "*"
            }
        });
        io.use(async (socket, next) => {
            try {
                console.log(socket.handshake.auth.authorization);
                const { user, decoded } = await (0, authentication_1.decodeToken_and_fetchUser)(socket.handshake.auth.authorization || socket.handshake.headers.authorization);
                socket.data.user = user;
                console.log(user);
                next();
            }
            catch (error) {
                next(error);
            }
        });
        io.on("connection", async (socket) => {
            radis_service_1.default.addSocket({ userId: socket.data.user._id, SocketId: socket.id });
            await chat_getway_1.default.registerEvent(socket, io);
            socket.on("disconnect", async () => {
                await radis_service_1.default.removeSocket({ userId: socket.data.user._id, SocketId: socket.id });
            });
        });
    };
}
exports.default = new socketGetWay();
