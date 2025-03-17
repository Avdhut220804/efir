import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from '../../config/api';

// ... rest of the ComplaintForm.js file ...

// Example usage of API_BASE_URL within a function:

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/user/register`, // Updated API endpoint
        formData
      );
      // ... rest of the handleSubmit function ...
    } catch (error) {
      // ... error handling ...
    }
  };

// ... rest of the ComplaintForm.js file ...