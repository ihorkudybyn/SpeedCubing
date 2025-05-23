document.addEventListener('DOMContentLoaded', function() {
  // Delete individual solve
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      const solveId = this.getAttribute('data-solve-id');
      const row = document.querySelector(`tr[data-solve-id="${solveId}"]`);
      
      if (confirm('Are you sure you want to delete this solve?')) {
        deleteSolve(solveId, row);
      }
    });
  });
  
  // Function to delete a solve via API
  function deleteSolve(solveId, row) {
    fetch(`/api/solve/${solveId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        row.classList.add('fade-out');
        
        setTimeout(() => {
          row.remove();
          
          const remainingRows = document.querySelectorAll('.solve-row');
          if (remainingRows.length === 0) {
            window.location.reload();
          }
        }, 300);
        
        showAlert('Solve deleted successfully', 'success');
      } else {
        showAlert(data.error || 'Failed to delete solve', 'danger');
      }
    })
    .catch(error => {
      console.error('Error deleting solve:', error);
      showAlert('Error deleting solve. Please try again.', 'danger');
    });
  }
  
  // Function to show alert message
  function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);
    
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alertDiv);
      bsAlert.close();
    }, 3000);
  }
  
  // Delete all solves functionality
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const deleteAllConfirm = document.getElementById('deleteAllConfirm');
  const confirmDeleteAll = document.getElementById('confirmDeleteAll');
  const cancelDeleteAll = document.getElementById('cancelDeleteAll');
  
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', function() {
      deleteAllBtn.classList.add('d-none');
      deleteAllConfirm.classList.remove('d-none');
    });
    
    cancelDeleteAll.addEventListener('click', function() {
      deleteAllBtn.classList.remove('d-none');
      deleteAllConfirm.classList.add('d-none');
    });
    
    confirmDeleteAll.addEventListener('click', function() {
      alert('This would delete all solves. Endpoint not implemented yet.');
      deleteAllBtn.classList.remove('d-none');
      deleteAllConfirm.classList.add('d-none');
    });
  }
});