// Required React imports and chart components
import React, { useEffect, useReducer } from "react";
import { Pie, Bar } from "react-chartjs-2"; // Pie and Bar chart components from react-chartjs-2
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js"; // Core Chart.js modules for chart rendering and interactions
import { fetchPortfolioAnalysis } from "../api"; // Function to fetch portfolio analysis data from the backend
import { PortfolioAnalysisResponse } from "../types/interfaces"; // TypeScript type definition for the API response

// Register necessary chart components with Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// TypeScript type for the component state
type State = {
    portfolioWeights: { ticker: string; weight: number }[]; // Portfolio weight distribution by ticker
    sectorDistribution: { sector: string; percentage: number }[]; // Sector distribution data
    sp500Comparison: { portfolio_return: number; sp500_return: number } | null; // Comparison data between the portfolio and the S&P 500
    suggestions: string[]; // Investment suggestions
    loading: boolean; // Loading state
};

// TypeScript type for reducer actions
type Action =
    | { type: "FETCH_SUCCESS"; payload: PortfolioAnalysisResponse } // Action for successful data fetch
    | { type: "FETCH_ERROR" }; // Action for a failed data fetch

// Initial state of the component
const initialState: State = {
    portfolioWeights: [],
    sectorDistribution: [],
    sp500Comparison: null,
    suggestions: [],
    loading: true,
};

// Reducer function to manage state transitions
function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "FETCH_SUCCESS":
            // Update state with fetched data
            return {
                ...state,
                portfolioWeights: action.payload.weights,
                sectorDistribution: action.payload.sectors,
                sp500Comparison: action.payload.sp500_comparison,
                suggestions: action.payload.suggestions,
                loading: false, // Stop loading
            };
        case "FETCH_ERROR":
            // Set loading to false on fetch failure
            return {
                ...state,
                loading: false,
            };
        default:
            // Default case returns current state
            return state;
    }
}

// Analyze component definition
const Analyze: React.FC = () => {
    const [state, dispatch] = useReducer(reducer, initialState); // useReducer hook for state management

    // useEffect to fetch portfolio analysis data on component mount
    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const userId = Number(localStorage.getItem("user_id")); // Retrieve user ID from local storage
                const data = await fetchPortfolioAnalysis(userId); // Fetch data from the API
                dispatch({ type: "FETCH_SUCCESS", payload: data }); // Dispatch success action
            } catch (error) {
                console.error("Failed to fetch analysis data:", error); // Log error
                dispatch({ type: "FETCH_ERROR" }); // Dispatch error action
            }
        };

        fetchAnalysis(); // Trigger data fetch
    }, []);

    // Render loading indicator if data is still being fetched
    if (state.loading) return <div>Loading...</div>;

    // Data for the sector distribution pie chart
    const pieData = {
        labels: state.sectorDistribution.map((sector) => sector.sector), // Sector labels
        datasets: [
            {
                data: state.sectorDistribution.map((sector) => sector.percentage), // Sector percentages
                backgroundColor: [
                    "#FF6384", // Colors for pie chart slices
                    "#36A2EB",
                    "#FFCE56",
                    "#4BC0C0",
                    "#9966FF",
                    "#FF9F40",
                ],
            },
        ],
    };

    // Options for the pie chart
    const pieOptions = {
        responsive: true, // Makes the chart responsive
        maintainAspectRatio: false, // Allows flexible resizing
        plugins: {
            legend: {
                position: 'right' as const, // Legend position
                labels: {
                    boxWidth: 20,
                    padding: 10,
                },
            },
        },
    };

    // Data for the performance comparison bar chart
    const barData = {
        labels: ["Your Portfolio", "S&P 500"], // X-axis labels
        datasets: [
            {
                label: "Performance (%)", // Dataset label
                data: [
                    state.sp500Comparison?.portfolio_return ?? 0, // Portfolio performance
                    state.sp500Comparison?.sp500_return ?? 0, // S&P 500 performance
                ],
                backgroundColor: ["#36A2EB", "#FF6384"], // Colors for bars
            },
        ],
    };

    // Component rendering
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Portfolio Analysis</h1>

            {/* Sector Distribution Chart */}
            <div className="mb-8" style={{ width: "400px", height: "400px", margin: "0 auto" }}>
                <h2 className="text-xl font-semibold mb-2">Sector Distribution</h2>
                <Pie data={pieData} options={pieOptions} /> {/* Pie chart component */}
            </div>

            {/* Performance Comparison */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Performance Comparison</h2>
                <Bar data={barData} /> {/* Bar chart component */}
            </div>

            {/* Suggestions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">Suggestions</h2>
                <ul className="list-disc pl-5">
                    {state.suggestions.map((suggestion, index) => (
                        <li key={index} className="mb-2">
                            {suggestion} {/* Render each suggestion */}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Analyze;
