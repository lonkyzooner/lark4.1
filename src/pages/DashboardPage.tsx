"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Badge } from "../components/ui/badge"
import {
  MessageSquare,
  Shield,
  BookOpen,
  Zap,
  BarChart3,
  Clock,
  FileText,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  PlusCircle,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("overview")

  // Mock data for recent activities
  const recentActivities = [
    { id: 1, type: "search", title: 'Searched for "Fourth Amendment violations"', time: "2 hours ago" },
    { id: 2, type: "document", title: "Analyzed contract for BigCorp Inc.", time: "5 hours ago" },
    { id: 3, type: "threat", title: "Detected 3 potential issues in Johnson case", time: "Yesterday" },
    { id: 4, type: "statute", title: "Reviewed California Penal Code § 422", time: "Yesterday" },
    { id: 5, type: "miranda", title: "Analyzed Miranda application in State v. Thompson", time: "2 days ago" },
  ]

  // Mock data for upcoming tasks
  const upcomingTasks = [
    { id: 1, title: "Review Smith contract", due: "Today", priority: "high" },
    { id: 2, title: "Prepare for Johnson hearing", due: "Tomorrow", priority: "medium" },
    { id: 3, title: "Research precedents for Williams case", due: "May 15", priority: "medium" },
    { id: 4, title: "Client meeting with Davis Corp", due: "May 16", priority: "low" },
  ]

  // Mock data for usage statistics
  const usageStats = {
    aiQueries: { used: 87, total: 100, percentage: 87 },
    threatScans: { used: 12, total: 20, percentage: 60 },
    statuteSearches: { used: 45, total: 50, percentage: 90 },
  }

  // Mock subscription data
  const subscription = {
    plan: "Standard",
    status: "active",
    renewalDate: "June 15, 2023",
    features: ["AI Assistant", "Threat Detection", "Statute Analysis", "Miranda Rights Analysis"],
  }

  const handleServiceClick = (service: string) => {
    switch (service) {
      case "assistant":
        navigate("/")
        break
      case "threat":
        navigate("/threat-detection")
        break
      case "statutes":
        navigate("/statutes")
        break
      case "miranda":
        navigate("/miranda")
        break
      default:
        navigate("/")
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const userName = user?.name || user?.email?.split("@")[0] || "User"
  const userInitials = getInitials(userName)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img
              src="/logo.svg"
              alt="LARK Logo"
              className="h-8 w-auto mr-2"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                e.currentTarget.onerror = null
              }}
            />
            <span className="text-xl font-bold text-primary">LARK</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.picture} />
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{userName}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/account")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/subscription")}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {userName.split(" ")[0]}</h1>
            <p className="text-muted-foreground">Here's an overview of your legal workspace</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => navigate("/subscription")}>
              <Badge variant="outline" className="mr-2 bg-primary/10 text-primary border-primary/20">
                {subscription.plan}
              </Badge>
              Manage Subscription
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Services Quick Access */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Legal Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* AI Assistant */}
                <Card
                  className="hover:border-primary/50 cursor-pointer transition-all"
                  onClick={() => handleServiceClick("assistant")}
                >
                  <CardHeader className="pb-2">
                    <div className="bg-primary/10 p-2 rounded-full w-fit mb-2">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>AI Assistant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Get instant answers to legal questions and research assistance.</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full justify-start p-0 h-auto text-primary">
                      Open Assistant
                    </Button>
                  </CardFooter>
                </Card>

                {/* Threat Detection */}
                <Card
                  className="hover:border-primary/50 cursor-pointer transition-all"
                  onClick={() => handleServiceClick("threat")}
                >
                  <CardHeader className="pb-2">
                    <div className="bg-primary/10 p-2 rounded-full w-fit mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Threat Detection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Identify potential legal risks in contracts and documents.</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full justify-start p-0 h-auto text-primary">
                      Analyze Documents
                    </Button>
                  </CardFooter>
                </Card>

                {/* Statute Analysis */}
                <Card
                  className="hover:border-primary/50 cursor-pointer transition-all"
                  onClick={() => handleServiceClick("statutes")}
                >
                  <CardHeader className="pb-2">
                    <div className="bg-primary/10 p-2 rounded-full w-fit mb-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Statute Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Search and analyze statutes across multiple jurisdictions.</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full justify-start p-0 h-auto text-primary">
                      Search Statutes
                    </Button>
                  </CardFooter>
                </Card>

                {/* Miranda Rights */}
                <Card
                  className="hover:border-primary/50 cursor-pointer transition-all"
                  onClick={() => handleServiceClick("miranda")}
                >
                  <CardHeader className="pb-2">
                    <div className="bg-primary/10 p-2 rounded-full w-fit mb-2">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>Miranda Rights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Analyze Miranda rights applications and violations in cases.</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" className="w-full justify-start p-0 h-auto text-primary">
                      Analyze Cases
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>

            {/* Recent Activity and Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {recentActivities.map((activity) => (
                      <li key={activity.id} className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {activity.type === "search" && <Search className="h-5 w-5 text-muted-foreground" />}
                          {activity.type === "document" && <FileText className="h-5 w-5 text-muted-foreground" />}
                          {activity.type === "threat" && <Shield className="h-5 w-5 text-muted-foreground" />}
                          {activity.type === "statute" && <BookOpen className="h-5 w-5 text-muted-foreground" />}
                          {activity.type === "miranda" && <Zap className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>Upcoming Tasks</CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <li key={task.id} className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {task.priority === "high" && <AlertCircle className="h-5 w-5 text-destructive" />}
                          {task.priority === "medium" && <Clock className="h-5 w-5 text-amber-500" />}
                          {task.priority === "low" && <Calendar className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">{task.title}</p>
                            <Badge
                              variant={
                                task.due === "Today" ? "destructive" : task.due === "Tomorrow" ? "outline" : "secondary"
                              }
                              className="text-xs"
                            >
                              {task.due}
                            </Badge>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Task
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Usage</CardTitle>
                <CardDescription>
                  Your current plan: <span className="font-medium text-primary">{subscription.plan}</span> (Renews on{" "}
                  {subscription.renewalDate})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* AI Queries */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">AI Assistant Queries</span>
                      <span className="text-sm text-muted-foreground">
                        {usageStats.aiQueries.used}/{usageStats.aiQueries.total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${usageStats.aiQueries.percentage}%` }}></div>
                    </div>
                  </div>

                  {/* Threat Scans */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Threat Detection Scans</span>
                      <span className="text-sm text-muted-foreground">
                        {usageStats.threatScans.used}/{usageStats.threatScans.total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${usageStats.threatScans.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Statute Searches */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Statute Searches</span>
                      <span className="text-sm text-muted-foreground">
                        {usageStats.statuteSearches.used}/{usageStats.statuteSearches.total}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${usageStats.statuteSearches.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" onClick={() => navigate("/subscription")} className="w-full">
                  Manage Subscription
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* AI Assistant */}
              <Card>
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>AI Legal Assistant</CardTitle>
                  <CardDescription>Get instant answers to complex legal questions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Access our AI-powered legal assistant to:</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Research case law quickly</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Summarize legal documents</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Draft legal arguments</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Answer procedural questions</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleServiceClick("assistant")}>
                    Open Assistant
                  </Button>
                </CardFooter>
              </Card>

              {/* Threat Detection */}
              <Card>
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Threat Detection</CardTitle>
                  <CardDescription>Identify potential legal risks in documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Upload contracts and legal documents to:</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Identify unfavorable clauses</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Detect compliance issues</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Compare to standard templates</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Receive risk assessments</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleServiceClick("threat")}>
                    Analyze Documents
                  </Button>
                </CardFooter>
              </Card>

              {/* Statute Analysis */}
              <Card>
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Statute Analysis</CardTitle>
                  <CardDescription>Search and analyze statutes across jurisdictions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Access our comprehensive statute database to:</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Search multiple jurisdictions</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Compare statute versions</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Find related case law</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Get plain language explanations</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleServiceClick("statutes")}>
                    Search Statutes
                  </Button>
                </CardFooter>
              </Card>

              {/* Miranda Rights */}
              <Card>
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Miranda Rights Analysis</CardTitle>
                  <CardDescription>Analyze Miranda applications and violations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">Use our specialized Miranda tool to:</p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Identify potential violations</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Research relevant precedents</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Generate defense strategies</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-primary mr-2" />
                      <span>Analyze interrogation transcripts</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={() => handleServiceClick("miranda")}>
                    Analyze Cases
                  </Button>
                </CardFooter>
              </Card>

              {/* Additional services can be added here */}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your activity across all LARK services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Today */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Today</h3>
                    <div className="space-y-4">
                      <div className="flex">
                        <div className="mr-4 relative">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Search className="h-5 w-5 text-primary" />
                          </div>
                          <div className="absolute top-9 bottom-0 left-1/2 w-px bg-border -translate-x-1/2"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Searched for "Fourth Amendment violations"</p>
                          <p className="text-xs text-muted-foreground">2 hours ago • AI Assistant</p>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="mr-4 relative">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="absolute top-9 bottom-0 left-1/2 w-px bg-border -translate-x-1/2"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Analyzed contract for BigCorp Inc.</p>
                          <p className="text-xs text-muted-foreground">5 hours ago • Threat Detection</p>
                          <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                            <p className="font-medium mb-1">Analysis Results:</p>
                            <ul className="list-disc list-inside text-xs space-y-1">
                              <li>3 potential liability issues found</li>
                              <li>Non-standard indemnification clause detected</li>
                              <li>Missing confidentiality provisions</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yesterday */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Yesterday</h3>
                    <div className="space-y-4">
                      <div className="flex">
                        <div className="mr-4 relative">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div className="absolute top-9 bottom-0 left-1/2 w-px bg-border -translate-x-1/2"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Detected 3 potential issues in Johnson case</p>
                          <p className="text-xs text-muted-foreground">Yesterday at 4:32 PM • Threat Detection</p>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="mr-4 relative">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="absolute top-9 bottom-0 left-1/2 w-px bg-border -translate-x-1/2"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Reviewed California Penal Code § 422</p>
                          <p className="text-xs text-muted-foreground">Yesterday at 2:15 PM • Statute Analysis</p>
                        </div>
                      </div>

                      <div className="flex">
                        <div className="mr-4">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Analyzed Miranda application in State v. Thompson</p>
                          <p className="text-xs text-muted-foreground">Yesterday at 10:08 AM • Miranda Rights</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-6">
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Plan:</span>
                    <Badge className="bg-primary/10 text-primary border-primary/20">{subscription.plan}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {subscription.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Renewal Date:</span>
                    <span className="text-sm">{subscription.renewalDate}</span>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">Included Features:</p>
                    <ul className="space-y-1">
                      {subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => navigate("/subscription")} className="w-full">
                    Manage Subscription
                  </Button>
                </CardFooter>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>Current billing period: May 1 - May 31, 2023</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* AI Queries */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium">AI Assistant Queries</h4>
                        <p className="text-xs text-muted-foreground">Unlimited with your plan</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{usageStats.aiQueries.used}</p>
                        <p className="text-xs text-muted-foreground">Queries this month</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${usageStats.aiQueries.percentage}%` }}></div>
                    </div>
                  </div>

                  {/* Threat Scans */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium">Threat Detection Scans</h4>
                        <p className="text-xs text-muted-foreground">
                          {usageStats.threatScans.used} of {usageStats.threatScans.total} used
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{usageStats.threatScans.percentage}%</p>
                        <p className="text-xs text-muted-foreground">of monthly allowance</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${usageStats.threatScans.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Statute Searches */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium">Statute Searches</h4>
                        <p className="text-xs text-muted-foreground">
                          {usageStats.statuteSearches.used} of {usageStats.statuteSearches.total} used
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{usageStats.statuteSearches.percentage}%</p>
                        <p className="text-xs text-muted-foreground">of monthly allowance</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${usageStats.statuteSearches.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Usage History</h4>
                    <div className="bg-muted rounded-md p-4 flex items-center justify-center">
                      <BarChart3 className="h-24 w-24 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground ml-4">
                        Detailed usage history is available in your account settings.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => navigate("/account")} className="w-full">
                    View Detailed Usage
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default DashboardPage

