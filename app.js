// ==========================================
// SEED DATA & CONSTANTS
// ==========================================

const TRAIN_DATABASE = {
  "12001": "Shatabdi Express",
  "12951": "Rajdhani Express",
  "12260": "Duronto Express",
  "12626": "Kerala Express",
  "12615": "Grand Trunk Express"
};

const DEFAULT_BOOKINGS = [
  {
    pnr: "4829105938",
    passengerName: "John Doe",
    age: 34,
    gender: "Male",
    trainNumber: "12951",
    trainName: "Rajdhani Express",
    classType: "First Class AC (1A)",
    fromStation: "New Delhi (NDLS)",
    toStation: "Mumbai Central (MMCT)",
    journeyDate: "2026-07-20",
    username: "passenger",
    status: "Active"
  },
  {
    pnr: "5820194829",
    passengerName: "Alice Smith",
    age: 28,
    gender: "Female",
    trainNumber: "12001",
    trainName: "Shatabdi Express",
    classType: "Second Class AC (2A)",
    fromStation: "New Delhi (NDLS)",
    toStation: "Howrah Junction (HWH)",
    journeyDate: "2026-06-30",
    username: "alice_s",
    status: "Active"
  },
  {
    pnr: "1928374650",
    passengerName: "Bob Johnson",
    age: 52,
    gender: "Male",
    trainNumber: "12260",
    trainName: "Duronto Express",
    classType: "Sleeper Class (SL)",
    fromStation: "Howrah Junction (HWH)",
    toStation: "Bengaluru City (SBC)",
    journeyDate: "2026-06-25",
    username: "bob_j",
    status: "Cancelled"
  }
];

// ==========================================
// SYSTEM STATE MANAGEMENT
// ==========================================

let currentUser = null;
let bookings = [];

// Initialize application data
function initApp() {
  // Load bookings from localStorage, if not present seed with default data
  const localData = localStorage.getItem("railpass_bookings");
  if (localData) {
    bookings = JSON.parse(localData);
  } else {
    bookings = [...DEFAULT_BOOKINGS];
    localStorage.setItem("railpass_bookings", JSON.stringify(bookings));
  }

  // Check if session exists in sessionStorage
  const activeSession = sessionStorage.getItem("railpass_session");
  if (activeSession) {
    currentUser = JSON.parse(activeSession);
    showDashboard();
  } else {
    showLogin();
  }
}

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

function switchRole(role) {
  const tabPassenger = document.getElementById("tabPassenger");
  const tabAdmin = document.getElementById("tabAdmin");
  const loginRole = document.getElementById("loginRole");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");

  // Reset inputs
  usernameInput.value = "";
  passwordInput.value = "";
  clearErrors();

  if (role === "admin") {
    tabAdmin.classList.add("active");
    tabPassenger.classList.remove("active");
    loginRole.value = "admin";
    usernameInput.placeholder = "e.g. admin";
  } else {
    tabPassenger.classList.add("active");
    tabAdmin.classList.remove("active");
    loginRole.value = "passenger";
    usernameInput.placeholder = "e.g. passenger";
  }
}

function handleLogin(event) {
  event.preventDefault();
  clearErrors();

  const role = document.getElementById("loginRole").value;
  const usernameVal = document.getElementById("username").value.trim();
  const passwordVal = document.getElementById("password").value;

  let isValid = true;

  // Simple validation checks
  if (role === "admin") {
    if (usernameVal !== "admin" || passwordVal !== "admin123") {
      showError("usernameHelp", "Invalid Official Login ID.");
      showError("passwordHelp", "Invalid Official Password.");
      isValid = false;
    }
  } else {
    // If logging in as primary demo passenger
    if (usernameVal === "passenger") {
      if (passwordVal !== "pass123") {
        showError("passwordHelp", "Incorrect password for demo passenger.");
        isValid = false;
      }
    } else {
      // Support custom passenger logins with password pass123
      if (passwordVal !== "pass123") {
        showError("passwordHelp", "Use pass123 password to register/login new passenger accounts.");
        isValid = false;
      }
    }
  }

  if (!isValid) return;

  // Login successful
  currentUser = {
    username: usernameVal,
    role: role === "admin" ? "Official" : "Passenger"
  };

  sessionStorage.setItem("railpass_session", JSON.stringify(currentUser));
  showDashboard();
}

function handleLogout() {
  sessionStorage.removeItem("railpass_session");
  currentUser = null;
  showLogin();
}

function showLogin() {
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("dashboardScreen").classList.add("hidden");
}

