require("dotenv").config();
const express = require("express");
const { getGroqChatCompletion } = require("./util");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/response", async (req, res) => {
  // console.log(req.body.question);
  const result = await getGroqChatCompletion({
    question: req.body.question,
  });
  if (result.message === "no_conn") return res.send("No internet connection.");
  // console.log(result);
  const response =
    result.choices[0]?.message?.content || "No response, check backend";
  // console.log(response);

  res.send(response);
});

const port = process.env.PORT || 9565;
app.listen(port, () => console.log(`server started on port ${port}`));
