"use client";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { Sun, Moon, Loader2, MapPin } from "lucide-react";
import { z } from "zod";

// Weather data powered by Open-Meteo (https://open-meteo.com/)
export const GeocodeLocationToolUI = makeAssistantToolUI<
  { query: string },
  {
    error?: string;
    result?: { name: string; latitude: number; longitude: number };
  }
>({
  toolName: "geocode_location",
  render: ({ result }) => {
    if (result?.error) {
      return (
        <div className="bg-muted/50 flex min-h-[68px] items-center gap-3 rounded-md border-2 border-red-400 p-3">
          <span className="text-red-500">⚠️</span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Geocoding Error</span>
            <span className="text-muted-foreground text-sm">
              {result?.error || "Unknown error"}
            </span>
          </div>
        </div>
      );
    }
    if (!result?.result) {
      return (
        <div className="bg-muted/50 flex min-h-[68px] items-center gap-3 rounded-md border-2 border-blue-400 p-3">
          <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-blue-500" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              Geocoding location...
            </span>
            <span className="text-muted-foreground text-sm">
              Please wait while we find your location
            </span>
          </div>
        </div>
      );
    }

    const { name, latitude, longitude } = result?.result;
    return (
      <div className="bg-muted/50 hover:bg-muted/70 flex min-h-[68px] items-center gap-3 rounded-md border-2 border-blue-400 p-3 transition-all duration-300 hover:border-blue-500 hover:shadow-md">
        <MapPin className="h-5 w-5 flex-shrink-0 text-blue-500" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{name}</span>
          <span className="text-muted-foreground text-sm">
            {latitude}°N, {longitude}°E
          </span>
        </div>
      </div>
    );
  },
});

export const WeatherSearchToolUI = makeAssistantToolUI<
  {
    query: string;
    longitude: number;
    latitude: number;
  },
  | {
      success: true;
      temperature: number;
      timestamp: string;
    }
  | {
      success: false;
      error: string;
    }
>({
  toolName: "weather_search",
  render: ({ args, result }) => {
    const isLoading = !result;
    const error = result?.success === false ? result.error : null;
    const temp = result?.success ? result.temperature : null;
    const isDay = result?.success
      ? new Date(result.timestamp).getHours() >= 6 &&
        new Date(result.timestamp).getHours() < 18
      : true;

    return (
      <div className="bg-muted/50 hover:bg-muted/70 mt-4 flex min-h-[68px] items-center gap-3 rounded-md border-2 border-blue-400 p-3 transition-all duration-300 hover:border-blue-500 hover:shadow-md">
        {isLoading ? (
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        ) : error ? (
          <span className="text-red-500">⚠️</span>
        ) : isDay ? (
          <Sun className="h-5 w-5 flex-shrink-0 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 flex-shrink-0 text-blue-300" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-semibold">
            {isLoading
              ? "Searching for weather..."
              : error
                ? "Error Fetching Weather"
                : `Weather in ${args?.query}`}
          </span>
          <span className="text-muted-foreground text-sm">
            {isLoading
              ? "Loading..."
              : error
                ? error
                : temp !== null
                  ? `${temp}°C`
                  : "N/A"}
          </span>
        </div>
      </div>
    );
  },
});
