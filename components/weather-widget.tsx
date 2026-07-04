"use client"

import { useEffect, useState } from "react"
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Droplets,
  type LucideIcon,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Firmensitz Essen
const LAT = 51.4556
const LON = 7.0116
const CITY = "Essen"

interface Weather {
  temp: number
  wind: number
  precip: number
  code: number
}

// WMO-Wettercode → Icon + Beschriftung
function weatherMeta(code: number): { icon: LucideIcon; label: string } {
  if (code === 0) return { icon: Sun, label: "Klar" }
  if (code <= 2) return { icon: CloudSun, label: "Heiter" }
  if (code === 3) return { icon: Cloud, label: "Bewölkt" }
  if (code <= 48) return { icon: CloudFog, label: "Nebel" }
  if (code <= 67) return { icon: CloudRain, label: "Regen" }
  if (code <= 77) return { icon: CloudSnow, label: "Schnee" }
  if (code <= 82) return { icon: CloudRain, label: "Schauer" }
  if (code <= 86) return { icon: CloudSnow, label: "Schneeschauer" }
  return { icon: CloudLightning, label: "Gewitter" }
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&timezone=Europe%2FBerlin`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const c = data.current
        if (!c) throw new Error("no data")
        setWeather({
          temp: Math.round(c.temperature_2m),
          wind: Math.round(c.wind_speed_10m),
          precip: c.precipitation ?? 0,
          code: c.weather_code ?? 0,
        })
      })
      .catch(() => setError(true))
  }, [])

  const meta = weather ? weatherMeta(weather.code) : null
  const Icon = meta?.icon ?? Cloud

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-sky-500/10 to-primary/5">
      <CardContent className="flex items-center gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
          <Icon className="size-7" />
        </div>
        <div className="min-w-0 flex-1">
          {error ? (
            <p className="text-sm text-muted-foreground">Wetter nicht verfügbar</p>
          ) : !weather ? (
            <p className="text-sm text-muted-foreground">Wetter wird geladen…</p>
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums tracking-tight">{weather.temp}°C</span>
                <span className="text-sm text-muted-foreground">{meta?.label} · {CITY}</span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Wind className="size-3.5" />
                  {weather.wind} km/h
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="size-3.5" />
                  {weather.precip} mm
                </span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
