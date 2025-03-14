// Initialize clock
function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('clock').textContent = `${hours}:${minutes}`;
}

setInterval(updateClock, 1000);
updateClock();

// Window management
let activeWindow = null;
let windows = {};
let zIndex = 10;

function openWindow(id) {
  const windowEl = document.getElementById(id);
  windowEl.style.display = 'block';
  windowEl.style.zIndex = ++zIndex;

  // Update taskbar
  if (!windows[id]) {
    const title = windowEl.querySelector('.window-title').textContent;
    const taskbarItem = document.createElement('button');
    taskbarItem.className = 'win95-btn taskbar-item';
    taskbarItem.textContent = title;
    taskbarItem.onclick = () => toggleWindow(id);
    document.getElementById('taskbar-items').appendChild(taskbarItem);
    windows[id] = { element: windowEl, taskbarItem: taskbarItem };
  }


  // Mark as active
  activeWindow = id;
  updateActiveStates();

  // Hide start menu if open
  document.getElementById('start-menu').classList.remove('active');
}

function closeWindow(id) {
  const windowEl = document.getElementById(id);
  windowEl.style.display = 'none';

  // Remove from taskbar
  if (windows[id]) {
    windows[id].taskbarItem.remove();
    delete windows[id];
  }

  // Reset active window
  if (activeWindow === id) {
    activeWindow = null;
    const openWindowIds = Object.keys(windows);
    if (openWindowIds.length > 0) {
      activeWindow = openWindowIds[openWindowIds.length - 1];
      windows[activeWindow].element.style.zIndex = ++zIndex;
    }
  }

  updateActiveStates();
}

function minimizeWindow(id) {
  const windowEl = document.getElementById(id);
  windowEl.style.display = 'none';

  if (activeWindow === id) {
    activeWindow = null;
    const openWindowIds = Object.keys(windows);
    if (openWindowIds.length > 0) {
      for (let i = 0; i < openWindowIds.length; i++) {
        if (openWindowIds[i] !== id && windows[openWindowIds[i]].element.style.display !== 'none') {
          activeWindow = openWindowIds[i];
          windows[activeWindow].element.style.zIndex = ++zIndex;
          break;
        }
      }
    }
  }

  updateActiveStates();
}

function maximizeWindow(id) {
  const windowEl = document.getElementById(id);

  if (windowEl.dataset.maximized) {
    // Restore
    const pos = JSON.parse(windowEl.dataset.position);
    windowEl.style.top = pos.top;
    windowEl.style.left = pos.left;
    windowEl.style.width = pos.width;
    windowEl.style.height = pos.height;
    delete windowEl.dataset.maximized;
    delete windowEl.dataset.position;
  } else {
    // Maximize
    windowEl.dataset.position = JSON.stringify({
      top: windowEl.style.top,
      left: windowEl.style.left,
      width: windowEl.style.width,
      height: windowEl.style.height
    });

    windowEl.style.top = '0';
    windowEl.style.left = '0';
    windowEl.style.width = '100%';
    windowEl.style.height = 'calc(100% - 40px)';
    windowEl.dataset.maximized = 'true';
  }

  windowEl.style.zIndex = ++zIndex;
  activeWindow = id;
  updateActiveStates();
}

function toggleWindow(id) {
  const windowEl = document.getElementById(id);

  if (windowEl.style.display === 'none') {
    windowEl.style.display = 'block';
    windowEl.style.zIndex = ++zIndex;
    activeWindow = id;
  } else if (activeWindow === id) {
    minimizeWindow(id);
  } else {
    windowEl.style.zIndex = ++zIndex;
    activeWindow = id;
  }

  updateActiveStates();
}

function updateActiveStates() {
  // Update taskbar buttons
  Object.keys(windows).forEach(id => {
    if (id === activeWindow) {
      windows[id].taskbarItem.classList.add('active');
    } else {
      windows[id].taskbarItem.classList.remove('active');
    }
  });
}

// Make windows draggable
document.querySelectorAll('.window').forEach(makeWindowDraggable);

