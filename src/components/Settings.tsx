"use client"

import { useState, useEffect } from "react"
import { useSettings } from "../lib/settings-store"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Switch } from "./ui/switch"
import { Slider } from "./ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Separator } from "./ui/separator"
import { useVoice } from "../contexts/VoiceContext"
import LiveKitRealtimeVoiceTest from "./LiveKitRealtimeVoiceTest"

export function Settings() {
  const { settings, updateOfficerName, updateVoicePreferences, updateOfflineMode, updateCommandContext } = useSettings()
  const { speak } = useVoice()
  const [localName, setLocalName] = useState(settings.officerName)

  // Test voice settings with current configuration
  const testVoiceSettings = async () => {
    const greeting = settings.officerName
      ? `Hello ${settings.officerName}, this is how I will sound with the current settings.`
      : "This is how I will sound with the current settings."
    await speak(greeting)
  }

  // Save officer name when input is complete
  const handleNameSave = () => {
    updateOfficerName(localName)
    if (localName) {
      speak(`Thank you, I'll remember to call you Officer ${localName}.`)
      // Store to localStorage as well for redundancy
      localStorage.setItem("lark-officer-name", localName)
      // Notify other components about the name change
      document.dispatchEvent(
        new CustomEvent("officerNameUpdated", {
          detail: { name: localName },
        }),
      )
    }
  }

  // Load name from localStorage on component mount
  useEffect(() => {
    const savedName = localStorage.getItem("lark-officer-name")
    if (savedName && savedName !== settings.officerName) {
      setLocalName(savedName)
      updateOfficerName(savedName)
    }
  }, [])

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="offline">Offline Mode</TabsTrigger>
          <TabsTrigger value="commands">Command Context</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Officer Profile</CardTitle>
              <CardDescription>Configure how LARK addresses you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="officerName">Name</Label>
                <Input
                  id="officerName"
                  placeholder="Enter your name"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                />
                <Button onClick={handleNameSave}>Save Name</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardHeader>
              <CardTitle>Voice Settings</CardTitle>
              <CardDescription>Customize LARK's voice behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Volume</Label>
                <Slider
                  value={[settings.voicePreferences.volume * 100]}
                  onValueChange={(value) => updateVoicePreferences({ volume: value[0] / 100 })}
                  max={100}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Speed</Label>
                <Slider
                  value={[settings.voicePreferences.speed * 100]}
                  onValueChange={(value) => updateVoicePreferences({ speed: value[0] / 100 })}
                  max={200}
                  step={1}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Urgency Levels</Label>
                <Switch
                  checked={settings.voicePreferences.urgencyLevels}
                  onCheckedChange={(checked) => updateVoicePreferences({ urgencyLevels: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Adaptive Speed</Label>
                <Switch
                  checked={settings.voicePreferences.adaptiveSpeed}
                  onCheckedChange={(checked) => updateVoicePreferences({ adaptiveSpeed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Audio Feedback</Label>
                <Switch
                  checked={settings.voicePreferences.audioFeedback}
                  onCheckedChange={(checked) => updateVoicePreferences({ audioFeedback: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Voice Synthesis Method</Label>
                <Select
                  value={settings.voicePreferences.synthesisMethod}
                  onValueChange={(value: "livekit" | "browser" | "auto") =>
                    updateVoicePreferences({ synthesisMethod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice synthesis method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="livekit">LiveKit (Requires Microphone)</SelectItem>
                    <SelectItem value="browser">Browser Speech Synthesis</SelectItem>
                    <SelectItem value="auto">Auto (Fallback to Browser)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  LiveKit provides higher quality voices but requires microphone access. Browser synthesis works without
                  permissions.
                </p>
              </div>

              <Button onClick={testVoiceSettings} className="mb-6">
                Test Voice Settings
              </Button>

              <Separator className="my-6" />

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">LiveKit Voice Test</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the LiveKit voice synthesis system with custom text
                </p>
                <LiveKitRealtimeVoiceTest />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offline">
          <Card>
            <CardHeader>
              <CardTitle>Offline Mode</CardTitle>
              <CardDescription>Configure offline capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Cache</Label>
                <Switch
                  checked={settings.offlineMode.enableCache}
                  onCheckedChange={(checked) => updateOfflineMode({ enableCache: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Cache Statutes</Label>
                <Switch
                  checked={settings.offlineMode.cacheStatutes}
                  onCheckedChange={(checked) => updateOfflineMode({ cacheStatutes: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Cache Miranda Rights</Label>
                <Switch
                  checked={settings.offlineMode.cacheMiranda}
                  onCheckedChange={(checked) => updateOfflineMode({ cacheMiranda: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Cache Size (MB)</Label>
                <Input
                  type="number"
                  value={settings.offlineMode.maxCacheSize}
                  onChange={(e) => updateOfflineMode({ maxCacheSize: Number.parseInt(e.target.value) || 100 })}
                  min={50}
                  max={1000}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands">
          <Card>
            <CardHeader>
              <CardTitle>Command Context</CardTitle>
              <CardDescription>Configure how LARK maintains conversation context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Command Chaining</Label>
                <Switch
                  checked={settings.commandContext.enableChaining}
                  onCheckedChange={(checked) => updateCommandContext({ enableChaining: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>Context Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={settings.commandContext.contextTimeout}
                  onChange={(e) => updateCommandContext({ contextTimeout: Number.parseInt(e.target.value) || 300 })}
                  min={60}
                  max={3600}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Context Length</Label>
                <Input
                  type="number"
                  value={settings.commandContext.maxContextLength}
                  onChange={(e) => updateCommandContext({ maxContextLength: Number.parseInt(e.target.value) || 5 })}
                  min={1}
                  max={10}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

