"use client"

import type React from "react"
import { handleStatuteLookup } from "./RSCodes"

interface StatuteProps {
  statute: string
  description: string
}

const StatuteDatabase: React.FC<StatuteProps> = ({ statute, description }) => {
  // Example of using RSCodes function
  const handleStatuteLookupLocal = () => {
    handleStatuteLookup(statute)
    // Additional logic can be added here if needed
  }

  return (
    <div className="glass-panel mb-4 border-l-4 border-l-lark-light-blue">
      <h3 className="lark-section-title">RS CODE REFERENCE</h3>
      <div className="text-sm font-medium mb-1 text-lark-light-blue">{statute}</div>
      <div className="text-xs">{description}</div>
      <button onClick={handleStatuteLookupLocal}>Lookup Statute</button>
    </div>
  )
}

export default StatuteDatabase

