// Navbar.tsx

import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton, // Import ListItemButton
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircle from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TradeIcon from '@mui/icons-material/TrendingUp';
import BotIcon from '@mui/icons-material/Android'; // New icon for TradingBot
import BudgetIcon from '@mui/icons-material/MonetizationOn';
import InsightsIcon from '@mui/icons-material/Insights'; // Icon for Fear & Greed
import BarChartIcon from '@mui/icons-material/BarChart'; // Icon for Analyze
import LogoutIcon from '@mui/icons-material/Logout'; // New icon for Logout

interface NavbarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface MenuItem {
  text: string;
  icon: React.ReactElement;
  path?: string;
  action?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, onLogout }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const menuItems: MenuItem[] = isAuthenticated
    ? [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Portfolio', icon: <AccountBalanceWalletIcon />, path: '/portfolio' },
        { text: 'Trade', icon: <TradeIcon />, path: '/trade' },
        { text: 'TradingBot', icon: <BotIcon />, path: '/tradingbot' },
        { text: 'Transactions', icon: <HistoryIcon />, path: '/transactions' },
        { text: 'Budget', icon: <BudgetIcon />, path: '/budget' },
        { text: 'Search', icon: <SearchIcon />, path: '/search' },
        { text: 'Fear & Greed', icon: <InsightsIcon />, path: '/fear-greed' },
        { text: 'Analyze', icon: <BarChartIcon />, path: '/analyze' },
        { text: 'Logout', icon: <LogoutIcon />, action: handleLogout },
      ]
    : [
        { text: 'Login', icon: <LoginIcon />, path: '/login' },
        { text: 'Register', icon: <PersonAddIcon />, path: '/register' },
      ];

  const renderMenuButtons = () =>
    menuItems.map((item) =>
      item.path ? (
        <Button
          key={item.text}
          component={RouterLink}
          to={item.path}
          color="inherit"
          startIcon={item.icon}
          sx={{ color: 'white' }}
        >
          {item.text}
        </Button>
      ) : (
        <Button
          key={item.text}
          onClick={() => {
            if (item.action) item.action();
          }}
          startIcon={item.icon}
          color="inherit"
          sx={{ color: 'white' }}
        >
          {item.text}
        </Button>
      )
    );

  const renderDrawerMenu = () => (
    <Box sx={{ width: 250 }} role="presentation">
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            {item.path ? (
              <ListItemButton
                component={RouterLink}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ) : (
              <ListItemButton
                onClick={() => {
                  if (item.action) item.action();
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            )}
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <AppBar position="static" color="primary" sx={{ boxShadow: 3 }}>
      <Toolbar>
        {/* Logo/Title */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            color: 'white',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Stock Manager
        </Typography>

        {isMobile ? (
          // Mobile view: Hamburger menu
          <>
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
              aria-label="menu"
              sx={{ color: 'white' }}
            >
              <MenuIcon />
            </IconButton>
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
              {renderDrawerMenu()}
            </Drawer>
          </>
        ) : (
          // Desktop view: Display buttons
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {renderMenuButtons()}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;