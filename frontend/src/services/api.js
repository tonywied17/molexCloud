import axios from 'axios';

const API_URL = 'http://localhost:3222/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await api.post('/auth/login', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPublicFiles = async () => {
  try {
    const response = await api.get('/files/public');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPrivateFiles = async () => {
  try {
    const response = await api.get('/files/private');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadFileChunk = async (fileData) => {
  try {
    const response = await axios.post(`${API_URL}/files/upload/chunk`, fileData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};