function getNewScramble(cubeTypeSelect, scrambleDisplay) {
  const cubeType = cubeTypeSelect.value;
  scrambleDisplay.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';
  
  const visualizerElement = document.getElementById('cubeVisualizer');
  
  return fetch(`/api/scramble/${cubeType}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data.scramble) {
        throw new Error('No scramble returned from server');
      }
      
      scrambleDisplay.textContent = data.scramble;
      
      if (visualizerElement) {
        updateCubeVisualizer(cubeType, data.scramble);
      }
      
      return data.scramble;
    })
    .catch(error => {
      console.error('Error fetching scramble:', error);
      scrambleDisplay.textContent = 'Error loading scramble. Try refreshing.';
      
      if (visualizerElement) {
        visualizerElement.innerHTML = '';
      }
      
      return null;
    });
}

// Save a solve to the server
function saveSolve(time, cubeType, scramble) {
  const solveData = {
    time: time,
    cubeType: cubeType,
    scramble: scramble
  };
  
  return fetch('/api/solve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(solveData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    return response.json();
  });
}

// Apply a penalty to a solve
function applyPenalty(solveId, penaltyType) {
  return fetch('/api/solve/penalty', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      solveId: solveId,
      penaltyType: penaltyType
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    return response.json();
  });
}

// Function to update the cube visualizer
function updateCubeVisualizer(cubeType, scramble) {
  const visualizerElement = document.getElementById('cubeVisualizer');
  if (!visualizerElement) return;
  
  try {
    while (visualizerElement.firstChild) {
      visualizerElement.removeChild(visualizerElement.firstChild);
    }
    
    const puzzleMap = {
      '2x2': '2x2x2',
      '3x3': '3x3x3', 
      '4x4': '4x4x4',
      '5x5': '5x5x5',
      'Megaminx': 'megaminx',
      'Pyraminx': 'pyraminx',
      'Skewb': 'skewb'
    };
    
    const puzzleId = puzzleMap[cubeType] || '3x3x3';
    
    const twistyPlayer = document.createElement('twisty-player');
    twistyPlayer.setAttribute('puzzle', puzzleId);
    twistyPlayer.setAttribute('alg', scramble);
    twistyPlayer.setAttribute('experimental-setup-anchor', 'start');
    twistyPlayer.setAttribute('visualization', 'PG3D');
    twistyPlayer.setAttribute('background', 'none');
    twistyPlayer.setAttribute('control-panel', 'none');
    twistyPlayer.setAttribute('tempo', '1');
    twistyPlayer.style.width = '100%';
    twistyPlayer.style.height = '100%';
    
    visualizerElement.appendChild(twistyPlayer);
  } catch (error) {
    console.error('Error updating cube visualizer:', error);
    visualizerElement.innerHTML = '<div class="alert alert-warning">Visualizer error</div>';
  }
}

// Update the recent solves table with a new solve
function updateRecentSolves(container, solveId, time, cubeType, scramble, date) {
  let recentSolvesTable = container.querySelector('.table tbody');
  
  if (!recentSolvesTable) {
    const recentSolvesCard = document.createElement('div');
    recentSolvesCard.className = 'card mt-5';
    recentSolvesCard.innerHTML = `
      <div class="card-header bg-light">
        <h5 class="card-title mb-0">Recent Solves</h5>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Date</th>
                <th>Cube</th>
                <th>Time</th>
                <th>Scramble</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.appendChild(recentSolvesCard);
    recentSolvesTable = recentSolvesCard.querySelector('tbody');
  }
  
  // Create new row
  const newRow = document.createElement('tr');
  newRow.setAttribute('data-solve-id', solveId);
  newRow.innerHTML = `
    <td>${date || new Date().toLocaleString()}</td>
    <td>${cubeType}</td>
    <td>${typeof time === 'number' ? time.toFixed(2) + 's' : time}</td>
    <td class="text-truncate" style="max-width: 200px;">${scramble}</td>
  `;
  
  // Insert at top of table
  if (recentSolvesTable.firstChild) {
    recentSolvesTable.insertBefore(newRow, recentSolvesTable.firstChild);
  } else {
    recentSolvesTable.appendChild(newRow);
  }
  
  // If we have more than 5 rows, remove the last one
  if (recentSolvesTable.children.length > 5) {
    recentSolvesTable.removeChild(recentSolvesTable.lastChild);
  }
}