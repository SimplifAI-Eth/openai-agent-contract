import { Request, Response, route } from "./httpSupport";

import OpenAI from "openai";

const toolDefinitions: any = [
  {
    type: "function",
    function: {
      name: "transfer_tokens",
      description:
        "Transfer or Send Tokens to another user, given the specified amount, currency and the receiver's name. Currencies accepted are USDC, ETH, BTC, and any other ERC20 token. Try to account for user abbreviations and full names, always interpret USD as USDC and Ethereum as ETH.",
      parameters: {
        type: "object",
        properties: {
          specifiedToken: {
            type: "string",
            description: "The currency of the token to transfer.",
          },
          specifiedAmount: {
            type: "number",
            description:
              "The amount of tokens to transfer, can be in decimals or floating point numbers.",
          },
          transferTo: {
            type: "string",
            description: "The name of the user to transfer the tokens to.",
          },
        },
        additionalProperties: false,
        required: ["specifiedToken", "specifiedAmount", "transferTo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "swap_tokens",
      description:
        "Buy or sell tokens between two specified currencies. The specifiedAmount and specifiedToken fields represent what ever value is mentioned by the user, no matter if the specifiedToken is the one selling or buying. Currencies accepted are USDC, ETH, BTC, and any other ERC20 token. Try to account for user abbreviations and full names, always interpret USD as USDC and Ethereum as ETH.",
      parameters: {
        type: "object",
        properties: {
          tokenToBuy: {
            type: "string",
            description: "The specified token currency to buy.",
          },
          tokenToSell: {
            type: "string",
            description: "The specified token currency to sell.",
          },
          specifiedAmount: {
            type: "number",
            description:
              "The amount of tokens to buy or sell, doesn't metter which one, as long as a value is mentioned by the user, can be in decimals or floating point numbers.",
          },
          specifiedToken: {
            type: "string",
            description:
              "The token currency which the user's is referencing when giving the specified amount.",
          },
        },
        additionalProperties: false,
        required: [
          "tokenToBuy",
          "tokenToSell",
          "specifiedAmount",
          "specifiedToken",
        ],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "settingAI",
      description:
        "Sets certain attributes that might be used for AI trading algorithm in order to help the user buy or sell their tokens when their mentioned conditions are met. Note that not all parameters are required, if the users did not provide any of the fields, set those fields as null. Currencies accepted are USDC, ETH, BTC, and any other ERC20 token. Try to account for user abbreviations and full names, always interpret USD as USDC and Ethereum as ETH.",
      parameters: {
        type: "object",
        properties: {
          tokenToBuy: {
            type: ["string", "null"],
            description: "The specified token currency to buy.",
          },
          tokenToSell: {
            type: ["string", "null"],
            description: "The specified token currency to sell.",
          },
          specifiedAmount: {
            type: ["number", "null"],
            description:
              "The amount of tokens to transfer, can be in decimals or floating point numbers. However, if the user doesn't specify the amount, it means they want to use all their funds to buy or sell the token, so the default value should be null.",
          },
          specifiedToken: {
            type: ["string", "null"],
            description:
              "The token currency which the user's is referencing when giving the specified amount.",
          },
          buyMax: {
            type: ["number", "null"],
            description:
              "If the user wants to buy tokens, buyMax represents the upper bound of the range of price that should trigger the AI algorithm for a trade. For example, if the user specified to buy ethereum when the price drops to $100, buyMax's value should then be 100 since the range to buy is now $0-$100. This field should default to null.",
          },
          buyMin: {
            type: ["number", "null"],
            description:
              "If the user wants to buy tokens, buyMin represents the lower bound of the range of price that should trigger the AI algorithm for a trade. For example, if the user specified to buy ethereum when the price rises to $50, buyMin's value should then be 50 since the range to buy is now $50-$infinity. This field should default to null.",
          },
          sellMax: {
            type: ["number", "null"],
            description:
              "If the user wants to sell tokens, sellMax represents the upper bound of the range of price that should trigger the AI algorithm for a trade. For example, if the user mentioned to sell USDC for ETH when the price of ETH drops to $10, sellMax's value should then be 10 since the range to sell USDC is now $0-$10. This field should default to null",
          },
          sellMin: {
            type: ["number", "null"],
            description:
              "If the user wants to sell tokens, sellMin represents the lower bound of the range of price that should trigger the AI algorithm for a trade. For example, if the user mentioned to sell USDC for ETH when the price of ETH rises to $20, sellMin's value should then be 20 since the range to sell USDC is now $20-$infinity. This field should default to null",
          },
        },
        additionalProperties: false,
        required: [
          "tokenToBuy",
          "tokenToSell",
          "specifiedAmount",
          "specifiedToken",
        ],
      },
    },
  },
];

async function GET(req: Request): Promise<Response> {
  let result = { message: "" };
  const secrets = req.secret || {};
  const queries = req.queries;
  const openaiApiKey = secrets.openaiApiKey
    ? (secrets.openaiApiKey as string)
    : "";
  const openai = new OpenAI({ apiKey: openaiApiKey });
  // Choose from any model listed here https://platform.openai.com/docs/models
  const openAiModel = queries.openAiModel ? queries.openAiModel[0] : "gpt-4o";
  const query = queries.chatQuery
    ? (queries.chatQuery[0] as string)
    : "Who are you?";

  const prompts: any = [
    {
      role: "system",
      content:
        "You are a blockchain application bot, you help users parse parameters to actions they want to do on their wallets, so under no circumstances should you hallucinate factual information. User confirmation will be handled so you do not need to be concerned about it. Do not under any circumstances ask for confirmation. You should use function calls. Your only purpose is to help the user with their wallet actions using function calls, only if the user doesnt provider enough information for the required fields, return a message that tells the user which information is missing. The bot also has an AI setting feature, where the user can tell the AI to make some trading decisions for them given a few requirements, for this feature look into the function definitions and call. If the user does not provide you with trading limits, do not ask for confirmation and proceed with function calling.",
    },
    { role: "user", content: `${query}` },
  ];

  const completion = await openai.chat.completions.create({
    messages: prompts,
    model: `${openAiModel}`,
    tools: toolDefinitions,
  });

  const responseMessage = completion.choices[0].message;
  result.message = completion.choices
    ? (responseMessage.content as string)
    : "Failed to get result";
  console.log("First response: ", responseMessage);

  return new Response(JSON.stringify(responseMessage));
}

async function POST(req: Request): Promise<Response> {
  return new Response(JSON.stringify({ message: "Not Implemented" }));
}

export default async function main(request: string) {
  return await route({ GET, POST }, request);
}
