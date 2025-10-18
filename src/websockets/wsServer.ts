import { Server as SocketServer } from "socket.io";
import { server } from "../app.js"

//if using https without load balancer you have to give the cert paths to client and to server to upgrade to wss

const io = new SocketServer(server, {
  cors: {
        origin: [process.env.CLIENT_ORIGIN],
      methods:["GET","POST","DELETE"]
  },
  allowRequest: (req, callback) => {
    const origin = req.headers.origin;
    const allowedOrigins = [process.env.CLIENT_ORIGIN];

    if (allowedOrigins.includes(origin)) {
      callback(null, true); 
    } else {
      console.log("Bad WebSocket connection attempt from: " + origin)
      callback("Not allowed", false);
    }
    },
});

io.on("connection", socket => {
    console.log("connected to ws", socket)
})