import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
} from "@mui/material";
import { fetchTrades } from "../../api";
import * as Interfaces from "../../types/interfaces";

const TradesTable: React.FC = () => {
  const [trades, setTrades] = useState<Interfaces.Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // Zero-based index for the page
    pageSize: 10, // Number of trades per page
  });
  const [totalTrades, setTotalTrades] = useState(0); // Total number of trades

  const loadTrades = useCallback(async () => {
    setLoading(true);
    setError(null); // Reset error state
    try {
      const limit = paginationModel.pageSize;
      const offset = paginationModel.page * paginationModel.pageSize;
      const response = await fetchTrades(limit, offset);
      if (response.success && response.data) {
        const formattedTrades = response.data.trades.map((trade) => ({
          ...trade,
          timestamp: new Date(trade.timestamp).toLocaleString(),
        }));
        setTrades(formattedTrades);
        setTotalTrades(response.data.total); // Update total trades count
      } else {
        setError("Failed to fetch trades. Please try again later.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [paginationModel]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  return (
    <Card sx={{ boxShadow: 3, borderRadius: 2, bgcolor: "grey.900", p: 2 }}>
      <CardHeader title="Trades" sx={{ color: "text.primary" }} />
      <CardContent>
        {loading ? (
          <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center" }}>
            Loading...
          </Typography>
        ) : error ? (
          <Typography variant="body1" sx={{ color: "red", textAlign: "center" }}>
            {error}
          </Typography>
        ) : trades.length === 0 ? (
          <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center" }}>
            No trades available.
          </Typography>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "text.secondary" }}>Timestamp</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Action</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Price ($)</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Profit/Loss ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell sx={{ color: "text.primary" }}>{trade.timestamp}</TableCell>
                      <TableCell sx={{ color: "text.primary", fontWeight: "bold" }}>
                        {trade.action}
                      </TableCell>
                      <TableCell sx={{ color: "text.primary" }}>
                        ${trade.price.toFixed(2)}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: trade.profit_loss >= 0 ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {trade.profit_loss >= 0
                          ? `+$${trade.profit_loss.toFixed(2)}`
                          : `-$${Math.abs(trade.profit_loss).toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <TablePagination
              component="div"
              count={totalTrades} // Total trades from the backend
              page={paginationModel.page}
              onPageChange={(event, newPage) =>
                setPaginationModel((prev) => ({ ...prev, page: newPage }))
              }
              rowsPerPage={paginationModel.pageSize}
              onRowsPerPageChange={(event) =>
                setPaginationModel((prev) => ({
                  ...prev,
                  pageSize: parseInt(event.target.value, 10),
                  page: 0, // Reset to first page on page size change
                }))
              }
              rowsPerPageOptions={[5, 10, 20]}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TradesTable;
