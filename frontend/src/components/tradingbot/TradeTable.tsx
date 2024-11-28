import React, { useEffect, useState } from "react";
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

  const loadTrades = async () => {
    setLoading(true);
    const response = await fetchTrades(
      paginationModel.pageSize,
      paginationModel.page * paginationModel.pageSize
    );
    if (response.success && response.data) {
      const formattedTrades = response.data.trades.map(trade => ({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div style={{ height: 600, width: "100%" }}>
      <h2>Trades</h2>
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
      />
    </div>
  );
};

export default TradesTable;
