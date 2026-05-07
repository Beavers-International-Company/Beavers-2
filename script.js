const validStudentDomains = ['@student.edu', '@kpnu.edu.ua'];

const initialScooters = [ 
  { id: 'SC-101', name: 'Scooter SC-101', location: 'Library', battery: 86, status: 'Available' },
  { id: 'SC-102', name: 'Scooter SC-102', location: 'Main Building', battery: 64, status: 'Available' },
  { id: 'SC-103', name: 'Scooter SC-103', location: 'Dormitory', battery: 18, status: 'Low battery' },
  { id: 'SC-104', name: 'Scooter SC-104', location: 'Cafeteria', battery: 47, status: 'Busy' },
  { id: 'SC-105', name: 'Scooter SC-105', location: 'Sports Center', battery: 72, status: 'Available' }
];

let scooters = JSON.parse(localStorage.getItem('smartScooterScooters')) || initialScooters;
let profile = JSON.parse(localStorage.getItem('smartScooterProfile')) || null;
let activeRide = JSON.parse(localStorage.getItem('smartScooterActiveRide')) || null;
let lastRideStatus = localStorage.getItem('smartScooterLastRideStatus') || '';
let ecoStats = JSON.parse(localStorage.getItem('smartScooterEcoStats')) || {
  rides: 0,
  bonuses: 0,
  co2Saved: 0,
  rating: 5
};
let showAvailableOnly = false;

const registrationForm = document.querySelector('#registrationForm');
const registrationMessage = document.querySelector('#registrationMessage');
const profileCard = document.querySelector('#profileCard');
const scooterList = document.querySelector('#scooterList');
const availableFilterButton = document.querySelector('#availableFilterButton');
const scooterSelect = document.querySelector('#scooterSelect');
const startRideButton = document.querySelector('#startRideButton');
const finishRideButton = document.querySelector('#finishRideButton');
const ridePanel = document.querySelector('#ridePanel');
const ecoStatsPanel = document.querySelector('#ecoStats');

function saveState() {
  localStorage.setItem('smartScooterScooters', JSON.stringify(scooters));
  localStorage.setItem('smartScooterEcoStats', JSON.stringify(ecoStats));

  if (profile) {
    localStorage.setItem('smartScooterProfile', JSON.stringify(profile));
  }

  if (activeRide) {
    localStorage.setItem('smartScooterActiveRide', JSON.stringify(activeRide));
  } else {
    localStorage.removeItem('smartScooterActiveRide');
  }

  localStorage.setItem('smartScooterLastRideStatus', lastRideStatus);
}

function isStudentEmail(email) {
  return validStudentDomains.some((domain) => email.toLowerCase().endsWith(domain));
}

// SCRUM-10 registration logic: validate student email and create a simple profile.
registrationForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.querySelector('#studentName').value.trim();
  const email = document.querySelector('#studentEmail').value.trim();

  if (!isStudentEmail(email)) {
    registrationMessage.textContent = 'Invalid email. Please use @student.edu or @kpnu.edu.ua.';
    registrationMessage.className = 'message error';
    return;
  }

  profile = {
    name,
    email,
    status: 'Student verified'
  };

  registrationMessage.textContent = 'Student profile created successfully.';
  registrationMessage.className = 'message success';
  saveState();
  renderProfile();
});

function renderProfile() {
  if (!profile) {
    profileCard.className = 'profile-card empty';
    profileCard.innerHTML = '<h3>Student Profile</h3><p>No verified student profile yet.</p>';
    return;
  }

  profileCard.className = 'profile-card';
  profileCard.innerHTML = `
    <h3>Student Profile</h3>
    <p><strong>Name:</strong> ${profile.name}</p>
    <p><strong>Email:</strong> ${profile.email}</p>
    <p><span class="status-pill">${profile.status}</span></p>
  `;
}

function getScootersForDisplay() {
  if (showAvailableOnly) {
    return scooters.filter((scooter) => scooter.status === 'Available');
  }

  return scooters;
}

