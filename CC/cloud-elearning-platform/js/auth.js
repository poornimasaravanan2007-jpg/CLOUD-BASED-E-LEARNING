// ================================================================
//  AUTH.JS — Hybrid Authentication (Firebase + Local Storage Fallback)
//  cloud-elearning-platform/js/auth.js
// ================================================================

// ── Toast Notification Helper ────────────────────────────────────
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || icons.info}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Loading Overlay ──────────────────────────────────────────────
function showLoading() {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'spinner-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ── Check if Firebase is Live or Using Placeholders ──────────────
function isFirebaseConfigured() {
  try {
    return typeof firebaseConfig !== 'undefined' &&
           firebaseConfig.apiKey &&
           firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
           !firebaseConfig.apiKey.includes('YOUR_');
  } catch (e) {
    return false;
  }
}

// ── Local Storage User Store (For instant offline/demo accounts) ──
function getLocalUsers() {
  try {
    const raw = localStorage.getItem('cloudlearn_users');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Pre-seed default test accounts
  const defaults = [
    {
      uid: 'usr_student_demo',
      name: 'Student Demo',
      email: 'student@cloudlearn.edu',
      password: 'student123',
      role: 'student',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'usr_teacher_demo',
      name: 'Dr. Keerthi (Faculty)',
      email: 'teacher@cloudlearn.edu',
      password: 'teacher123',
      role: 'teacher',
      createdAt: new Date().toISOString()
    }
  ];
  localStorage.setItem('cloudlearn_users', JSON.stringify(defaults));
  return defaults;
}

function saveLocalUser(userData) {
  const users = getLocalUsers();
  const existingIdx = users.findIndex(u => u.email.toLowerCase() === userData.email.toLowerCase());
  if (existingIdx >= 0) {
    users[existingIdx] = { ...users[existingIdx], ...userData };
  } else {
    users.push(userData);
  }
  localStorage.setItem('cloudlearn_users', JSON.stringify(users));
}

// ── Register Account (Firebase first, LocalStorage fallback) ──────
async function registerAccount(name, email, password, role) {
  const cleanEmail = email.trim().toLowerCase();

  // If Firebase is configured with real credentials, try Firebase
  if (isFirebaseConfigured()) {
    try {
      const credential = await auth.createUserWithEmailAndPassword(cleanEmail, password);
      const uid = credential.user.uid;
      await credential.user.updateProfile({ displayName: name });
      const userDoc = {
        name: name,
        email: cleanEmail,
        role: role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await db.collection('users').doc(uid).set(userDoc);
      const activeUser = { uid, name, email: cleanEmail, role };
      localStorage.setItem('cloudlearn_current_user', JSON.stringify(activeUser));
      return activeUser;
    } catch (fbErr) {
      console.warn('Firebase registration error, attempting local fallback:', fbErr);
      // If error is genuine user error (like email already exists in firebase), rethrow
      if (fbErr.code === 'auth/email-already-in-use' || fbErr.code === 'auth/weak-password') {
        throw fbErr;
      }
    }
  }

  // Local Storage Registration Fallback
  const users = getLocalUsers();
  const exists = users.some(u => u.email.toLowerCase() === cleanEmail);
  if (exists) {
    throw { code: 'auth/email-already-in-use', message: 'This email is already registered. Please login instead.' };
  }

  const newUser = {
    uid: 'usr_' + Date.now(),
    name: name,
    email: cleanEmail,
    password: password,
    role: role,
    createdAt: new Date().toISOString()
  };

  saveLocalUser(newUser);
  localStorage.setItem('cloudlearn_current_user', JSON.stringify(newUser));
  return newUser;
}

// ── Login Account (Firebase first, LocalStorage fallback) ─────────
async function loginAccount(email, password, remember = true) {
  const cleanEmail = email.trim().toLowerCase();

  if (isFirebaseConfigured()) {
    try {
      const persistence = remember
        ? firebase.auth.Auth.Persistence.LOCAL
        : firebase.auth.Auth.Persistence.SESSION;
      await auth.setPersistence(persistence);

      const credential = await auth.signInWithEmailAndPassword(cleanEmail, password);
      const uid = credential.user.uid;
      const userDoc = await db.collection('users').doc(uid).get();

      if (userDoc.exists) {
        const data = userDoc.data();
        const activeUser = { uid, name: data.name || cleanEmail, email: cleanEmail, role: data.role || 'student' };
        localStorage.setItem('cloudlearn_current_user', JSON.stringify(activeUser));
        return activeUser;
      }
    } catch (fbErr) {
      console.warn('Firebase sign-in error, attempting local fallback:', fbErr);
      if (fbErr.code === 'auth/wrong-password') {
        throw fbErr;
      }
    }
  }

  // Local Storage Login Fallback
  const users = getLocalUsers();
  const found = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!found) {
    throw { code: 'auth/user-not-found', message: 'No account found with this email. Please register first.' };
  }

  if (found.password && found.password !== password) {
    throw { code: 'auth/wrong-password', message: 'Incorrect password. Please check and try again.' };
  }

  const activeUser = {
    uid: found.uid,
    name: found.name || 'User',
    email: found.email,
    role: found.role || 'student'
  };

  localStorage.setItem('cloudlearn_current_user', JSON.stringify(activeUser));
  return activeUser;
}

// ── Get Logged-In User Data ──────────────────────────────────────
async function getCurrentUserData() {
  // 1. Check local session
  try {
    const raw = localStorage.getItem('cloudlearn_current_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) return parsed;
    }
  } catch (e) {}

  // 2. Check Firebase session
  if (typeof auth !== 'undefined' && auth.currentUser) {
    const user = auth.currentUser;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        return { uid: user.uid, ...doc.data() };
      }
    } catch (e) {}
    return {
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      role: 'student'
    };
  }

  return null;
}

