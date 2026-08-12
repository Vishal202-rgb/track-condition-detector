# Track Condition Detector (TrackSense Pro)

A full-stack application built for monitoring and analyzing track conditions. 

## Tech Stack

This project is built using a modern full-stack TypeScript ecosystem:

- **Frontend:** React 19, Vite, Tailwind CSS, Radix UI, Framer Motion
- **Backend:** Node.js, Express, tRPC (Type-safe APIs)
- **Database:** Drizzle ORM, MySQL
- **Other Integrations:** AWS S3, OAuth, Anthropic AI

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (Package manager)

### Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone https://github.com/Vishal202-rgb/track-condition-detector.git
   cd track-condition-detector
   ```

2. Install dependencies using pnpm:
   ```bash
   pnpm install
   ```

3. Set up your environment variables:
   Create a `.env` file in the root directory and add the necessary environment variables (e.g., Database URL, OAuth credentials, AWS keys).

4. Push the database schema:
   ```bash
   pnpm run db:push
   ```

### Running the Application

To start the development server (which concurrently runs both the Vite frontend and Express backend via `tsx`):

```bash
pnpm run dev
```

The application will typically be accessible at `http://localhost:3000` (or another available port automatically chosen by the server).

## Building for Production

To build the application for production:

```bash
pnpm run build
```
This generates the static frontend assets in `dist/public` and compiles the backend into `dist/index.js`.

To start the production server:
```bash
pnpm start
```

## Vercel Deployment

This project is configured to be deployed natively on Vercel. 
- The static frontend assets are served seamlessly.
- The Express backend operates through Vercel Serverless Functions via the `/api` directory and `vercel.json` rewrites.

Simply connect your GitHub repository to Vercel and it will use the existing configuration automatically.

## License

MIT License
