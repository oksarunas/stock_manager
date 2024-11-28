import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api';
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

interface RegisterProps {
  onRegisterSuccess: (userId: number) => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || budget === '') {
      setError("All fields are required.");
      return;
    }

    try {
      const response = await registerUser(username, password, Number(budget));
      if (response?.data?.user_id) {
        onRegisterSuccess(response.data.user_id);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error("Registration error:", err);
    }
  };

  return (
    <Box className="flex justify-center items-center min-h-screen bg-primary">
      <Card className="max-w-md w-full p-4 shadow-lg">
        <CardHeader
          title={
            <Typography variant="h4" className="text-center font-semibold text-accent">
              Register
            </Typography>
          }
        />
        <CardContent>
          {error && (
            <Typography variant="body2" color="error" className="text-center mb-4">
              {error}
            </Typography>
          )}
          <form onSubmit={handleRegister} className="space-y-4">
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            <TextField
              label="Initial Budget"
              type="number"
              variant="outlined"
              fullWidth
              value={budget}
              onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
              placeholder="Initial Budget"
              required
              inputProps={{ min: 0 }}
            />
          </form>
        </CardContent>
        <CardActions>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleRegister}
            className="bg-accent hover:bg-accent-dark"
          >
            Register
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
};

export default Register;
