import axios from 'axios';

//! API Configuration
const API_URL = 'https://molex.cloud:3222';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

//! Register user
export const registerUser = async ({ username, password }) => {
  try {
    const response = await api.post('/auth/register', { username, password });
    console.log(response)
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Login user
export const loginUser = async ({ username, password }) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Get public files
export const getPublicFiles = async () => {
  try {
    const response = await api.get('/files');
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Get private files
export const getPrivateFiles = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage');
    }

    const response = await api.get('/files/private', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Upload file via HTTP
export const uploadFileChunk = async (formData, isPrivate, totalChunks, chunkNumber) => {
  try {
    const response = await axios.post(`${API_URL}/files/upload/chunk`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        isPrivate: isPrivate.toString(),
        totalChunks: totalChunks.toString(),
        chunkNumber: chunkNumber.toString(),
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

//! Get file types and their counts
export const getFileTypesCounts = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await api.get('/files/filetypes', { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Download file
export const downloadFile = async (fileId, fileName) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await api.get(`/files/download/${fileId}`, {
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const url = window.URL.createObjectURL(response.data);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();

    link.remove();

    return response;
  } catch (error) {
    throw error;
  }
};

