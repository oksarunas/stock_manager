Stock Manager 🛠️📊

Stock Manager is a full-stack application designed for managing and analyzing stock portfolios. It leverages AI for intelligent recommendations and real-time data to help users make informed financial decisions.
🚀 Features

    AI-Driven Insights: Uses Gemini's language model to provide portfolio advice.
    Portfolio Management: Buy and sell stocks with live portfolio value updates.
    Real-Time Market Data: Fetches live prices to keep your portfolio up-to-date.
    Trading Bot: Automated bot for executing trades and tracking performance.
    User-Friendly Interface: Clean, responsive frontend built with React and TailwindCSS.

🛠️ Technologies Used
Frontend

    React
    TypeScript
    TailwindCSS

Backend

    Python
    FastAPI
    SQLite (via SQLAlchemy)

AI Integration

    Gemini Language Model API

Others

    Docker
    Git

📦 Project Structure

stock_manager/
├── backend/                  # Backend logic and API server
│   ├── alembic/              # Alembic for database migrations
│   │   ├── versions/         # Database migration scripts
│   │   └── env.py            # Alembic environment configuration
│   ├── tasks/                # Background task scripts
│   │   ├── daily.py          # Daily tasks for data processing
│   │   ├── sync_stocks.py    # Synchronizes stock data
│   │   ├── update_prices.py  # Updates stock prices
│   ├── ai.py                 # AI-related logic for stock suggestions
│   ├── bot.py                # Trading bot functionality
│   ├── database.py           # Database connection setup
│   ├── fear_greed.py         # Logic for Fear & Greed Index scraping
│   ├── main.py               # Entry point for the backend server
│   ├── market.py             # Endpoints for market data
│   ├── models.py             # SQLAlchemy database models
│   ├── performance.py        # Portfolio performance calculations
│   ├── portfolio.py          # Portfolio management endpoints
│   ├── schemas.py            # Pydantic models for validation
│   ├── transactions.py       # Transaction management logic
│   ├── users.py              # User authentication and management
│   └── stock_manager.db      # SQLite database
├── frontend/                 # Frontend logic and React application
│   ├── src/                  # Main source code for React
│   │   ├── components/       # Reusable React components
│   │   │   ├── auth/         # Authentication-related components
│   │   │   ├── dashboard/    # Dashboard components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── tradingbot/   # Components for the trading bot page
│   │   │   ├── transactions/ # Components for transactions page
│   │   │   ├── Chat.tsx      # AI chat interface component
│   │   │   └── MarketUpdates.tsx # Component for market updates
│   │   ├── contexts/         # React context for global state management
│   │   ├── pages/            # Page-level components for routing
│   │   ├── routes/           # Route definitions
│   │   ├── styles/           # Global styles and CSS
│   │   ├── types/            # TypeScript type definitions
│   │   └── ui/               # Shared UI components
│   ├── public/               # Public assets
│   ├── package.json          # Frontend dependencies
│   ├── tailwind.config.js    # TailwindCSS configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── README.md             # Frontend README file (optional)
├── core/                     # Core configurations or shared logic (if applicable)
├── .gitignore                # Git ignore rules
├── README.md                 # Main README for the project
├── requirements.txt          # Python dependencies
└── certificates/             # SSL certificates for HTTPS (if used)


🔧 Setup Instructions
Prerequisites

    Python 3.12+
    Node.js and npm
    SQLite (pre-installed with Python)

Backend Setup

    Clone the repository:

git clone https://github.com/oksarunas/stock_manager.git
cd stock_manager/backend

Set up a virtual environment:

python -m venv venv
source venv/bin/activate  # For Linux/Mac
venv\Scripts\activate     # For Windows

Install dependencies:

pip install -r requirements.txt

Set up environment variables:

    Create a .env file and add the following:

    GEMINI_API_KEY=your_api_key_here

Run the backend server:

    uvicorn main:app --reload

Frontend Setup

    Navigate to the frontend folder:

cd stock_manager/frontend

Install dependencies:

npm install

Start the development server:

    npm start

📊 Demo

Include screenshots or GIFs of:

    The portfolio dashboard.
    The AI-generated suggestions.
    A sample transaction workflow.

🤝 Contributing

    Fork the repository.
    Create a feature branch:

git checkout -b feature-name

Commit your changes:

git commit -m "Add your message here"

Push to the branch:

    git push origin feature-name

    Open a pull request.

📝 License

This project is open-source under the MIT License.
🌟 Acknowledgements

    FastAPI
    React
    TailwindCSS
    Gemini Language Model API