function makeWindowDraggable(windowEl) {
  const header = windowEl.querySelector('.window-header');
  let offsetX, offsetY, isDragging = false;

  header.addEventListener('mousedown', startDrag);
  header.addEventListener('touchstart', startDrag);

  function startDrag(e) {
    if (e.type === 'mousedown') {
      offsetX = e.clientX - windowEl.getBoundingClientRect().left;
      offsetY = e.clientY - windowEl.getBoundingClientRect().top;


      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', stopDrag);
    } else if (e.type === 'touchstart') {
      offsetX = e.touches[0].clientX - windowEl.getBoundingClientRect().left;
      offsetY = e.touches[0].clientY - windowEl.getBoundingClientRect().top;
      document.addEventListener('touchmove', drag);
      document.addEventListener('touchend', stopDrag);
    }

    // Set active window
    windowEl.style.zIndex = ++zIndex;
    activeWindow = windowEl.id;
    updateActiveStates();

    isDragging = true;
    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;
    if (windowEl.dataset.maximized) return;

    let x, y;

    if (e.type === 'mousemove') {
      x = e.clientX - offsetX;
      y = e.clientY - offsetY;
    } else if (e.type === 'touchmove') {
      x = e.touches[0].clientX - offsetX;
      y = e.touches[0].clientY - offsetY;
    }

    // Keep window within viewport
    const rect = windowEl.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;

    x = Math.max(0, Math.min(x, maxX));
    y = Math.max(0, Math.min(y, maxY - 40)); // Consider taskbar

    windowEl.style.left = x + 'px';
    windowEl.style.top = y + 'px';
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', stopDrag);
  }
}

// Start Menu
function toggleStartMenu() {
  const startMenu = document.getElementById('start-menu');
  startMenu.classList.toggle('active');
}

// Close start menu when clicking elsewhere
document.addEventListener('click', function (e) {
  const startMenu = document.getElementById('start-menu');
  const startBtn = document.querySelector('.start-btn');

  if (startMenu.classList.contains('active') &&
    !startMenu.contains(e.target) &&
    !startBtn.contains(e.target)) {
    startMenu.classList.remove('active');
  }
});

// Project Details Handler
function openProjectDetails(projectId) {
  const detailsWindowId = projectId + '-details';
  openWindow(detailsWindowId);
}

