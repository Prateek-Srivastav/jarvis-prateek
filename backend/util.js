// "use strict";
const Groq = require("groq-sdk");
const promptGenerator = require("./prompt");
const Exa = require("exa-js").default;

// import Exa from "exa-js";

const exa = new Exa(process.env.EXA_API_KEY);

// Parameters for our Highlights search
// const highlights_options = {
//   numSentences: 7, // how long our highlights should be
//   highlightsPerUrl: 1, // just get the best highlight for each URL
// };

async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  process.stdout.write(chatCompletion.choices[0]?.message?.content || "");
}
async function getGroqChatCompletion({ question }) {
  try {
    const search_response = await exa.searchAndContents(question, {
      // highlights: true,
      // numSentences: 7,
      numResults: 3,
      useAutoprompt: true,
    });

    let info = "";
    for (const index in search_response.results) {
      info =
        info +
        `${parseInt(index) + 1}. ${search_response.results[
          index
        ].text.trim()}\n\n`;
    }

    // const info = search_response.results[0].text;
    // console.log(info);

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "you are a helpful friend of Prateek and you should provide point to point answers to his questions with using as few words as possible. Be a little dark and sarcastic. Read the provided contexts and, if relevant, use them to answer the question.",
        },
        {
          role: "user",
          content: promptGenerator({ question, searchResults: info }),
        },
      ],
      model: "mixtral-8x7b-32768",
    });
    // console.log(result);
    if (result) return result;
  } catch (error) {
    console.log(error);
    return { message: "no_conn" };
  }
}
module.exports = {
  main,
  getGroqChatCompletion,
};
