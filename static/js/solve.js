document.addEventListener('DOMContentLoaded', function() {
  const cubeTypeSelect = document.getElementById('cubeType');
  const scrambleDisplay = document.getElementById('scrambleDisplay');
  const timerDisplay = document.getElementById('timer');
  const startStopBtn = document.getElementById('startStopBtn');
  const dnfBtn = document.getElementById('dnfBtn');
  const plusTwoBtn = document.getElementById('plusTwoBtn');
  const newScrambleBtn = document.getElementById('newScrambleBtn');
  const container = document.querySelector('.container');
  
  let startTime;
  let elapsedTime = 0;
  let timerInterval;
  let isRunning = false;
  let isReady = false;
  let spacebarHeld = false;
  let readyTimeout = null;
  let currentScramble = '';
  let lastSolveId = null;
  
  const timer = new Timer(timerDisplay);
  
getNewScramble(cubeTypeSelect, scrambleDisplay).then(scramble => {
  currentScramble = scramble;
});
  
  startStopBtn.addEventListener('click', function() {
    if (timer.isRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  });
  
  newScrambleBtn.addEventListener('click', function() {
    getNewScramble(cubeTypeSelect, scrambleDisplay).then(scramble => {
      currentScramble = scramble;
    });
  });
  
  cubeTypeSelect.addEventListener('change', function() {
    timer.reset();
    
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('btn-danger', 'btn-warning');
    startStopBtn.classList.add('btn-success');
    
    dnfBtn.disabled = true;
    plusTwoBtn.disabled = true;
    
    getNewScramble(cubeTypeSelect, scrambleDisplay).then(scramble => {
      currentScramble = scramble;
    });
  });
  
  // Penalty button event listeners
  dnfBtn.addEventListener('click', function() {
    handlePenalty('dnf');
  });

  plusTwoBtn.addEventListener('click', function() {
    handlePenalty('plustwo');
  });
  
  // Keyboard listeners for spacebar
  document.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      e.preventDefault();
      
      if (timer.isRunning) {
        stopTimer();
        return;
      }
      
      if (!spacebarHeld) {
        spacebarHeld = true;
        
        readyTimeout = setTimeout(() => {
          if (spacebarHeld) {
            isReady = true;
            timer.setReady();
            
            startStopBtn.textContent = 'Ready';
            startStopBtn.classList.remove('btn-success', 'btn-danger');
            startStopBtn.classList.add('btn-warning');
          }
        }, 200);
      }
    }
  });
  
  document.addEventListener('keyup', function(e) {
    if (e.code === 'Space') {
      if (spacebarHeld) {
        spacebarHeld = false;
        
        if (readyTimeout) {
          clearTimeout(readyTimeout);
          readyTimeout = null;
        }
        
        if (isReady && !timer.isRunning) {
          isReady = false;
          timer.clearReady();
          startTimer();
        } else {
          isReady = false;
          timer.clearReady();
          
          startStopBtn.textContent = 'Start';
          startStopBtn.classList.remove('btn-warning', 'btn-danger');
          startStopBtn.classList.add('btn-success');
        }
      }
    }
  });
  
  // Core timer functions
  function startTimer() {
    timer.start();
    startStopBtn.textContent = 'Stop';
    startStopBtn.classList.remove('btn-success', 'btn-warning');
    startStopBtn.classList.add('btn-danger');
    dnfBtn.disabled = true;
    plusTwoBtn.disabled = true;
  }

  function stopTimer() {
    const finalTime = timer.stop();
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('btn-danger', 'btn-warning');
    startStopBtn.classList.add('btn-success');
    
    handleSaveSolve(finalTime);
  }
  
  function handleSaveSolve(solveTime) {
    saveSolve(solveTime, cubeTypeSelect.value, currentScramble)
      .then(data => {
        if (data.success) {
          lastSolveId = data.solveId;
          
          const successAlert = document.createElement('div');
          successAlert.className = 'alert alert-success alert-dismissible fade show mt-3';
          successAlert.innerHTML = `
            <strong>Solve saved!</strong> Time: ${solveTime.toFixed(2)}s
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          `;
          document.querySelector('.timer-container').appendChild(successAlert);
          
          getNewScramble(cubeTypeSelect, scrambleDisplay).then(scramble => {
            currentScramble = scramble;
          });
          
          timer.reset();
          
          plusTwoBtn.disabled = false;
          dnfBtn.disabled = false;
          
          setTimeout(() => {
            successAlert.classList.remove('show');
            setTimeout(() => successAlert.remove(), 300);
          }, 1500);
          
          updateRecentSolves(container, data.solveId, solveTime, cubeTypeSelect.value, currentScramble, data.date);
        } else {
          alert('Error saving solve: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error saving solve:', error);
        alert('Error saving solve. Please try again.');
      });
  }
  
  function handlePenalty(penaltyType) {
    if (!lastSolveId) {
      alert('No solve available to apply penalty');
      return;
    }
    
    applyPenalty(lastSolveId, penaltyType)
      .then(data => {
        if (data.success) {
          const penaltyText = penaltyType === 'dnf' ? 'DNF' : '+2 seconds';
          const alertClass = penaltyType === 'dnf' ? 'alert-danger' : 'alert-warning';
          
          const penaltyAlert = document.createElement('div');
          penaltyAlert.className = `alert ${alertClass} alert-dismissible fade show mt-3`;
          penaltyAlert.innerHTML = `
            <strong>Penalty applied: ${penaltyText}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          `;
          document.querySelector('.timer-container').appendChild(penaltyAlert);
          
          setTimeout(() => {
            penaltyAlert.classList.remove('show');
            setTimeout(() => penaltyAlert.remove(), 300);
          }, 1500);
          
          const timeCell = document.querySelector(`tr[data-solve-id="${lastSolveId}"] td:nth-child(3)`);
          
          if (timeCell) {
            if (penaltyType === 'dnf') {
              timeCell.textContent = 'DNF';
              timeCell.classList.add('penalty-dnf');
            } else {
              const newTime = typeof data.newTime === 'number' ? data.newTime.toFixed(2) : data.newTime;
              timeCell.textContent = `${newTime}s`;
              timeCell.classList.add('penalty-plus2');
            }
          }
          
          plusTwoBtn.disabled = true;
          dnfBtn.disabled = true;
          
          lastSolveId = null;
        } else {
          alert('Error applying penalty: ' + data.error);
        }
      })
      .catch(error => {
        console.error('Error applying penalty:', error);
        alert('Error applying penalty. Please try again.');
      });
  }
});