// Contact form handler
function sendMessage() {
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const subject = document.getElementById('subject').value;
  const message = document.getElementById('message').value;

  if (!name || !subject || !message) {
    alert('Please fill in all fields!');
    return;
  }

  // Create the email body content using the form values
  const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;

  // Construct the mailto URL
  const mailtoLink = `mailto:albarkahdev@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Open the default email client with the mailto link
  window.location.href = mailtoLink;

  // Simulate sending message
  alert(`Thank you for your message, ${name}!\nI'll get back to you soon at ${email}.`);

  // Clear form
  document.getElementById('name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('subject').value = '';
  document.getElementById('message').value = '';
}

// Breakout Game Implementation
class BreakoutGame {
  constructor() {
    this.container = document.getElementById('game-container');
    this.paddle = document.getElementById('game-paddle');
    this.ball = document.getElementById('game-ball');
    this.scoreElement = document.getElementById('game-score');

    this.startBtn = document.getElementById('start-game');
    this.pauseBtn = document.getElementById('pause-game');
    this.resetBtn = document.getElementById('reset-game');

    this.containerWidth = this.container.offsetWidth;
    this.containerHeight = this.container.offsetHeight;
    this.paddleWidth = this.paddle.offsetWidth;
    this.paddleHeight = this.paddle.offsetHeight;
    this.ballSize = this.ball.offsetWidth;

    this.paddleX = (this.containerWidth - this.paddleWidth) / 2;
    this.ballX = this.containerWidth / 2;
    this.ballY = this.containerHeight / 2;

    this.ballSpeedX = 3;
    this.ballSpeedY = -3;
    this.gameInterval = null;
    this.isGameRunning = false;
    this.isPaused = false;
    this.score = 0;

    this.bricks = [];
    this.brickWidth = 50;
    this.brickHeight = 20;
    this.brickRows = 4;
    this.brickColumns = Math.floor(this.containerWidth / (this.brickWidth + 10));
    this.brickPadding = 10;
    this.brickOffsetTop = 30;

    // Setup event listeners
    this.setupEventListeners();

    // Initial setup
    this.resetGame();
  }

  setupEventListeners() {
    // Mouse/Touch control for paddle
    this.container.addEventListener('mousemove', (e) => {
      if (this.isGameRunning && !this.isPaused) {
        const relativeX = e.clientX - this.container.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < this.containerWidth) {
          this.paddleX = relativeX - this.paddleWidth / 2;

          // Keep paddle within bounds
          if (this.paddleX < 0) this.paddleX = 0;
          if (this.paddleX + this.paddleWidth > this.containerWidth) {
            this.paddleX = this.containerWidth - this.paddleWidth;
          }
        }
      }
    });

    this.container.addEventListener('touchmove', (e) => {
      if (this.isGameRunning && !this.isPaused) {
        e.preventDefault();
        const relativeX = e.touches[0].clientX - this.container.getBoundingClientRect().left;
        if (relativeX > 0 && relativeX < this.containerWidth) {
          this.paddleX = relativeX - this.paddleWidth / 2;

          // Keep paddle within bounds
          if (this.paddleX < 0) this.paddleX = 0;
          if (this.paddleX + this.paddleWidth > this.containerWidth) {
            this.paddleX = this.containerWidth - this.paddleWidth;
          }
        }
      }
    }, { passive: false });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      if (this.isGameRunning && !this.isPaused) {
        if (e.key === 'ArrowLeft') {
          this.paddleX -= 20;
          if (this.paddleX < 0) this.paddleX = 0;
        } else if (e.key === 'ArrowRight') {
          this.paddleX += 20;
          if (this.paddleX + this.paddleWidth > this.containerWidth) {
            this.paddleX = this.containerWidth - this.paddleWidth;
          }
        }
      }
    });

    // Button controls
    this.startBtn.addEventListener('click', () => this.startGame());
    this.pauseBtn.addEventListener('click', () => this.togglePause());
    this.resetBtn.addEventListener('click', () => this.resetGame());

    // Handle window resize
    window.addEventListener('resize', () => {
      this.updateDimensions();
    });
  }

  updateDimensions() {
    this.containerWidth = this.container.offsetWidth;
    this.containerHeight = this.container.offsetHeight;

    // Adjust paddle position
    if (this.paddleX + this.paddleWidth > this.containerWidth) {
      this.paddleX = this.containerWidth - this.paddleWidth;
    }

    // Adjust brick layout
    this.brickColumns = Math.floor(this.containerWidth / (this.brickWidth + 10));
    this.createBricks();
  }

  createBricks() {
    this.bricks = [];

    // Remove any existing brick elements
    const existingBricks = this.container.querySelectorAll('.game-brick');
    existingBricks.forEach(brick => brick.remove());

    for (let r = 0; r < this.brickRows; r++) {
      this.bricks[r] = [];
      for (let c = 0; c < this.brickColumns; c++) {
        this.bricks[r][c] = { x: 0, y: 0, status: 1 };

        const brickX = c * (this.brickWidth + this.brickPadding) + this.brickPadding;
        const brickY = r * (this.brickHeight + this.brickPadding) + this.brickOffsetTop;

        this.bricks[r][c].x = brickX;
        this.bricks[r][c].y = brickY;

        // Create brick element
        const brickElement = document.createElement('div');
        brickElement.className = 'game-brick';
        brickElement.style.left = brickX + 'px';
        brickElement.style.top = brickY + 'px';
        brickElement.style.width = this.brickWidth + 'px';
        brickElement.style.height = this.brickHeight + 'px';

        this.container.appendChild(brickElement);
      }
    }
  }

  drawBall() {
    this.ball.style.left = this.ballX + 'px';
    this.ball.style.top = this.ballY + 'px';
  }

  drawPaddle() {
    this.paddle.style.left = this.paddleX + 'px';
  }

  updateScore() {
    this.scoreElement.textContent = `Score: ${this.score}`;
  }

  detectCollision() {
    // Wall collision
    if (this.ballX + this.ballSpeedX > this.containerWidth - this.ballSize || this.ballX + this.ballSpeedX < 0) {
      this.ballSpeedX = -this.ballSpeedX;
    }

    if (this.ballY + this.ballSpeedY < 0) {
      this.ballSpeedY = -this.ballSpeedY;
    }

    // Paddle collision
    if (this.ballY + this.ballSpeedY > this.containerHeight - this.ballSize - this.paddleHeight) {
      if (this.ballX > this.paddleX && this.ballX < this.paddleX + this.paddleWidth) {
        // Calculate angle based on where ball hits paddle
        const hitPosition = (this.ballX - this.paddleX) / this.paddleWidth;
        const angle = hitPosition * Math.PI - Math.PI / 2; // -90 to 90 degrees

        const power = 5; // Base speed
        this.ballSpeedX = power * Math.cos(angle);
        this.ballSpeedY = -power * Math.sin(angle) - 2; // Always bounce up
      } else if (this.ballY + this.ballSpeedY > this.containerHeight - this.ballSize) {
        // Ball hits bottom - game over
        this.gameOver();
        return;
      }
    }

    // Brick collision
    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < this.brickColumns; c++) {
        const brick = this.bricks[r][c];

        if (brick.status === 1) {
          if (this.ballX + this.ballSize > brick.x &&
            this.ballX < brick.x + this.brickWidth &&
            this.ballY + this.ballSize > brick.y &&
            this.ballY < brick.y + this.brickHeight) {

            this.ballSpeedY = -this.ballSpeedY;
            brick.status = 0;
            this.score += 10;

            // Hide the brick element
            const brickElements = this.container.querySelectorAll('.game-brick');
            const brickIndex = r * this.brickColumns + c;
            if (brickElements[brickIndex]) {


              brickElements[brickIndex].style.visibility = 'hidden';
            }

            this.updateScore();

            // Check if all bricks are gone
            if (this.checkWin()) {
              this.gameWin();
              return;
            }
          }
        }
      }
    }
  }

  checkWin() {
    for (let r = 0; r < this.brickRows; r++) {
      for (let c = 0; c < this.brickColumns; c++) {
        if (this.bricks[r][c].status === 1) {
          return false;
        }
      }
    }
    return true;
  }

  gameLoop() {
    if (!this.isPaused) {
      // Move ball
      this.ballX += this.ballSpeedX;
      this.ballY += this.ballSpeedY;

      // Detect collisions
      this.detectCollision();

      // Update display
      this.drawBall();
      this.drawPaddle();
    }
  }

  startGame() {
    if (!this.isGameRunning) {
      this.isGameRunning = true;
      this.isPaused = false;
      this.gameInterval = setInterval(() => this.gameLoop(), 16); // ~60fps
      this.startBtn.textContent = "Restart Game";
    } else if (this.isPaused) {
      this.togglePause();
    } else {
      this.resetGame();
      this.isGameRunning = true;
      this.isPaused = false;
      this.gameInterval = setInterval(() => this.gameLoop(), 16);
    }
  }

  togglePause() {
    if (!this.isGameRunning) return;

    this.isPaused = !this.isPaused;
    this.pauseBtn.textContent = this.isPaused ? "Resume" : "Pause";
  }

  resetGame() {
    // Clear any existing game loop
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
    }

    // Reset game state
    this.isGameRunning = false;
    this.isPaused = false;
    this.score = 0;

    // Reset ball and paddle positions
    this.paddleX = (this.containerWidth - this.paddleWidth) / 2;
    this.ballX = this.containerWidth / 2;
    this.ballY = this.containerHeight / 2;

    // Reset ball speed
    this.ballSpeedX = 3;
    this.ballSpeedY = -3;

    // Create new bricks
    this.createBricks();

    // Update display
    this.drawBall();
    this.drawPaddle();
    this.updateScore();

    // Reset button text
    this.startBtn.textContent = "Start Game";
    this.pauseBtn.textContent = "Pause";
  }

  gameOver() {
    clearInterval(this.gameInterval);
    this.isGameRunning = false;
    alert("Game Over! Your score: " + this.score);
    this.resetGame();
  }

  gameWin() {
    clearInterval(this.gameInterval);
    this.isGameRunning = false;
    alert("Congratulations! You won with a score of " + this.score);
    this.resetGame();
  }
}

