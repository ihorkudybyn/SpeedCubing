document.addEventListener('DOMContentLoaded', function() {
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm_password');
  const submitBtn = document.getElementById('submitBtn');
  
  // Check if we're on the registration page
  if (passwordInput && confirmPasswordInput && submitBtn) {
    const lengthReq = document.getElementById('length');
    const uppercaseReq = document.getElementById('uppercase');
    const numberReq = document.getElementById('number');
    const specialReq = document.getElementById('special');
    
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      
      if (password.length >= 8) {
        lengthReq.classList.replace('text-danger', 'text-success');
      } else {
        lengthReq.classList.replace('text-success', 'text-danger');
      }
      
      if (/[A-Z]/.test(password)) {
        uppercaseReq.classList.replace('text-danger', 'text-success');
      } else {
        uppercaseReq.classList.replace('text-success', 'text-danger');
      }
      
      if (/[0-9]/.test(password)) {
        numberReq.classList.replace('text-danger', 'text-success');
      } else {
        numberReq.classList.replace('text-success', 'text-danger');
      }
      
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        specialReq.classList.replace('text-danger', 'text-success');
      } else {
        specialReq.classList.replace('text-success', 'text-danger');
      }
      
      validateForm();
    });
    
    // Check if passwords match
    confirmPasswordInput.addEventListener('input', function() {
      if (this.value === passwordInput.value) {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
      } else {
        this.classList.remove('is-valid');
        this.classList.add('is-invalid');
      }
      validateForm();
    });
    
    // Enable/disable submit button based on validation
    function validateForm() {
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      
      const lengthValid = password.length >= 8;
      const uppercaseValid = /[A-Z]/.test(password);
      const numberValid = /[0-9]/.test(password);
      const specialValid = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      const passwordsMatch = password === confirmPassword && confirmPassword !== '';
      
      if (lengthValid && uppercaseValid && numberValid && specialValid && passwordsMatch) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    }
  }
});