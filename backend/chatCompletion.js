const Groq = require("groq-sdk");
const promptGenerator = require("./prompt");
const { default: axios } = require("axios");
const Exa = require("exa-js").default;

const exa = new Exa(process.env.EXA_API_KEY);

const getOnlineChatCompletion = async ({ question, ws }) => {
  try {
    const search_response = await exa.searchAndContents(question, {
      // highlights: true,
      // numSentences: 7,
      numResults: 5,
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
      stream: true,
      model: "llama3-70b-8192",
    });
    for await (const chunk of result) {
      // Print the completion returned by the LLM.
      process.stdout.write(chunk.choices[0]?.delta?.content || "");
      let res = chunk.choices[0]?.delta?.content;
      ws.send(res);
    }
    // console.log(result);
    if (result) return { result: "OK" };
  } catch (error) {
    console.log(error);
    return { message: "err", error };
  }
};

const getLocalChatCompletion = async ({ question, ws }) => {
  // let res = "";

  const response = await axios
    .post(
      "http://localhost:11434/api/chat",
      {
        model: "llama3",
        // prompt: "capital of india",
        messages: [
          {
            role: "system",
            content: `you are a helpful friend of Prateek and you should provide point to point answers to his questions with using as few words as possible, ideally not more than 100 words.
            
                For your reference, today's date in India is ${new Date().toDateString()} and current time is ${new Date().toLocaleTimeString()}. Use this date and time to answer about date and time of the other countries, when asked.`,
          },
          {
            role: "user",
            content: question,
          },
        ],
        // stream: false,
      },
      { responseType: "stream" }
    )
    .then((response) => {
      response.data.on("data", (chunk) => {
        // logic to process stream data
        chunk = chunk.toString();
        // console.log(JSON.parse(chunk).message.content);
        process.stdout.write(JSON.parse(chunk).message.content);
        let res = JSON.parse(chunk).message.content;
        ws.send(res);
        // res.write(JSON.parse(chunk).message.content);
      });
      response.data.on("end", () => {
        // logic for stream complete
        // res.end();
        console.log("end");
      });
    })
    .catch((e) => console.log(e));
  // console.log(response.data.message.content);
  // return response.data.message.content;
};

module.exports = {
  getOnlineChatCompletion,
  getLocalChatCompletion,
};