// Error handling simulation
function showError(title, message) {
  const errorSound = new Audio('data:audio/wav;base64,UklGRrQJAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YZAJAACAgICAgICAgICAgICAgICAgICAgICAgICBgYGBgoGBgoGCgoKCgoKDgoODg4ODhISEhISFhIWFhYWFhoWGhoaGhoaHh4eHh4eHiIiIiIiIiImJiYmJiYmKioqKioqKioqLi4uLi4uLjIyMjIyMjIyMjY2NjY2NjY2Ojo6Ojo6Oj4+Pj4+Pj4+PkJCQkJCQkJCQkZGRkZGRkZGSkpKSkpKSkpKTk5OTk5OTk5OTlJSUlJSUlJSUlZWVlZWVlZWVlZaWlpaWlpaWlpeXl5eXl5eXl5eYmJiYmJiYmJiYmZmZmZmZmZmZmZmampqampqampqampubm5ubm5ubm5ubnJycnJycnJycnJycnZ2dnZ2dnZ2dnZ2dnp6enp6enp6enp6en5+fn5+fn5+fn5+foKCgoKCgoKCgoKCgoKGhoaGhoaGhoaGhoaGhoqKioqKioqKioqKioqKio6Ojo6Ojo6Ojo6Ojo6OjpKSkpKSkpKSkpKSkpKSkpKWlpaWlpaWlpaWlpaWlpaWlpqampqampqampqampqampqanp6enp6enp6enp6enp6enp6eoqKioqKioqKioqKioqKioqKipqampqampqampqampqampqamqqqqqqqqqqqqqqqqqqqqqqqqqqurrq6urq6urq6urq6urq6urq6usrKysrKysrKysrKysrKysrKytra2tra2tra2tra2tra2tra2tra6urq6urq6urq6urq6urq6urq6ur6+vr6+vr6+vr6+vr6+vr6+vr6+vsLCwsLCwsLCwsLCwsLCwsLCwsLCwsbGxsbGxsbGxsbGxsbGxsbGxsbGxsrKysKysrKysrKysrKysrKysrKys7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztLS0tLS0tLS0tLS0tLS0tLS0tLS0tLW1tbW1tbW1tbW1tbW1tbW1tbW1tba2tra2tra2tra2tra2tra2tra2tre3t7e3t7e3t7e3t7e3t7e3t7e3t7e4uLi4uLi4uLi4uLi4uLi4uLi4uLi4ubm5ubm5ubm5ubm5ubm5ubm5ubm5urq6urq6urq6urq6urq6urq6urq6uru7u7u7u7u7u7u7u7u7u7u7u7u7u7y8vLy8vLy8vLy8vLy8vLy8vLy8vLy9vb29vb29vb29vb29vb29vb29vb29vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr+/v7+/v7+/v7+/v7+/v7+/v7+/v7/AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcLCwsLCwsLCwsLCwsLCwsLCwsLCwsLDw8PDw8PDw8PDw8PDw8PDw8PDw8PDxMTExMTExMTExMTExMTExMTExMTExMXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxsbGxsbGxsbGxsbGxsbGxsbGxsbGxsbHx8fHx8fHx8fHx8fHx8fHx8fHx8fHyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjJycnJycnJycnJycnJycnJycnJycnJycrKysrKysrKysrKysrKysrKysrKysrKy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/P0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDR0dHR0dHR0dHR0dHR0dHR0dHR0dHR0dHS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tPT09PT09PT09PT09PT09PT09PT09PT09TU1NTU1NTU1NTU1NTU1NTU1NTU1NTU1NXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW19fX19fX19fX19fX19fX19fX19fX19fX2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2dnZ2tra2tra2tra2tra2tra2tra2tra2tra29vb29vb29vb29vb29vb29vb29vb29vb3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e39/f39/f39/f39/f39/f39/f39/f39/f4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5eXl5eXl5eXl5eXl5eXl5eXl5eXl5eXl5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo6enp6enp6enp6enp6enp6enp6enp6enp6urq6urq6urq6urq6urq6urq6urq6urq6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7e3t7e3t7e3t7e3t7e3t7e3t7e3t7e3t7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v8PDw8PDw8PDw8PDw8PDw8PDw8PDw8PDw8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz9PT09PT09PT09PT09PT09PT09PT09PT09fX19fX19fX19fX19fX19fX19fX19fX19vb29vb29vb29vb29vb29vb29vb29vb29/f39/f39/f39/f39/f39/f39/f39/f3+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+vr6+vr6+vr6+vr6+vr6+vr6+vr6+vr6+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/Pz8/f39/f39/f39/f39/f39/f39/f39/f39/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+//////////////////////////////////////////8=');
  errorSound.play();

  const errorWindow = document.createElement('div');
  errorWindow.className = 'window';
  errorWindow.style.width = '300px';
  errorWindow.style.height = '200px';
  errorWindow.style.left = '50%';
  errorWindow.style.top = '50%';
  errorWindow.style.transform = 'translate(-50%, -50%)';
  errorWindow.style.zIndex = '9999';

  errorWindow.innerHTML = `
    <div class="window-header">
      <div class="window-title">${title}</div>
      <div class="window-controls">
        <button onclick="this.parentNode.parentNode.parentNode.remove()">✕</button>
      </div>
    </div>
    <div class="window-body" style="display: flex; flex-direction: column; justify-content: space-between; height: calc(100% - 30px);">
      <div style="display: flex; align-items: center; margin: 10px;">
        <div style="font-size: 32px; margin-right: 10px;">⚠️</div>
        <p>${message}</p>
      </div>
      <div style="text-align: center; margin-bottom: 10px;">
        <button class="win95-btn" onclick="this.parentNode.parentNode.parentNode.remove()">OK</button>
      </div>
    </div>
    `
    ;

  document.body.appendChild(errorWindow);
  makeWindowDraggable(errorWindow);
}

