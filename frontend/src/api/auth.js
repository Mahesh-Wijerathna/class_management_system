const API_URL = 'http://localhost:8000'; // Your backend API base URL

export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // Throw an error with the backend's message if the response is not OK
      throw new Error(data.message || 'Login failed');
    }

    // Return the successful response data
    return data;

  } catch (error) {
    console.error("An error occurred during login:", error);
    throw error; // Re-throw the error so the calling component can handle it
  }
};

export const register = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/api/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
             // Throw an error with the backend's message if the response is not OK
            throw new Error(data.message || 'Registration failed');
        }

        // Return the successful response data
        return data;

      } catch (error) {
        console.error("An error occurred during registration:", error);
        throw error; // Re-throw the error so the calling component can handle it
      }
};

// You will add the register function here next 