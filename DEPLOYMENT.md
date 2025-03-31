# LARK Web Deployment Guide

This guide provides instructions for deploying the LARK (Law Enforcement Assistance and Response Kit) application to a web server.

## Prerequisites

- Node.js 16+ and npm
- A hosting service (Vercel, Netlify, AWS, etc.)
- API keys for:
  - LiveKit
  - OpenAI
  - Hugging Face

## Project Structure

The LARK application consists of:

1. **Frontend**: A React application built with Vite
2. **Backend**: A Node.js Express server that handles API key security and token generation

## Environment Setup

### 1. Frontend Environment Variables

Create a `.env` file in the project root with the following variables:

