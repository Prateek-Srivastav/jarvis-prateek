// "use strict";
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  process.stdout.write(chatCompletion.choices[0]?.message?.content || "");
}
async function getGroqChatCompletion({ question }) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "you are a helpful assistant and you should provide point to point answers to the Prateek's questions with using as few words as possible.",
      },
      {
        role: "user",
        content: question,
      },
    ],
    model: "mixtral-8x7b-32768",
  });
}
module.exports = {
  main,
  getGroqChatCompletion,
};
