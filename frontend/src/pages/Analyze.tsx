// pages/Analyze.tsx
import React, { useEffect, useReducer } from "react";
import { Pie, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";
import { fetchPortfolioAnalysis } from "../api"; // Ensure this is defined and working
import { PortfolioAnalysisResponse, ChatMessage } from "../types/interfaces";
import Chat from "../components/Chat";
import { sendChatMessage } from "../api";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

type State = {
    portfolioWeights: { ticker: string; weight: number }[];
    sectorDistribution: { sector: string; percentage: number }[];
    sp500Comparison: { portfolio_return: number; sp500_return: number } | null;
    suggestions: string[];
    loading: boolean;
    error: boolean;
};

type Action =
    | { type: "FETCH_SUCCESS"; payload: PortfolioAnalysisResponse }
    | { type: "FETCH_ERROR" };

const initialState: State = {
    portfolioWeights: [],
    sectorDistribution: [],
    sp500Comparison: null,
    suggestions: [],
    loading: true,
    error: false,
};

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "FETCH_SUCCESS":
            return {
                ...state,
                portfolioWeights: action.payload.weights,
                sectorDistribution: action.payload.sectors,
                sp500Comparison: action.payload.sp500_comparison,
                suggestions: action.payload.suggestions,
                loading: false,
                error: false,
            };
        case "FETCH_ERROR":
            return {
                ...state,
                loading: false,
                error: true,
            };
        default:
            return state;
    }
}

function generateColors(length: number) {
    return Array.from({ length }, () => {
        const color = Math.floor(Math.random() * 16777215).toString(16);
        return `#${color}`;
    });
}

const Analyze: React.FC = () => {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const userId = Number(localStorage.getItem("user_id"));
                const data = await fetchPortfolioAnalysis(userId);
                dispatch({ type: "FETCH_SUCCESS", payload: data });
            } catch (error) {
                console.error("Failed to fetch analysis data:", error);
                dispatch({ type: "FETCH_ERROR" });
            }
        };

        fetchAnalysis();
    }, []);

    const handleChatSend = async (message: string): Promise<ChatMessage | null> => {
        try {
            const response = await sendChatMessage(message);
            return response;
        } catch (error) {
            console.error("Failed to send chat message:", error);
            return null;
        }
    };

    if (state.loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-blue-500 h-12 w-12 mb-4 animate-spin"></div>
                <p>Loading your portfolio analysis...</p>
            </div>
        );
    }

    if (state.error || (!state.loading && !state.portfolioWeights.length)) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <p className="text-red-600 text-xl">Error loading analysis data. Please try again later.</p>
            </div>
        );
    }

    const pieData = {
        labels: state.sectorDistribution.map((sector) => sector.sector),
        datasets: [
            {
                data: state.sectorDistribution.map((sector) => sector.percentage),
                backgroundColor: generateColors(state.sectorDistribution.length),
            },
        ],
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right" as const,
                labels: {
                    boxWidth: 20,
                    padding: 10,
                },
            },
        },
    };

    const barData = {
        labels: ["Your Portfolio", "S&P 500"],
        datasets: [
            {
                label: "Performance (%)",
                data: [
                    state.sp500Comparison?.portfolio_return ?? 0,
                    state.sp500Comparison?.sp500_return ?? 0,
                ],
                backgroundColor: ["#36A2EB", "#FF6384"],
            },
        ],
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4 text-center">Portfolio Analysis</h1>

            <div className="mb-8 w-full md:w-1/2 mx-auto">
                <h2 className="text-xl font-semibold mb-2 text-center">Sector Distribution</h2>
                <div className="relative w-full h-[300px]">
                    <Pie data={pieData} options={pieOptions} />
                </div>
            </div>

            <div className="mb-8 w-full md:w-1/2 mx-auto">
                <h2 className="text-xl font-semibold mb-2 text-center">Performance Comparison</h2>
                <div className="relative w-full h-[300px]">
                    <Bar data={barData} />
                </div>
            </div>

            <Chat title="Portfolio Chat" onSend={handleChatSend} />
        </div>
    );
};

export default Analyze;
