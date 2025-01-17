// API endpoint for schedule operations
const API_URL = 'http://localhost:5000/api/schedule'; // Replace with your backend URL

// DOM elements
const scheduleTableBody = document.querySelector('table tbody');
const searchInput = document.getElementById('search');
const saveAddButton = document.getElementById('save-schedule-btn'); // Save button in Add Modal

// Fetch schedules and update the table
const getSchedules = async () => {
  try {
    const response = await fetch(API_URL);
    const schedules = await response.json();

    // Clear table before adding new rows
    scheduleTableBody.innerHTML = '';

    // Populate table rows with schedule data
    schedules.forEach(schedule => {
      const formattedDate = formatDateForDisplay(schedule.date);
      const formattedTime = new Date(`2000-01-01T${schedule.time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${schedule.clientID}</td>
        <td>${schedule.clientName}</td>
        <td>${schedule.aesthetician}</td>
        <td>${schedule.treatment}</td>
        <td>${formattedDate}</td>
        <td>${formattedTime}</td>
        <td>
          <button class="btn btn-warning" onclick="editSchedule('${schedule._id}')">
            <ion-icon name="create-outline"></ion-icon>
          </button>
          <button class="btn btn-danger" onclick="deleteSchedule('${schedule._id}')">
            <ion-icon name="trash-outline"></ion-icon>
          </button>
        </td>
      `;
      scheduleTableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
  }
};

// Create a new client
const createSchedule = async (formData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from server:', errorText);
      throw new Error('Failed to create client');
    }

    await response.json();
    getSchedules(); // Refresh client list after adding

    // Clear form fields and hide modal after successful submission
    document.getElementById('add-schedule-form').reset();
    const addModal = bootstrap.Modal.getInstance(document.getElementById('add-client')); // Use the correct ID here
    if (addModal) {
      addModal.hide();
    } else {
      console.warn('Modal instance not found.');
    }
  } catch (error) {
    console.error('Error creating client:', error);
  }
};



document.addEventListener('DOMContentLoaded', () => {
  const saveAddButton = document.getElementById('save-client');
  if (!saveAddButton) {
    console.error('Save button not found!');
    return;
  }

  saveAddButton.addEventListener('click', () => {
    // Check if modal exists
    const modal = document.getElementById('add-client');
    if (!modal) {
      console.error('Modal with ID "add-client" not found!');
      return;
    }

    const clientIDInput = document.getElementById('add-client-id');
    const clientNameInput = document.getElementById('add-client-name');
    const aestheticianInput = document.getElementById('add-aesthetician');
    const treatmentInput = document.getElementById('add-treatment');
    const dateInput = document.getElementById('add-date');
    const timeInput = document.getElementById('add-time');

    if (
      !clientIDInput ||
      !clientNameInput ||
      !aestheticianInput ||
      !treatmentInput ||
      !dateInput ||
      !timeInput
    ) {
      console.error('One or more input elements are missing!');
      return;
    }

    const scheduleData = {
      clientID: clientIDInput.value.trim(),
      clientName: clientNameInput.value.trim(),
      aesthetician: aestheticianInput.value.trim(),
      treatment: treatmentInput.value.trim(),
      date: dateInput.value.trim(),
      time: timeInput.value.trim(),
    };

    if (Object.values(scheduleData).some(value => value === '')) {
      alert('Please fill in all the fields');
      return;
    }

    createSchedule(scheduleData);
  });
});


// Edit a schedule
const editSchedule = async (scheduleId) => {
  try {
    const response = await fetch(`${API_URL}/${scheduleId}`);
    const schedule = await response.json();

    // Populate the Edit Schedule modal with existing data
    document.getElementById('edit-client-id').value = schedule.clientID;
    document.getElementById('edit-client-name').value = schedule.clientName;
    document.getElementById('edit-aesthetician').value = schedule.aesthetician;
    document.getElementById('edit-treatment').value = schedule.treatment;
    document.getElementById('edit-date').value = schedule.date;
    document.getElementById('edit-time').value = schedule.time;

    // Show the modal
    const editModal = new bootstrap.Modal(document.getElementById('edit'));
    editModal.show();

    // Remove any existing event listener from the save button
    const saveButton = document.getElementById('save-schedule-btn');
    const oldSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(oldSaveButton, saveButton);

    // Add new event listener
    oldSaveButton.addEventListener('click', async () => {
      await updateSchedule(scheduleId);
    });

  } catch (error) {
    console.error('Error fetching schedule for editing:', error);
  }
};

// Helper function to format date for display only
const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Update a schedule
const updateSchedule = async (scheduleId) => {
  try {
    console.log('Updating schedule:', scheduleId);
    
    // Keep the original ISO date format for the server
    const updatedScheduleData = {
      clientID: document.getElementById('edit-client-id').value.trim(),
      clientName: document.getElementById('edit-client-name').value.trim(),
      aesthetician: document.getElementById('edit-aesthetician').value.trim(),
      treatment: document.getElementById('edit-treatment').value.trim(),
      date: document.getElementById('edit-date').value, // Keep original ISO format
      time: document.getElementById('edit-time').value.trim(),
    };

    console.log('Update data:', updatedScheduleData);

    const updateUrl = `${API_URL}/${scheduleId}`;
    console.log('Making PATCH request to:', updateUrl);

    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(updatedScheduleData)
    });

    if (response.ok) {
      console.log('Schedule updated successfully');
      getSchedules(); // Refresh the table
      const editModal = bootstrap.Modal.getInstance(document.getElementById('edit'));
      editModal.hide();
    } else {
      const errorData = await response.json();
      console.error('Server response:', errorData);
      alert(errorData.error || 'Failed to update schedule');
    }
  } catch (error) {
    console.error('Error updating schedule:', error);
    alert('An unexpected error occurred while updating the schedule.');
  }
};

// Delete a schedule
const deleteSchedule = async (scheduleId) => {
  if (confirm('Are you sure you want to delete this schedule record?')) {
    try {
      await fetch(`${API_URL}/${scheduleId}`, { method: 'DELETE' });
      getSchedules(); // Refresh schedule list after deletion
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  }
};

// Search functionality
const handleSearch = () => {
  const query = searchInput.value.toLowerCase();
  const rows = scheduleTableBody.getElementsByTagName('tr');

  Array.from(rows).forEach(row => {
    const cells = row.getElementsByTagName('td');
    const scheduleData = Array.from(cells).map(cell => cell.textContent.toLowerCase());

    const matches = scheduleData.some(data => data.includes(query));
    row.style.display = matches ? '' : 'none';
  });
};

// Event listener for search input
searchInput.addEventListener('input', handleSearch);

// Initialize schedule list
getSchedules();
