// frontend/src/components/TradingBot/Charts.tsx
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
    ChartData,
} from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const Charts: React.FC = () => {
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [profitLossData, setProfitLossData] = useState<any>(null);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                // Fetch portfolio performance data
                const portfolioResponse = await axios.get(`/api/performance`);
                setPortfolioData(portfolioResponse.data);

                // Fetch trades data for profit/loss trend
                const tradesResponse = await axios.get(`/api/trades`);
                setProfitLossData(tradesResponse.data.trades);
            } catch (error) {
                console.error("Error fetching chart data:", error);
            }
        };

        fetchChartData();
    }, []);

    const generatePortfolioChartData = (): ChartData<'line'> => {
        if (!portfolioData) {
            return {
                labels: [],
                datasets: [],
            };
        }

        const labels = portfolioData.map((item: any) => item.date);
        const values = portfolioData.map((item: any) => item.portfolio_value);

        return {
            labels,
            datasets: [
                {
                    label: 'Portfolio Value ($)',
                    data: values,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                },
            ],
        };
    };

    const generateProfitLossChartData = (): ChartData<'line'> => {
        if (!profitLossData) {
            return {
                labels: [],
                datasets: [],
            };
        }

        let cumulativeProfitLoss = 0;
        const labels = profitLossData.map((trade: any) => trade.timestamp);
        const values = profitLossData.map((trade: any) => {
            cumulativeProfitLoss += trade.profit_loss || 0;
            return cumulativeProfitLoss;
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Cumulative Profit/Loss ($)',
                    data: values,
                    fill: false,
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1,
                },
            ],
        };
    };

    return (
        <div>
            <h2 className="text-lg font-bold">Charts</h2>
            <div className="mt-6">
                <h3 className="text-md font-semibold">Portfolio Growth</h3>
                {portfolioData ? (
                    <Line data={generatePortfolioChartData()} />
                ) : (
                    <p>Loading portfolio data...</p>
                )}
            </div>
            <div className="mt-6">
                <h3 className="text-md font-semibold">Profit/Loss Trend</h3>
                {profitLossData ? (
                    <Line data={generateProfitLossChartData()} />
                ) : (
                    <p>Loading profit/loss data...</p>
                )}
            </div>
        </div>
    );
};

export default Charts;
