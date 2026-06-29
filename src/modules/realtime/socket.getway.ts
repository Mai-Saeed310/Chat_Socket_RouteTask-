import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import chatGateway from "../chat/realtime/chat.getway"
import { decodeToken_and_fetchUser } from "../../common/middlware/authentication";
import radisService from "../../common/service/radis.service";



 class socketGetWay {
    constructor(){}

    init = async (httpServer: HttpServer)=> {

    const io = new Server(httpServer, {
        cors:{
            origin: "*"
        }
    })

    // io.on("connection", (socket)=>{
    //     console.log(socket.id)
    //     socket.on("hi", (data,cb)=>{
    //         console.log(data)
    //     })
    // })

    // io.of("/admin").on("connection", (socket)=>{
    //     console.log(socket.id)
    //     socket.on("hi", (data,cb)=>{
    //         console.log(data)
    //     })
    // })



    io.use(async (socket, next) => {
    try {
        console.log(socket.handshake.auth.authorization);
        const {user, decoded} = await decodeToken_and_fetchUser(socket.handshake.auth.authorization || socket.handshake.headers.authorization )
        socket.data.user = user 
        console.log(user)
        next()
    } catch (error: any) {
        next(error)
    }

    }) 

    io.on("connection", async (socket) => {
//         socket.onAny((event, ...args) => {
//     console.log("event:", event, args);
//   });

     radisService.addSocket({ userId: socket.data.user._id, SocketId: socket.id })
      await chatGateway.registerEvent(socket,io)

    // console.log({userSocketId: await radisService.getSockets(socket.data.user._id)})

        
        socket.on("disconnect", async() => {
            await radisService.removeSocket({ userId: socket.data.user._id, SocketId: socket.id  })
        })
    })

    }
}

export default new socketGetWay(); 
 