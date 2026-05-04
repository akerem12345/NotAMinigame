const API_URL = 'http://localhost:8080/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('jwt_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse error JSON or just throw generic error
    let errorMessage = `API request failed with status ${response.status}`;
    try {
        const errJson = await response.json();
        errorMessage = errJson.message || errorMessage;
    } catch(e) {}
    throw new Error(errorMessage);
  }

  // Handle empty responses gracefully (e.g. DELETE returns 204 No Content)
  if (response.status === 204) return null;

  return response.json();
};

export const submitScore = async (gameType, score, metadata = {}) => {
  return apiFetch('/scores', {
    method: 'POST',
    body: JSON.stringify({ gameType, score, metadata })
  });
};
