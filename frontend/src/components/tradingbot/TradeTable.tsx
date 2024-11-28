import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { fetchTrades } from "../../api";
import * as Interfaces from "../../types/interfaces";

const TradesTable: React.FC = () => {
  const [trades, setTrades] = useState<Interfaces.Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });
  const [totalCount, setTotalCount] = useState(0);

  const theme = useTheme();

  const loadTrades = async () => {
    setLoading(true);
    const response = await fetchTrades(
      paginationModel.pageSize,
      paginationModel.page * paginationModel.pageSize
    );
    if (response.success && response.data) {
      const formattedTrades = response.data.trades.map((trade) => ({
        ...trade,
        timestamp: new Date(trade.timestamp).toLocaleString(),
      }));
      setTrades(formattedTrades);
      setTotalCount(response.data.total);
    } else {
      console.error("Failed to fetch trades:", response.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrades();
  }, [paginationModel]);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "timestamp", headerName: "Timestamp", width: 200 },
    { field: "action", headerName: "Action", width: 150 },
    { field: "ticker", headerName: "Ticker", width: 100 },
    { field: "price", headerName: "Price ($)", width: 150 },
    { field: "quantity", headerName: "Quantity", width: 150 },
    { field: "profit_loss", headerName: "Profit/Loss ($)", width: 150 },
    { field: "budget", headerName: "Budget ($)", width: 150 },
  ];

  return (
    <Card
      sx={{
        boxShadow: 3,
        borderRadius: 2,
        bgcolor: "grey.900",
      }}
    >
      <CardHeader
        title="Trades"
        sx={{ color: "text.primary" }}
      />
      <CardContent>
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={trades}
            columns={columns}
            pagination
            paginationMode="server"
            rowCount={totalCount}
            paginationModel={paginationModel}
            onPaginationModelChange={(newModel) => setPaginationModel(newModel)}
            pageSizeOptions={[10, 20, 50]}
            loading={loading}
            sx={{
              bgcolor: "grey.900",
              color: "text.primary",
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "grey.800",
                color: "text.secondary",
                fontWeight: "bold",
                borderBottom: `1px solid ${theme.palette.divider}`,
              },
              "& .MuiDataGrid-row": {
                "&:hover": {
                  bgcolor: "grey.800",
                },
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TradesTable;