// Easter Egg - Konami Code
let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiCodePosition = 0;


document.addEventListener('keydown', function (e) {
  // Check if the key pressed matches the next key in the Konami Code
  if (e.key === konamiCode[konamiCodePosition]) {
    konamiCodePosition++;

    // If the entire code is entered
    if (konamiCodePosition === konamiCode.length) {
      activateEasterEgg();
      konamiCodePosition = 0;
    }
  } else {
    konamiCodePosition = 0;
  }
});

function activateEasterEgg() {
  // Create a blue screen of death window
  const bsodWindow = document.createElement('div');
  bsodWindow.className = 'window';
  bsodWindow.style.width = '100%';
  bsodWindow.style.height = 'calc(100% - 40px)';
  bsodWindow.style.left = '0';
  bsodWindow.style.top = '0';
  bsodWindow.style.zIndex = '9999';
  bsodWindow.style.backgroundColor = '#0000aa';
  bsodWindow.style.color = 'white';
  bsodWindow.style.fontFamily = 'monospace';
  bsodWindow.style.padding = '20px';
  bsodWindow.style.boxSizing = 'border-box';
  bsodWindow.style.overflow = 'hidden';

  bsodWindow.innerHTML = `
    <h1>Windows</h1>
    <p>A fatal exception has occurred at 0028:C000A402 in VXD VMM(01) + 00010E02.</p>
    <p>The current application will be terminated.</p>
    <p>* Press any key to terminate the current application.</p>
    <p>* Press CTRL+ALT+DEL to restart your computer. You will lose any unsaved information in all applications.</p>
    <br><br>
    <p>Press any key to continue...</p>`
    ;

  document.body.appendChild(bsodWindow);

  // Close BSOD on click
  bsodWindow.addEventListener('click', function () {
    bsodWindow.remove();
    location.reload();
  });
}

// Mobile detection and adaptation
function checkMobile() {
  if (window.innerWidth <= 768) {
    // Move windows to mobile-friendly positions
    document.querySelectorAll('.window').forEach(window => {
      window.style.width = '95vw';
      window.style.left = '2.5vw';
      window.style.top = '50px';
      window.style.height = 'calc(100vh - 100px)';
    });
  }
}

window.addEventListener('resize', checkMobile);
checkMobile();

// Initialize the game when game window opens
let breakoutGame = null;

// Override the openWindow function for game to initialize
const originalOpenWindow = openWindow;
openWindow = function (id) {
  originalOpenWindow(id);

  // Initialize breakout game if opening the game window
  if (id === 'game' && !breakoutGame) {
    breakoutGame = new BreakoutGame();
  }
};

// Initialize a welcome window
window.addEventListener('load', function () {
  setTimeout(() => {
    showError('Welcome!', 'Welcome to my Windows 95 portfolio. Click on the desktop icons or use the Start Menu to explore!');
  }, 1000);
});