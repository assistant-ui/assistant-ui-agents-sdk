import { Agent, run, tool } from "@openai/agents";
import { agentops } from "agentops";
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

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  // await agentops.init();

  const { messages } = await req.json();

  const result = await run(weatherAgent,messages., {
    stream: true,
    signal: req.signal,
  });

  return result.toDataStreamResponse();
}
