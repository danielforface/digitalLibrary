<div align="center">
  <img src="https://placehold.co/128x128.png" alt="Logo" width="128" height="128" data-ai-hint="archive logo">

  <h1 align="center">The Digital Archive</h1>

  <p align="center">
    A modern, feature-rich digital archive for managing and preserving text, media, and documents.
    <br />
    <a href="#"><strong>Explore the Demo »</strong></a>
    <br />
    <br />
    <a href="#">Report Bug</a>
    ·
    <a href="#">Request Feature</a>
  </p>
</div>

---

## About The Project

![Project Screenshot](https://placehold.co/800x450.png?text=Digital+Archive+Screenshot)

This project provides a sophisticated digital archive platform built with Next.js and a modern tech stack. It provides an intuitive interface for administrators to upload, categorize, tag, and manage a wide variety of content. The public-facing side offers a clean, navigable experience for users to explore the archive's treasures.

The project is designed to be highly customizable, multilingual (English and Hebrew), and fully featured for robust content management.

---

## Features

*   **Rich Content Management**: Upload text (with Markdown support), images, audio, video, PDFs, and Word documents.
*   **Hierarchical Categories**: Organize content in a nested tree of categories and subcategories.
*   **Drag-and-Drop Reordering**: Easily reorder categories to create a custom structure.
*   **Advanced Filtering & Sorting**: Sort items by date or title, and filter by file type or tags.
*   **Admin Authentication**: Secure content management with a password-protected admin area.
*   **Multilingual Support**: Fully translated interface for both English and Hebrew.
*   **Dedicated Memorial & Healing Sections**: Special sections to honor individuals.
*   **Responsive Design**: A seamless experience across desktop and mobile devices.

---

## Built With

This project is built with the latest technologies to ensure a fast, reliable, and modern user experience.

*   ![Next.js](https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
*   ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
*   ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
*   ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
*   ![ShadCN UI](https://img.shields.io/badge/shadcn/ui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)
*   ![Genkit](https://img.shields.io/badge/Genkit-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or newer recommended)
*   npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env.local` in the root of your project directory. This file is for local configuration and should not be committed to version control.

    Add the following variables to this file:
    ```env
    # .env.local
    ADMIN_PASSWORD="your-secret-password-here"
    NEXT_PUBLIC_ARCHIVE_NAME="Your Archive Name"
    ```
    - `ADMIN_PASSWORD`: This password will be used to log in to the admin panel.
    - `NEXT_PUBLIC_ARCHIVE_NAME`: This sets the public name of the archive site. The default is "אמרי נכוחים".

### Running the Application

*   **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

*   **Build for production:**
    To create a production-ready build of the application, run:
    ```sh
    npm run build
    ```
    This will generate an optimized version of the app in the `.next` folder.

*   **Start the production server:**
    After building, you can start the production server with:
    ```sh
    npm run start
    ```

---

## Project Structure

The project follows a standard Next.js App Router structure:

```
.
├── public/
│   └── uploads/      # Uploaded files are stored here
├── src/
│   ├── app/          # Core application routes and server actions
│   ├── components/   # Reusable React components
│   ├── context/      # React context providers (e.g., Language)
│   ├── data/         # JSON data files for content, categories, etc.
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utility functions and type definitions
│   └── ai/           # Genkit AI flows and configuration
├── .env.local        # Local environment variables (not tracked by Git)
└── ...               # Configuration files
```

---
## License

Distributed under the MIT License. See `LICENSE` for more information.
