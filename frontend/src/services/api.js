import axios from 'axios';

//! API Configuration
const API_URL = 'https://molex.cloud/api';
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

//! Register user
export const registerUser = async ({ username, password, inviteCode }) => {
  try {
    const response = await api.post('/auth/register', { username, password, inviteCode });
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

// ! Get all files
export const getAllFiles = async () => {
  try {
    const token = localStorage.getItem('token');
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await api.get('/files', {
      headers,
    });
    let { publicFiles, publicFileTypeCounts, privateFiles, privateFileTypeCounts, userFiles, userFileTypeCounts } = response.data;
    return { publicFiles, publicFileTypeCounts, privateFiles, privateFileTypeCounts, userFiles, userFileTypeCounts };
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

    const response = await api.get(`/files/${fileId}`, {
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

// ! Delete file
export const deleteFile = async (fileId) => {

  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await api.delete(`/files/${fileId}`, { headers });
    return response;
  } catch (error) {
    if (error.response.status === 400) {
      return error.response;
    }
    throw error;
  }
};

//! Generate invite code
export const generateInviteCode = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage');
    }

    const response = await api.get('/auth/generate', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.code;
  } catch (error) {
    throw error;
  }
};

//! Get user invite codes
export const getUserInviteCodes = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage');
    }

    const response = await api.get('/auth/invite-codes', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error) {
    throw error;
  }

};

// ! Delete user invite code
export const deleteUserInviteCode = async (codeId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage');
    }

    const response = await api.delete(`/auth/invite-codes/${codeId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response;
  } catch (error) {
    throw error;
  }
};

// ! Get plex recently added items
export const getPlexItems = async () => {
  try {
    const response = await api.get('/plex/recently-added?count=6');
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Get all Plex Requests
export const getPlexRequests = async () => {
  try {
    const response = await api.get('/plex/requests');
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Get Plex Requests by name
export const getPlexRequestsByName = async (name) => {
  try {
    const response = await api.get(`/plex/requests/${name}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

//! Add a plex request
export const addPlexRequest = async (type, request) => {
  try {
    const response = await api.post('/plex/request', { type, request });
    return response;
  } catch (error) {
    throw error;
  }
};

//! Update Plex request status
export const updatePlexRequestStatus = async (name, status) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage');
    }
    const response = await api.post(`/plex/requests/${name}`, { 
      status 
    },{
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
};

//! Delete plex request
export const deletePlexRequest = async (requestId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token not found in localStorage');
    }
    const response = await api.delete(`/plex/requests/${requestId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response;
  } catch (error) {
    throw error;
  }
};