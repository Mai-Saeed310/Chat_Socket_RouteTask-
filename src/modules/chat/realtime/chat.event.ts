import { Socket, Server } from 'socket.io';
import chatService from '../chat.service';



class ChatEvent {
    constructor() { }

    sayHi = async (socket: Socket) => {
        socket.on("sayHi", (data) => {
            chatService.sayHi(data)      
        })
    }

    sendMessage = async (socket: Socket, io: Server) => {
        socket.on("sendMessage", (data) => {
            chatService.sendMessage(data, socket, io)
             
        })
    }

    join_room = async (socket: Socket, io: Server) => {

        console.log("join_room event registered💡💡💡");

        try {
        socket.on("join_room", async (data) => {
            console.log("join_room received:💡💡💡", data);

            await chatService.join_room(data, socket, io);
        
        });

            } catch (error) {
            console.error("room error:", error);

            }
    }

    sendGroupMessage = async (socket: Socket, io: Server) => {
        socket.on("sendGroupMessage", (data) => {
            chatService.sendGroupMessage(data, socket, io)
             
        })
    }
}

export default new ChatEvent()