function showDashboard() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("dashboardScreen").classList.remove("hidden");

  // Setup user details
  document.getElementById("headerUserName").textContent = currentUser.username;
  document.getElementById("headerUserRole").textContent = currentUser.role;

  const passengerNav = document.getElementById("passengerNav");
  const adminNav = document.getElementById("adminNav");

  if (currentUser.role === "Official") {
    // Show official admin components
    passengerNav.classList.add("hidden");
    adminNav.classList.remove("hidden");
    switchSection("centraldb");
  } else {
    // Show passenger components
    passengerNav.classList.remove("hidden");
    adminNav.classList.add("hidden");
    switchSection("book");
  }
}

// ==========================================
// NAVIGATION MANAGEMENT
// ==========================================

function switchSection(sectionId) {
  // Hide all sections
  document.getElementById("sectionBook").classList.add("hidden");
  document.getElementById("sectionCancel").classList.add("hidden");
  document.getElementById("sectionMyBookings").classList.add("hidden");
  document.getElementById("sectionCentralDb").classList.add("hidden");

  // Deactivate all sidebar nav buttons
  const navButtons = document.querySelectorAll(".sidebar-nav-btn");
  navButtons.forEach(btn => btn.classList.remove("active"));

  if (sectionId === "book") {
    document.getElementById("sectionBook").classList.remove("hidden");
    document.getElementById("btnNavBook").classList.add("active");
  } else if (sectionId === "cancel") {
    document.getElementById("sectionCancel").classList.remove("hidden");
    document.getElementById("btnNavCancel").classList.add("active");
    resetCancelForm();
  } else if (sectionId === "mybookings") {
    document.getElementById("sectionMyBookings").classList.remove("hidden");
    document.getElementById("btnNavMyBookings").classList.add("active");
    renderMyBookings();
  } else if (sectionId === "centraldb") {
    document.getElementById("sectionCentralDb").classList.remove("hidden");
    document.getElementById("btnNavCentralDb").classList.add("active");
    renderAdminDatabase();
    updateAdminStats();
  }
}

// ==========================================
// TICKET BOOKING FLOW (RESERVATION)
// ==========================================

function autoFillTrainName() {
  const trainNumberVal = document.getElementById("trainNumber").value;
  const trainNameInput = document.getElementById("trainName");
  
  if (TRAIN_DATABASE[trainNumberVal]) {
    trainNameInput.value = TRAIN_DATABASE[trainNumberVal];
  } else {
    trainNameInput.value = "";
  }
}

function handleReservationSubmit(event) {
  event.preventDefault();
  
  const passengerName = document.getElementById("passengerName").value.trim();
  const age = document.getElementById("passengerAge").value;
  const gender = document.getElementById("passengerGender").value;
  const trainNumber = document.getElementById("trainNumber").value;
  const trainName = document.getElementById("trainName").value;
  const fromStation = document.getElementById("fromStation").value;
  const toStation = document.getElementById("toStation").value;
  const classType = document.getElementById("classType").value;
  const journeyDate = document.getElementById("journeyDate").value;

  const errorBox = document.getElementById("bookingErrorBox");
  errorBox.classList.add("hidden");
  errorBox.textContent = "";

  // Validation: Destination station cannot be same as Origin station
  if (fromStation === toStation) {
    errorBox.classList.remove("hidden");
    errorBox.textContent = "Origin and Destination stations cannot be the same.";
    return;
  }

  // Generate a random unique 10-digit PNR
  let pnr = "";
  do {
    pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  } while (bookings.find(b => b.pnr === pnr));

  // Create booking object
  const newBooking = {
    pnr,
    passengerName,
    age: parseInt(age),
    gender,
    trainNumber,
    trainName,
    classType,
    fromStation,
    toStation,
    journeyDate,
    username: currentUser.username,
    status: "Active"
  };

  // Add booking to state and database
  bookings.unshift(newBooking);
  localStorage.setItem("railpass_bookings", JSON.stringify(bookings));

  // Populate ticket receipt
  document.getElementById("recPnr").textContent = pnr;
  document.getElementById("recName").textContent = passengerName;
  document.getElementById("recAgeGen").textContent = `${age} yrs / ${gender}`;
  document.getElementById("recTrain").textContent = `${trainNumber} - ${trainName}`;
  document.getElementById("recClass").textContent = classType;
  document.getElementById("recFrom").textContent = fromStation;
  document.getElementById("recTo").textContent = toStation;
  document.getElementById("recDate").textContent = formatDateString(journeyDate);

  // Hide form layout, show ticket receipt layout
  document.getElementById("reservationForm").classList.add("hidden");
  document.getElementById("ticketReceiptContainer").classList.remove("hidden");
}

function resetBookingForm() {
  document.getElementById("reservationForm").reset();
  document.getElementById("trainName").value = "";
  document.getElementById("reservationForm").classList.remove("hidden");
  document.getElementById("ticketReceiptContainer").classList.add("hidden");
  document.getElementById("bookingErrorBox").classList.add("hidden");
}

