# Project Overview

This is a Nuxt.js 3 web application that functions as an AI-powered study assistant. The application allows users to upload learning materials in PDF format, manage these materials, and interact with an AI through a chat interface to ask questions about the uploaded content. The project uses Supabase for backend services, including file storage for the PDF documents and a database to store metadata about the learning materials.

The application features user authentication, a page for managing learning materials (upload, edit, delete), and a chat page with a history of conversations. The frontend is built with Vue.js and Nuxt.js, and the backend API is created using Nuxt's server routes.

## Building and Running

### Prerequisites

- Node.js and npm (or yarn/pnpm)
- A Supabase project with a storage bucket named `learning-materials` and a `learning_materials` table.

### Setup

1.  Install the dependencies:

    ```bash
    npm install
    ```

2.  Create a `.env` file in the root of the project and add your Supabase credentials:

    ```
    VITE_SUPABASE_URL=your-supabase-url
    VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
    ```

### Development

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production

To build the application for production, run:

```bash
npm run build
```

To preview the production build locally, run:

```bash
npm run preview
```

## Development Conventions

-   **Framework:** The project is built with Nuxt.js 3.
-   **Language:** TypeScript is used for both the frontend and backend.
-   **Styling:** Global styles are defined in `assets/css/main.css`, and component-specific styles are scoped within the Vue components.
-   **API:** The backend API is built with Nuxt.js server routes and is located in the `server/api` directory.
-   **Database:** The project uses Supabase for the database and file storage. The Supabase client is initialized in `server/utils/supabase.ts`.
-   **Authentication:** The application uses a custom authentication solution with middleware to protect routes.
-   **State Management:** The project uses Vue's built-in reactivity and composables for state management.
-   **Linting and Formatting:** While not explicitly defined in the `package.json`, it is recommended to use a linter and formatter like ESLint and Prettier to maintain code quality.
