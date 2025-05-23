class Timer {
  constructor(display) {
    this.display = display;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.isRunning = false;
    this.interval = null;
  }
  
  start() {
    if (!this.isRunning) {
      this.startTime = Date.now() - this.elapsedTime;
      this.interval = setInterval(() => this.updateTime(), 10);
      this.isRunning = true;
      this.display.classList.add('running');
      return true;
    }
    return false;
  }
  
  stop() {
    if (this.isRunning) {
      clearInterval(this.interval);
      this.elapsedTime = Date.now() - this.startTime;
      this.isRunning = false;
      this.display.classList.remove('running');
      return this.getTime();
    }
    return false;
  }
  
  reset() {
    clearInterval(this.interval);
    this.elapsedTime = 0;
    this.isRunning = false;
    this.updateDisplay();
  }
  
  getTime() {
    return this.elapsedTime / 1000;
  }
  
  updateTime() {
    this.elapsedTime = Date.now() - this.startTime;
    this.updateDisplay();
  }
  
  updateDisplay() {
    const time = this.elapsedTime / 1000;
    this.display.textContent = time.toFixed(2);
  }
  
  setReady() {
    this.display.textContent = "0.00";
    this.display.style.color = "#28a745";
    this.display.classList.add('ready');
  }

  clearReady() {
    this.display.style.color = "";
    this.display.classList.remove('ready', 'running');
  }
}