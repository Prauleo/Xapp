# Twitter Content Generation Platform

A powerful tool designed to revolutionize content creation on Twitter by providing efficient, consistent, and personalized content generation while maintaining authenticity.

## Overview

This platform helps streamline the Twitter content creation process by:
- Generating content that maintains your account's unique voice and style
- Integrating visual elements through Midjourney
- Managing and organizing content efficiently
- Ensuring security through Google Authenticator

## Key Features

- **Secure Access**: Implementation of Google Authenticator for controlled access
- **Smart Content Generation**: AI-powered tweet creation that maintains your personal tone
- **Visual Integration**: Seamless combination of text content with Midjourney-generated visuals
- **Flexible Output**: Support for various tweet lengths and styles
- **Content Management**: Organized storage and tracking of generated content

## Technical Stack

- **Frontend**: Next.js 15.1.6 with React 19.0.0
- **Styling**: TailwindCSS 3.4.1 with HeadlessUI 2.2.0
- **Backend Services**: 
  - Supabase (v2.48.1) for database and authentication
  - OpenAI API (v4.83.0) for content generation
- **Security**: Google Authenticator integration

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development Scripts

- `npm run dev`: Starts development server with Turbopack
- `npm run build`: Builds the application for production
- `npm run start`: Runs the built application
- `npm run lint`: Runs ESLint for code quality

## Project Structure

The application follows Next.js 13+ conventions with the app directory structure:

- `/src/app`: Main application pages and routing
- `/src/components`: Reusable React components
- `/src/utils`: Utility functions and API clients
- `/public`: Static assets

## Environment Setup

The application requires several environment variables to be set up:
- Supabase credentials
- OpenAI API key
- Google Authenticator configuration

Contact the project maintainers for access to these credentials.

## Current Status

The platform currently supports:
- Basic tweet generation with personalization
- Google Authenticator security implementation
- Account creation and management

Under development:
- Midjourney visual prompt integration
- Enhanced account tone capture
- Extended tweet length support

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)