// SCRUM-15 scooter map/list: render mock scooters and support the available-scooter filter.
function renderScooters() {
  scooterList.innerHTML = '';

  getScootersForDisplay().forEach((scooter) => {
    const card = document.createElement('article');
    card.className = `scooter-card ${scooter.status === 'Low battery' ? 'low' : ''} ${scooter.status === 'Busy' ? 'busy' : ''}`;

    card.innerHTML = `
      <h3>${scooter.name}</h3>
      <p><strong>Location:</strong> ${scooter.location}</p>
      <p><strong>Status:</strong> ${scooter.status}</p>
      <!-- SCRUM-16 battery level display: show visible battery percentage and progress bar. -->
      <p><strong>Battery:</strong> ${scooter.battery}%</p>
      <div class="battery-bar" aria-label="Battery ${scooter.battery}%">
        <div class="battery-fill" style="width: ${scooter.battery}%"></div>
      </div>
    `;

    scooterList.appendChild(card);
  });

  availableFilterButton.textContent = showAvailableOnly ? 'Show all scooters' : 'Show available scooters';
}

function renderScooterOptions() {
  const availableScooters = scooters.filter((scooter) => scooter.status === 'Available');

  scooterSelect.innerHTML = '';

  if (availableScooters.length === 0) {
    const option = document.createElement('option');
    option.textContent = 'No available scooters';
    option.value = '';
    scooterSelect.appendChild(option);
    startRideButton.disabled = true;
    return;
  }

  availableScooters.forEach((scooter) => {
    const option = document.createElement('option');
    option.value = scooter.id;
    option.textContent = `${scooter.name} — ${scooter.location} — ${scooter.battery}%`;
    scooterSelect.appendChild(option);
  });

  startRideButton.disabled = Boolean(activeRide);
}

availableFilterButton.addEventListener('click', () => {
  showAvailableOnly = !showAvailableOnly;
  renderScooters();
});

// SCRUM-20 QR rent simulation: select an available mock scooter and start a ride.
startRideButton.addEventListener('click', () => {
  if (!profile) {
    alert('Please create a verified student profile before starting a ride.');
    location.hash = '#register';
    return;
  }

  if (activeRide) {
    alert('You already have an active ride.');
    return;
  }

  const scooterId = scooterSelect.value;
  const selectedScooter = scooters.find((scooter) => scooter.id === scooterId);

  if (!selectedScooter) {
    alert('Please select an available scooter.');
    return;
  }

  selectedScooter.status = 'Busy';
  activeRide = {
    scooterId: selectedScooter.id,
    scooterName: selectedScooter.name,
    startTime: new Date().toLocaleString(),
    status: 'Ride active'
  };
  lastRideStatus = '';

  saveState();
  renderAll();
});

finishRideButton.addEventListener('click', () => {
  if (!activeRide) {
    alert('No active ride to finish.');
    return;
  }

  const scooter = scooters.find((item) => item.id === activeRide.scooterId);
  if (scooter) {
    scooter.status = scooter.battery <= 20 ? 'Low battery' : 'Available';
    scooter.battery = Math.max(5, scooter.battery - 9);
    scooter.status = scooter.battery <= 20 ? 'Low battery' : 'Available';
  }

  ecoStats.rides += 1;
  ecoStats.bonuses += 10;
  ecoStats.co2Saved = Number((ecoStats.co2Saved + 0.7).toFixed(1));
  ecoStats.rating = Math.min(5, Number((4.5 + ecoStats.rides * 0.1).toFixed(1)));

  lastRideStatus = `Completed: ${activeRide.scooterName}`;
  activeRide = null;

  saveState();
  renderAll();
});

function renderRidePanel() {
  finishRideButton.disabled = !activeRide;

  if (!activeRide) {
    ridePanel.innerHTML = `
      <h3>Ride Status</h3>
      <p>${lastRideStatus || 'No active ride.'}</p>
      ${lastRideStatus ? '<p><span class="status-pill">Completed</span></p>' : ''}
    `;
    return;
  }

  ridePanel.innerHTML = `
    <h3>Ride Status</h3>
    <p><strong>Selected scooter:</strong> ${activeRide.scooterName}</p>
    <p><strong>Start time:</strong> ${activeRide.startTime}</p>
    <p><span class="status-pill">${activeRide.status}</span></p>
  `;
}

function renderEcoStats() {
  ecoStatsPanel.innerHTML = `
    <article class="stat-card"><h3>${ecoStats.rides}</h3><p>Number of rides</p></article>
    <article class="stat-card"><h3>${ecoStats.bonuses}</h3><p>Earned bonuses</p></article>
    <article class="stat-card"><h3>${ecoStats.co2Saved} kg</h3><p>Estimated CO₂ saved</p></article>
    <article class="stat-card"><h3>${ecoStats.rating}/5</h3><p>User rating</p></article>
  `;
}

function renderAll() {
  renderProfile();
  renderScooters();
  renderScooterOptions();
  renderRidePanel();
  renderEcoStats();
}

renderAll();
