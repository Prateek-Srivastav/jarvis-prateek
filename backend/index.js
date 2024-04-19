require("dotenv").config();
const express = require("express");
const { Server } = require("socket.io");

const isInternetConn = require("./isInternetConn");
const {
  getOnlineChatCompletion,
  getLocalChatCompletion,
} = require("./chatCompletion");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/response", async (req, res) => {
  const isConnected = await isInternetConn();
  console.log(isConnected);
  if (isConnected) {
    const result = await getOnlineChatCompletion({
      question: req.body.question,
    });
    if (result.message === "err") return res.send(result.error);
    console.log(result);
    const response =
      result.choices[0]?.message?.content || "No response, check backend";

    res.send(response);
  } else if (!isConnected) {
    const result = await getLocalChatCompletion({
      question: req.body.question,
      // res: res,
    });

    res.send(result);
  }
});

const port = process.env.PORT || 9565;
const httpServer = app.listen(port, () =>
  console.log(`server started on port ${port}`)
);

// socket setup
const io = new Server(httpServer, {
  cors: {
    // origin: "http://localhost:3000",
    origin: "*",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  // global.chatSocket = socket;
  console.log("Connected to socket...");
  // add new user
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    io.emit("get-users", activeUsers);
  });

  // send message
  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);
    if (user) {
      io.to(user.socketId).emit("receive-message", data);
    }
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", activeUsers);
  });
});
