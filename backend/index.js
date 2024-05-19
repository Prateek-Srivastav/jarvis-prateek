require("dotenv").config();
const express = require("express");

const isInternetConn = require("./isInternetConn");
const {
  getOnlineChatCompletion,
  getLocalChatCompletion,
} = require("./chatCompletion");
const { WebSocket } = require("ws");

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
    // if (result.message === "err") return res.send(result.error);
    // console.log(result);
    // const response =
    //   result.choices[0]?.message?.content || "No response, check backend";

    // res.send(response);
  } else if (!isConnected) {
    const result = await getLocalChatCompletion({
      question: req.body.question,
      // res: res,
    });
    console.log(result);
    res.send(result);
  }
});

const port = process.env.PORT || 9565;
app.listen(port, () => console.log(`server started on port ${port}`));

const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  // Code to handle new WebSocket connections
  console.log("CONNECTED");
  console.log(wss.clients.size);
  ws.on("error", console.error);
  ws.on("message", async function message(data) {
    data = JSON.parse(data);
    console.log(data);
    const question = data.question;
    // let questions = [];
    // questions.push(question);
    // console.log("received:", questions);
    const isConnected = await isInternetConn();
    console.log(isConnected);
    if (isConnected) {
      getOnlineChatCompletion({
        prevMessages: data.messages ? data.messages : [],
        question,
        ws,
      });
      // if (result.message === "err") return res.send(result.error);
      // console.log(result);
      // const response =
      //   result.choices[0]?.message?.content || "No response, check backend";

      // res.send(response);
    } else if (!isConnected) {
      getLocalChatCompletion({
        question: question,
        ws,
        // res: res,
      });
      // console.log(result);
      // res.send(result);
    }
    // setTimeout(() => ws.send(data.toString()), 5000);
  });
  ws.send("\u00b7");

  // console.log(ws);
  // setInterval(() => ws.send("CONNECTRED 2"), 1000);
});
