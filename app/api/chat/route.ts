import { Agent, AgentInputItem, run, tool } from "@openai/agents";
import { agentops } from "agentops";
import { CoreMessage } from "ai";
import { createAssistantStreamResponse, ToolResponse } from "assistant-stream";
import { z } from "zod";

type Weather = {
  city: string;
  temperatureRange: string;
  conditions: string;
  humidity: number;
  windSpeed: string;
};

// Enhanced weather tool with more realistic data
const getWeather = tool({
  name: "get_weather",
  description: "Get comprehensive weather information for a city.",
  parameters: z.object({
    city: z.string().describe("The city to get weather for"),
    units: z.enum(["celsius", "fahrenheit"]).optional().default("celsius"),
  }),
  execute: async ({ city, units }): Promise<Weather> => {
    console.log(`🌤️  Fetching weather for ${city} (${units})`);

    // Mock weather data based on city
    const mockData: Record<string, Weather> = {
      tokyo: {
        city: "Tokyo",
        temperatureRange: units === "fahrenheit" ? "57-68°F" : "14-20°C",
        conditions: "Partly cloudy with light winds",
        humidity: 65,
        windSpeed: "12 km/h",
      },
      london: {
        city: "London",
        temperatureRange: units === "fahrenheit" ? "46-54°F" : "8-12°C",
        conditions: "Overcast with chance of rain",
        humidity: 78,
        windSpeed: "15 km/h",
      },
      "new york": {
        city: "New York",
        temperatureRange: units === "fahrenheit" ? "50-62°F" : "10-17°C",
        conditions: "Clear and sunny",
        humidity: 55,
        windSpeed: "8 km/h",
      },
    };

    const weather = mockData[city.toLowerCase()] || {
      city,
      temperatureRange: units === "fahrenheit" ? "68-75°F" : "20-24°C",
      conditions: "Pleasant and mild",
      humidity: 60,
      windSpeed: "10 km/h",
    };

    console.log(`📊 Weather data retrieved for ${weather.city}`);
    return weather;
  },
});

// Create the agent with enhanced instructions
const weatherAgent = new Agent({
  name: "Weather Assistant",
  instructions: `You are a helpful weather assistant that provides detailed weather information.
  When users ask about weather, use the get_weather tool and provide a comprehensive response
  including temperature, conditions, humidity, and wind information. Be conversational and helpful.`,
  tools: [getWeather],
});

export const maxDuration = 30;

export async function POST(req: Request) {
  await agentops.init();

  const { messages } = (await req.json()) as {
    messages: CoreMessage[];
  };

  const result = await run(
    weatherAgent,
    messages.map((message): AgentInputItem => {
      return {
        role: message.role as any,
        status: "completed",
        content: [
          {
            type: "input_text",
            text: (message.content as typeof message.content & any[])
              .map((p) => p.text)
              .join(""),
          },
        ],
      };
    }),
    {
      stream: true,
      signal: req.signal,
    }
  );

  return createAssistantStreamResponse(async (controller) => {
    const controllers = new Map<string, any>();
    for await (const event of result.toStream()) {
      if (event.type === "raw_model_stream_event") {
        if (event.data.type === "output_text_delta") {
          controller.appendText(event.data.delta);
        }
      }
      if (event.type === "run_item_stream_event") {
        if (event.item.type === "tool_call_item") {
          if (event.item.rawItem.type === "function_call") {
            const toolController = controller.addToolCallPart({
              toolName: event.item.rawItem.name,
              toolCallId: event.item.rawItem.callId,
              argsText: event.item.rawItem.arguments,
            });

            controllers.set(event.item.rawItem.callId, toolController);
          }
        } else if (event.item.type === "tool_call_output_item") {
          const toolController = controllers.get(event.item.rawItem.callId);
          toolController.setResponse(
            new ToolResponse({
              result: event.item.rawItem.output,
            })
          );
        }
      }
    }
  });
}
