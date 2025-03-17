import axios from "axios";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from '../../config/api';

function ComplaintForm() {
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const complaintData = Object.fromEntries(formData.entries());

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/complaints`, // Updated API endpoint
        complaintData
      );
      console.log('Complaint submitted successfully:', response.data);
      navigate('/success'); // Or appropriate navigation
    } catch (error) {
      console.error('Error submitting complaint:', error);
      // Handle error appropriately, e.g., display an error message
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit">Submit Complaint</button>
    </form>
  );
}

export default ComplaintForm;