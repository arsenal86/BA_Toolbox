# BA Toolbox: AI-Powered Business Analysis Assistant

![BA Toolbox Screenshot](https://i.imgur.com/rG4Q2uT.png)

Welcome to the BA Toolbox, a web application designed to empower Business Analysts by leveraging AI to streamline the user story creation and refinement process. This tool analyzes user stories for clarity, completeness, and testability, providing actionable feedback and generating acceptance criteria to ensure high-quality requirements.

## ✨ Features

* **AI-Powered User Story Analysis:** Submit your user stories and receive instant, intelligent feedback.
* **Quality Assessment:** Evaluates stories based on key quality attributes like being specific, measurable, achievable, relevant, and time-bound (SMART).
* **Acceptance Criteria Generation:** Automatically create comprehensive acceptance criteria based on the user story's content.
* **Intuitive Interface:** A clean and simple UI built with React for a seamless user experience.
* **Serverless Architecture:** Utilizes Netlify Functions for scalable and efficient backend processing.

## 🛠️ Tech Stack

This project is a monorepo with a modern JavaScript stack:

* **Frontend:** [React.js](https://reactjs.org/)
* **Backend:** [Node.js](https://nodejs.org/) with [Express.js](https://expressjs.com/)
* **Serverless:** [Netlify Functions](https://www.netlify.com/products/functions/)
* **AI:** Powered by a large language model via API.

## 📂 Project Structure

The repository is organized into the following directories:

```text
business-analysis-app/
├── backend/         # Node.js/Express backend server
├── frontend/        # React frontend application
├── netlify/
│   └── functions/   # Serverless functions for Netlify
└── shared/          # Shared code (e.g., AI agent logic)
README.md            # This file
```

## 🚀 Getting Started

Follow these instructions to get a local copy of the project up and running for development and testing purposes.

### Prerequisites

* [Node.js](https://nodejs.org/en/download/) (v18 or later recommended)
* [npm](https://www.npmjs.com/get-npm)

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/BA_Toolbox.git
    cd BA_Toolbox/business-analysis-app
    ```

2.  **Set up the Frontend:**
    ```sh
    cd frontend
    npm install
    ```

3.  **Set up the Backend:**
    ```sh
    cd ../backend
    npm install
    ```

4.  **Environment Variables:**
    You will need to create a `.env` file in the `netlify/functions` directory to store your AI provider's API key.
    
    `business-analysis-app/netlify/functions/.env`
    ```
    OPENAI_API_KEY=your_api_key_here
    ```

### Running the Application Locally

1.  **Start the Frontend Development Server:**
    From the `business-analysis-app/frontend` directory:
    ```sh
    npm start
    ```
    This will run the app in development mode. Open http://localhost:3000 to view it in your browser.

2.  **Start the Backend Server:**
    From the `business-analysis-app/backend` directory:
    ```sh
    npm start
    ```
    The backend server will start on `http://localhost:5000`.

3.  **Run Netlify Functions Locally:**
    To test the serverless functions, you can use the Netlify CLI.
    ```sh
    # Install Netlify CLI globally if you haven't already
    npm install -g netlify-cli

    # Run from the root of the business-analysis-app directory
    netlify dev
    ```
    This will start a local development server that mimics the Netlify production environment, including your frontend and functions.

## ☁️ Deployment

This project is configured for easy deployment to [Netlify](https://www.netlify.com/).

The `netlify.toml` file in the `business-analysis-app` directory contains the necessary build and deployment settings.

1.  Push your code to a GitHub, GitLab, or Bitbucket repository.
2.  Connect your repository to a new site on Netlify.
3.  Netlify will automatically detect the `netlify.toml` file and configure the build settings.
4.  Add your environment variables (like `OPENAI_API_KEY`) in the Netlify UI under **Site settings > Build & deploy > Environment**.
5.  Trigger a deploy. Netlify will build the frontend, deploy it to its CDN, and deploy the serverless functions.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.