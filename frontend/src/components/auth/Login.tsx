import React, { useState } from 'react';
import { loginUser } from '../../api';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardActions,
  TextField,
  Button,
  Typography,
  Box
} from '@mui/material';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await loginUser(username, password);

      if (response && response.success && response.data) {
        console.log("Login successful, username and user_id should be stored in localStorage.");
        onLoginSuccess(); // Trigger success callback
        navigate('/dashboard');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      console.error("Login error:", error);
    }
  };

  return (
    <Box className="flex justify-center items-center min-h-screen bg-primary">
      <Card className="max-w-md w-full p-4 shadow-lg">
        <CardHeader
          title={
            <Typography variant="h4" className="text-accent font-semibold text-center">
              Login
            </Typography>
          }
        />
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              color="primary"
              sx={{ bgcolor: 'background.paper' }}
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              color="primary"
              sx={{ bgcolor: 'background.paper' }}
            />
            {error && (
              <Typography variant="body2" color="error" align="center" className="mt-2">
                {error}
              </Typography>
            )}
          </form>
        </CardContent>
        <CardActions>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleLogin}
            className="bg-accent hover:bg-accent-dark"
          >
            Login
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default Login;