// ── Page Guard: Only authenticated users ────────────────────────
function requireAuth(requiredRole = null) {
  showLoading();

  // Immediate check on localStorage session
  getCurrentUserData().then(userData => {
    if (userData) {
      if (requiredRole && userData.role !== requiredRole) {
        hideLoading();
        showToast('Access denied. Redirecting to your assigned portal...', 'error');
        setTimeout(() => redirectByRole(userData.role), 1000);
        return;
      }
      hideLoading();
      window.currentUser = userData;
      document.dispatchEvent(new CustomEvent('userReady', { detail: userData }));
      return;
    }

    // If not in localStorage, check Firebase Auth state
    if (typeof auth !== 'undefined' && isFirebaseConfigured()) {
      auth.onAuthStateChanged(async (user) => {
        if (!user) {
          hideLoading();
          window.location.href = 'login.html';
          return;
        }
        const data = await getCurrentUserData();
        if (!data) {
          hideLoading();
          window.location.href = 'login.html';
          return;
        }
        if (requiredRole && data.role !== requiredRole) {
          hideLoading();
          redirectByRole(data.role);
          return;
        }
        hideLoading();
        window.currentUser = data;
        document.dispatchEvent(new CustomEvent('userReady', { detail: data }));
      });
    } else {
      hideLoading();
      window.location.href = 'login.html';
    }
  });
}

// ── Logout ───────────────────────────────────────────────────────
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    showLoading();
    localStorage.removeItem('cloudlearn_current_user');
    if (typeof auth !== 'undefined' && isFirebaseConfigured()) {
      auth.signOut().catch(() => {});
    }
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }
}

// ── Get Time-Based Greeting ──────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ── Role-Based Redirect ──────────────────────────────────────────
function redirectByRole(role) {
  if (role === 'teacher') {
    window.location.href = 'teacher-dashboard.html';
  } else {
    window.location.href = 'student-dashboard.html';
  }
}

// ── Password Strength ────────────────────────────────────────────
function checkPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = ['', 'weak', 'fair', 'good', 'strong'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong! 💪'];
  return { score, level: levels[score], label: labels[score] };
}

function initPasswordStrength(inputId, barsId, textId) {
  const input = document.getElementById(inputId);
  const bars  = document.querySelectorAll(`#${barsId} .strength-bar`);
  const text  = document.getElementById(textId);
  if (!input) return;
  input.addEventListener('input', () => {
    const { score, level, label } = checkPasswordStrength(input.value);
    bars.forEach((bar, idx) => {
      bar.className = 'strength-bar';
      if (idx < score) bar.classList.add('active', level);
    });
    if (text) text.textContent = input.value ? label : '';
  });
}

// ── Toggle Password Visibility ───────────────────────────────────
function initPasswordToggle(toggleId, inputId) {
  const toggle = document.getElementById(toggleId);
  const input  = document.getElementById(inputId);
  if (!toggle || !input) return;
  toggle.addEventListener('click', () => {
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    toggle.innerHTML = isText ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
  });
}

// ── Sidebar Toggle (mobile) ──────────────────────────────────────
function initSidebarToggle() {
  const menuBtn = document.getElementById('menu-toggle');
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  if (!menuBtn || !sidebar) return;

  menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  });
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

// ── Mark Active Nav Link ──────────────────────────────────────────
function markActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage) link.classList.add('active');
  });
}

// ── Set Sidebar Avatar Initials ───────────────────────────────────
function setAvatarInitials(name) {
  const parts    = (name || 'U').trim().split(' ');
  const initials = parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
  document.querySelectorAll('.user-avatar-initials').forEach(el => {
    el.textContent = initials;
  });
}
