const clientIoAdmin = io("http://localhost:3000/admin")


const clientIo = io("http://localhost:3000", {
    auth: {
        authorization: `user ${localStorage.getItem("authorization")}`
    }
})

// send socketId to the BE 
clientIo.emit("hi", { id: localStorage.getItem("socketId") })

clientIo.on("sayHiBack", (data) => {
    console.log(data);
    
})

clientIo.on("connect_error", (error) => {
    console.log(error);
    
})



// // To apply ACK 
// clientIo.emit("hi", "hi from frontend", (data)=>{
//          console.log(data)
// })