// ==========================================
// TICKET CANCELLATION FLOW
// ==========================================

let activeCancelPnr = null;

function handleCancelSearch(event) {
  event.preventDefault();
  
  const searchPnr = document.getElementById("cancelPnrInput").value.trim();
  const searchError = document.getElementById("cancelSearchError");
  const cancelInfoPanel = document.getElementById("cancelInfoPanel");
  
  searchError.classList.add("hidden");
  cancelInfoPanel.classList.add("hidden");

  const booking = bookings.find(b => b.pnr === searchPnr);

  if (!booking) {
    searchError.classList.remove("hidden");
    searchError.textContent = "No booking records found for the entered PNR number.";
    return;
  }

  // Populate info panel
  activeCancelPnr = searchPnr;
  document.getElementById("cancelShowPnr").textContent = booking.pnr;
  document.getElementById("cancelShowName").textContent = booking.passengerName;
  document.getElementById("cancelShowTrain").textContent = `${booking.trainNumber} - ${booking.trainName}`;
  document.getElementById("cancelShowRoute").textContent = `${booking.fromStation} ➔ ${booking.toStation}`;
  document.getElementById("cancelShowDate").textContent = formatDateString(booking.journeyDate);

  const statusBadge = document.getElementById("cancelShowStatus");
  statusBadge.textContent = booking.status;
  statusBadge.className = booking.status === "Active" ? "badge badge-active" : "badge badge-cancelled";

  // Lock the Cancellation button if already cancelled
  const btnConfirm = document.getElementById("btnConfirmCancel");
  if (booking.status === "Cancelled") {
    btnConfirm.disabled = true;
    btnConfirm.textContent = "Already Cancelled";
  } else {
    btnConfirm.disabled = false;
    btnConfirm.textContent = "OK (Confirm Cancellation)";
  }

  cancelInfoPanel.classList.remove("hidden");
}

function confirmCancellation() {
  if (!activeCancelPnr) return;

  // Update status in state and localStorage
  const index = bookings.findIndex(b => b.pnr === activeCancelPnr);
  if (index !== -1) {
    bookings[index].status = "Cancelled";
    localStorage.setItem("railpass_bookings", JSON.stringify(bookings));
  }

  // Display success message panel
  document.getElementById("cancelSearchForm").classList.add("hidden");
  document.getElementById("cancelInfoPanel").classList.add("hidden");
  document.getElementById("cancelSuccessPanel").classList.remove("hidden");
}

function resetCancelForm() {
  document.getElementById("cancelSearchForm").reset();
  document.getElementById("cancelSearchForm").classList.remove("hidden");
  document.getElementById("cancelInfoPanel").classList.add("hidden");
  document.getElementById("cancelSuccessPanel").classList.add("hidden");
  document.getElementById("cancelSearchError").classList.add("hidden");
  activeCancelPnr = null;
}

// ==========================================
// TABLE RENDERING FUNCTIONS
// ==========================================

function renderMyBookings() {
  const tableBody = document.getElementById("myBookingsTableBody");
  const tableContainer = document.getElementById("myBookingsContainer");
  const emptyState = document.getElementById("myBookingsEmpty");

  tableBody.innerHTML = "";

  // Filter bookings to the current logged-in passenger user
  const userBookings = bookings.filter(b => b.username === currentUser.username);

  if (userBookings.length === 0) {
    tableContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  tableContainer.classList.remove("hidden");
  emptyState.classList.add("hidden");

  userBookings.forEach(booking => {
    const row = document.createElement("tr");

    // PNR col
    const tdPnr = document.createElement("td");
    tdPnr.style.fontWeight = "700";
    tdPnr.style.color = "var(--primary-gold)";
    tdPnr.textContent = booking.pnr;
    row.appendChild(tdPnr);

    // Passenger Name col
    const tdPassenger = document.createElement("td");
    tdPassenger.textContent = booking.passengerName;
    row.appendChild(tdPassenger);

    // Train col
    const tdTrain = document.createElement("td");
    tdTrain.textContent = `${booking.trainNumber} - ${booking.trainName}`;
    row.appendChild(tdTrain);

    // Date col
    const tdDate = document.createElement("td");
    tdDate.textContent = formatDateString(booking.journeyDate);
    row.appendChild(tdDate);

    // Route col
    const tdRoute = document.createElement("td");
    tdRoute.textContent = `${booking.fromStation.split(" ")[0]} ➔ ${booking.toStation.split(" ")[0]}`;
    row.appendChild(tdRoute);

    // Status col
    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = booking.status === "Active" ? "badge badge-active" : "badge badge-cancelled";
    badge.textContent = booking.status;
    tdStatus.appendChild(badge);
    row.appendChild(tdStatus);

    tableBody.appendChild(row);
  });
}

function renderAdminDatabase() {
  const tableBody = document.getElementById("adminDbTableBody");
  const tableContainer = document.getElementById("adminDbContainer");
  const emptyState = document.getElementById("adminDbEmpty");

  tableBody.innerHTML = "";

  if (bookings.length === 0) {
    tableContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
    return;
  }

  tableContainer.classList.remove("hidden");
  emptyState.classList.add("hidden");

  bookings.forEach(booking => {
    const row = document.createElement("tr");

    // PNR col
    const tdPnr = document.createElement("td");
    tdPnr.style.fontWeight = "700";
    tdPnr.style.color = "var(--primary-gold)";
    tdPnr.textContent = booking.pnr;
    row.appendChild(tdPnr);

    // Passenger Name
    const tdPassenger = document.createElement("td");
    tdPassenger.innerHTML = `<div style="font-weight: 600;">${booking.passengerName}</div><div style="font-size: 0.75rem; color: var(--text-dim);">${booking.age} yrs / ${booking.gender}</div>`;
    row.appendChild(tdPassenger);

    // Username / Account
    const tdUser = document.createElement("td");
    tdUser.textContent = booking.username;
    row.appendChild(tdUser);

    // Train Details
    const tdTrain = document.createElement("td");
    tdTrain.innerHTML = `<div>${booking.trainName}</div><div style="font-size: 0.75rem; color: var(--text-dim);">Train No: ${booking.trainNumber} • ${booking.classType.split(" ")[0]}</div>`;
    row.appendChild(tdTrain);

    // Journey Date
    const tdDate = document.createElement("td");
    tdDate.textContent = formatDateString(booking.journeyDate);
    row.appendChild(tdDate);

    // Route
    const tdRoute = document.createElement("td");
    tdRoute.textContent = `${booking.fromStation.split(" ")[0]} ➔ ${booking.toStation.split(" ")[0]}`;
    row.appendChild(tdRoute);

    // Status
    const tdStatus = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = booking.status === "Active" ? "badge badge-active" : "badge badge-cancelled";
    badge.textContent = booking.status;
    tdStatus.appendChild(badge);
    row.appendChild(tdStatus);

    tableBody.appendChild(row);
  });
}

function updateAdminStats() {
  const total = bookings.length;
  const active = bookings.filter(b => b.status === "Active").length;
  const cancelled = bookings.filter(b => b.status === "Cancelled").length;

  document.getElementById("statTotalBookings").textContent = total;
  document.getElementById("statActiveBookings").textContent = active;
  document.getElementById("statCancelledBookings").textContent = cancelled;
}

function filterAdminDatabase() {
  const searchInput = document.getElementById("adminSearchInput").value.toLowerCase().trim();
  const statusFilter = document.getElementById("adminStatusFilter").value;
  const rows = document.querySelectorAll("#adminDbTableBody tr");
  let matchesCount = 0;

  rows.forEach((row, index) => {
    const booking = bookings[index];
    if (!booking) return;

    const matchesSearch = 
      booking.pnr.includes(searchInput) ||
      booking.passengerName.toLowerCase().includes(searchInput) ||
      booking.trainNumber.includes(searchInput) ||
      booking.trainName.toLowerCase().includes(searchInput) ||
      booking.fromStation.toLowerCase().includes(searchInput) ||
      booking.toStation.toLowerCase().includes(searchInput) ||
      booking.username.toLowerCase().includes(searchInput);

    const matchesStatus = 
      statusFilter === "ALL" || 
      booking.status === statusFilter;

    if (matchesSearch && matchesStatus) {
      row.classList.remove("hidden");
      matchesCount++;
    } else {
      row.classList.add("hidden");
    }
  });

  const tableContainer = document.getElementById("adminDbContainer");
  const emptyState = document.getElementById("adminDbEmpty");

  if (matchesCount === 0) {
    tableContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
  } else {
    tableContainer.classList.remove("hidden");
    emptyState.classList.add("hidden");
  }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showError(helpId, message) {
  const el = document.getElementById(helpId);
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearErrors() {
  document.getElementById("usernameHelp").classList.add("hidden");
  document.getElementById("passwordHelp").classList.add("hidden");
}

function formatDateString(dateStr) {
  if (!dateStr) return "-";
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

// Set default dates on the journeyDate input (min = today)
function setupJourneyDatePicker() {
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("journeyDate");
  if (dateInput) {
    dateInput.min = today;
  }
}

// ==========================================
// WINDOW ONLOAD INITIALIZATION
// ==========================================

window.onload = () => {
  initApp();
  setupJourneyDatePicker();
};
