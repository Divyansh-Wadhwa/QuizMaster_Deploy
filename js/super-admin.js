// super-admin.js
const API_BASE = window.QUESTION_API_BASE;
const AUTH_API = window.AUTH_API_BASE;
const RESULT_API = window.RESULT_API_BASE;
const token = localStorage.getItem("token");
const currentUsername = localStorage.getItem("username");

// Check if user is authenticated
if (!token) {
    alert("Access denied. Please login first.");
    window.location.href = "index.html";
}

// Validate super admin access
function validateSuperAdminAccess() {
    try {
        // Decode JWT token to get username
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const username = tokenPayload.sub || tokenPayload.username;

        // Define default admin users
        const defaultAllowedUsers = ['admin', 'superuser', 'system'];

        // Get dynamically added admin users from localStorage
        const dynamicAdmins = JSON.parse(localStorage.getItem('adminList') || '[]');

        // Combine default and dynamic admin users
        const allowedUsers = [...defaultAllowedUsers, ...dynamicAdmins];

        // Check if user is in allowed admin users list
        if (!allowedUsers.includes(username.toLowerCase())) {
            alert(`Access Denied!\n\nThis page requires Administrator privileges.\nOnly admin users can access this panel.\n\nContact system administrator for access.`);
            window.location.href = "dashboard.html";
            return false;
        }

        // Log access attempt for security
        console.log(`Admin access granted to: ${username}`);
        return true;

    } catch (error) {
        console.error('Token validation error:', error);
        alert("Invalid token. Please login again.");
        localStorage.removeItem('token');
        window.location.href = "index.html";
        return false;
    }
}

// Validate access immediately
if (!validateSuperAdminAccess()) {
    // If validation fails, the function will redirect, so we can stop execution
    throw new Error('Access denied');
}

const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
};

// Navigation Management
document.addEventListener('DOMContentLoaded', function () {
    // Display current user info
    displayCurrentUser();

    // Setup navigation
    setupNavigation();

    // Load dashboard data
    loadDashboardData();

    // Setup search functionality
    setupSearch();

    // Setup filter functionality
    setupFilters();

    // Make loadUsers available globally for debugging
    window.loadUsers = loadUsers;
    window.renderUsersTable = renderUsersTable;
    
    // Auto-refresh user list every 1 second for real-time online status
    setInterval(() => {
        const usersSection = document.getElementById('users-section');
        if (usersSection && usersSection.classList.contains('active')) {
            loadUsers();
        }
    }, 1000); // Refresh every 1 second for instant updates
});

function displayCurrentUser() {
    try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const username = tokenPayload.sub || tokenPayload.username || 'Unknown';

        // Update sidebar header with current user info
        const sidebarHeader = document.querySelector('.sidebar-header p');
        if (sidebarHeader) {
            sidebarHeader.innerHTML = `Logged in as: <strong>${username}</strong><br><span style="color: #ff6b6b;">Administrator Access</span>`;
        }
    } catch (error) {
        console.error('Error displaying user info:', error);
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.getAttribute('data-section');
            switchSection(section);

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

function switchSection(sectionName) {
    console.log(`Switching to section: ${sectionName}`);

    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log(`Activated section: ${sectionName}-section`);
    } else {
        console.error(`Section not found: ${sectionName}-section`);
    }

    // Update page title and subtitle
    updatePageHeader(sectionName);

    // Load section-specific data
    console.log(`Loading data for section: ${sectionName}`);
    loadSectionData(sectionName);
}

function updatePageHeader(section) {
    const titles = {
        dashboard: { title: 'Super Admin Dashboard', subtitle: 'Complete system overview and management' },
        users: { title: 'User Management', subtitle: 'Manage all system users and their permissions' },
        quizzes: { title: 'Quiz Management', subtitle: 'Oversee all quizzes across the platform' },
        system: { title: 'System Settings', subtitle: 'Configure application settings' },
        logs: { title: 'Activity Logs', subtitle: 'Monitor system activities and events' }
    };

    const pageInfo = titles[section] || titles.dashboard;
    document.getElementById('page-title').textContent = pageInfo.title;
    document.getElementById('page-subtitle').textContent = pageInfo.subtitle;
}

function loadSectionData(section) {
    console.log(`loadSectionData called for: ${section}`);
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            console.log('Loading users...');
            loadUsers();
            // Re-setup search after users are loaded
            setTimeout(() => setupSearch(), 500);
            break;
        case 'quizzes':
            loadQuizzes();
            // Re-setup search after quizzes are loaded
            setTimeout(() => setupSearch(), 500);
            break;
        case 'questions':
            loadQuestions();
            break;
        case 'results':
            loadResults();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        // Load statistics
        const stats = await Promise.all([
            loadUserStats(),
            loadQuizStats()
        ]);

        document.getElementById('total-users').textContent = stats[0];
        document.getElementById('total-quizzes').textContent = stats[1];

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadUserStats() {
    try {
        // Get actual user count from auth service
        const response = await fetch(`${AUTH_API}/admin/users/count`, { headers });
        if (response.ok) {
            const data = await response.json();
            console.log('User count data:', data);
            return data.count || data.total || 0;
        } else {
            console.log('User count API failed:', response.status);
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }

    // Fallback to placeholder if API fails
    return 5;
}

async function loadQuizStats() {
    try {
        // Get all quizzes from question bank service
        const response = await fetch(`${API_BASE}/quiz/all`, { headers });
        if (response.ok) {
            const quizzes = await response.json();
            return Array.isArray(quizzes) ? quizzes.length : 0;
        }

        // Fallback: try to get from regular quiz endpoint
        const fallbackResponse = await fetch(`${API_BASE}/quiz/all`, { headers });
        if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            return Array.isArray(data) ? data.length : 0;
        }

        return 0;
    } catch (error) {
        console.error('Error loading quiz stats:', error);
        return 0;
    }
}

// User Management
async function loadUsers() {
    console.log('Loading users...');
    try {
        // Try to get all users from auth service
        const response = await fetch(`${AUTH_API}/admin/users`, { headers });
        if (response.ok) {
            const users = await response.json();
            // console.log('Users loaded from API:', users); // Reduced logging
            // console.log('Sample user data:', users[0]);

            // Transform the user data to match our display format
            const transformedUsers = users.map(user => {
                // console.log('Processing user:', user.username, 'isOnline:', user.isOnline, 'lastLoginTime:', user.lastLoginTime);
                // Check if user is an admin (from database role or localStorage)
                const defaultAdmins = ['admin', 'superuser', 'system'];
                const dynamicAdmins = JSON.parse(localStorage.getItem('adminList') || '[]');
                const allAdmins = [...defaultAdmins, ...dynamicAdmins];
                const isAdmin = user.role === 'admin' || allAdmins.includes(user.username.toLowerCase());
                
                // Check if user is blocked
                const isBlocked = user.isBlocked || user.status === 'blocked';

                return {
                    id: user.id,
                    username: user.username,
                    email: user.email || `${user.username}@example.com`,
                    status: user.status || (isBlocked ? 'blocked' : 'active'),
                    role: user.role || (isAdmin ? 'admin' : 'user'),
                    isBlocked: isBlocked,
                    isAdmin: isAdmin,
                    onlineStatus: user.onlineStatus || 'offline',
                    lastLogin: user.lastLoginTime ? new Date(user.lastLoginTime).toLocaleString() : 'Never'
                };
            });

            console.log('Transformed users:', transformedUsers);
            renderUsersTable(transformedUsers);
            return;
        } else {
            console.log('API response not OK:', response.status, response.statusText);
        }

    } catch (error) {
        console.error('Error calling admin users API:', error);
    }

    // Fallback to placeholder users when API is not available
    console.log('Showing placeholder users...');
    const placeholderUsers = [
        {
            id: '1',
            username: 'admin',
            email: 'admin@quizmaster.com',
            status: 'active',
            role: 'admin',
            isAdmin: true,
            isBlocked: false,
            lastLogin: new Date().toLocaleString()
        },
        {
            id: '2',
            username: 'testuser',
            email: 'user@example.com',
            status: 'active',
            role: 'user',
            isAdmin: false,
            isBlocked: false,
            lastLogin: new Date(Date.now() - 86400000).toLocaleString()
        },
        {
            id: '3',
            username: 'demo',
            email: 'demo@example.com',
            status: 'active',
            role: 'user',
            isAdmin: false,
            isBlocked: false,
            lastLogin: new Date(Date.now() - 172800000).toLocaleString()
        }
    ];

    console.log('Rendering placeholder users:', placeholderUsers);
    renderUsersTable(placeholderUsers);
}

function renderUsersTable(users) {
    console.log('renderUsersTable called with users:', users);
    const tbody = document.getElementById('users-table-body');

    if (!tbody) {
        console.error('users-table-body element not found!');
        return;
    }

    console.log('Found table body element, clearing and adding users...');
    tbody.innerHTML = '';

    users.forEach((user, index) => {
        console.log(`Adding user ${index + 1}:`, user);
        const row = document.createElement('tr');

        // Check if user is admin based on role field or localStorage
        const defaultAdmins = ['admin', 'superuser', 'system'];
        const dynamicAdmins = JSON.parse(localStorage.getItem('adminList') || '[]');
        const allAdmins = [...defaultAdmins, ...dynamicAdmins];
        const isAdmin = user.role === 'admin' || user.isAdmin || allAdmins.includes(user.username.toLowerCase());
        
        // Check if user is blocked - use the actual values from the database
        const isBlocked = user.isBlocked === true || user.status === 'blocked';
        
        // Get online status from user data (online, inactive, offline)
        const onlineStatus = user.onlineStatus || 'offline';

        // Determine status badge and color based on 3-tier system
        let statusBadge = '';
        if (isBlocked) {
            statusBadge = '<span class="badge badge-blocked">🚫 BLOCKED</span>';
        } else if (onlineStatus === 'online') {
            statusBadge = '<span class="badge badge-active">🟢 ONLINE</span>';
        } else if (onlineStatus === 'inactive') {
            statusBadge = '<span class="badge" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">🟡 INACTIVE</span>';
        } else {
            statusBadge = '<span class="badge" style="background: linear-gradient(135deg, #95a5a6, #7f8c8d); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">⚫ OFFLINE</span>';
        }

        // Store user data in row for easy access
        row.dataset.userId = user.id;
        row.dataset.username = user.username;
        row.dataset.isAdmin = isAdmin;
        row.dataset.isBlocked = isBlocked;

        // Check if this is the protected admin account
        const isProtectedAdmin = user.username.toLowerCase() === 'admin';

        row.innerHTML = `
            <td>${user.id}</td>
            <td style="font-weight: ${isAdmin ? 'bold' : 'normal'}; color: ${isAdmin ? '#ff6b6b' : 'inherit'};">
                ${user.username}
                ${isAdmin ? '<span style="background: linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem; margin-left: 5px; font-weight: bold;">🛡️ ADMIN</span>' : ''}
                ${isProtectedAdmin ? '<span style="color: #ffc107; margin-left: 5px;" title="Protected account">🔒</span>' : ''}
            </td>
            <td>${user.email}</td>
            <td>${statusBadge}</td>
            <td>${user.lastLogin || new Date().toLocaleString()}</td>
            <td style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; width: 120px;">
                ${!isProtectedAdmin ? `
                <button class="btn btn-sm" onclick="editUser('${user.id}')" title="Edit user details" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                    <i class="fas fa-edit" style="font-size: 14px;"></i>
                </button>
                ` : `
                <button class="btn btn-sm" disabled title="Admin account is protected" style="background: #cbd5e0; color: #94a3b8; border: none; cursor: not-allowed; padding: 8px 12px; border-radius: 6px;">
                    <i class="fas fa-lock" style="font-size: 14px;"></i>
                </button>
                `}
                ${!isProtectedAdmin ? `
                    ${!isAdmin ? `
                        <button class="btn btn-success btn-sm" onclick="promoteToAdmin('${user.id}', '${user.username}')" title="Promote to admin" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            <i class="fas fa-shield-alt" style="font-size: 14px;"></i>
                        </button>
                    ` : `
                        <button class="btn btn-sm" onclick="demoteFromAdmin('${user.id}', '${user.username}')" title="Remove admin privileges" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                            <i class="fas fa-user" style="font-size: 14px;"></i>
                        </button>
                    `}
                    <button class="btn btn-sm" onclick="toggleUserBlock('${user.id}', '${user.username}', ${isBlocked})" title="${isBlocked ? 'Unblock user' : 'Block user'}" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                        <i class="fas fa-${isBlocked ? 'unlock' : 'ban'}" style="font-size: 14px;"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}', '${user.username}')" title="Delete user" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s;">
                        <i class="fas fa-trash" style="font-size: 14px;"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Quiz Management
async function loadQuizzes() {
    console.log('Loading quizzes...');
    const tbody = document.getElementById('quizzes-table-body');

    try {
        // The /quiz/all endpoint returns an array of quiz IDs (strings)
        const response = await fetch(`${API_BASE}/quiz/all`, { headers });
        if (response.ok) {
            const quizIds = await response.json();
            console.log('Quiz IDs loaded from API:', quizIds);

            if (Array.isArray(quizIds) && quizIds.length > 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Loading quiz details...</td></tr>';

                const transformedQuizzes = [];

                // Process each quiz ID to get detailed information
                for (let i = 0; i < quizIds.length; i++) {
                    const quizId = quizIds[i];
                    console.log(`Processing quiz ${i + 1}/${quizIds.length}: ${quizId}`);

                    try {
                        // Get quiz questions to extract metadata
                        const questionsResponse = await fetch(`${API_BASE}/quiz/${quizId}`, { headers });
                        let quizData = {
                            id: quizId,
                            title: `Quiz ${quizId}`,
                            creator: 'Unknown',
                            questions: 0,
                            participants: 0,
                            status: 'active',
                            created: new Date().toLocaleDateString(),
                            description: '',
                            category: 'General',
                            difficulty: 'medium',
                            timeLimit: 30
                        };

                        if (questionsResponse.ok) {
                            const questions = await questionsResponse.json();
                            console.log(`Questions for quiz ${quizId}:`, questions);

                            if (Array.isArray(questions) && questions.length > 0) {
                                const firstQuestion = questions[0];
                                quizData = {
                                    id: quizId,
                                    title: firstQuestion.quizName || `Quiz ${quizId}`,
                                    creator: firstQuestion.hostUsername || 'Unknown',
                                    questions: questions.length,
                                    participants: 0,
                                    status: 'active',
                                    created: new Date().toLocaleDateString(),
                                    description: firstQuestion.description || '',
                                    category: firstQuestion.category || 'General',
                                    difficulty: firstQuestion.difficulty || 'medium',
                                    timeLimit: firstQuestion.timeLimit || 30
                                };
                                console.log(`Processed quiz data for ${quizId}:`, quizData);
                            }
                        } else {
                            console.log(`Could not fetch questions for quiz ${quizId}: ${questionsResponse.status}`);
                        }

                        // Try to get participant count from results service
                        try {
                            const resultsResponse = await fetch(`${RESULT_API}/quiz/${quizId}`, { headers });
                            if (resultsResponse.ok) {
                                const results = await resultsResponse.json();
                                quizData.participants = Array.isArray(results) ? results.length : 0;
                                console.log(`Participants for quiz ${quizId}: ${quizData.participants}`);
                            }
                        } catch (error) {
                            console.log(`Could not fetch results for quiz ${quizId}:`, error);
                        }

                        transformedQuizzes.push(quizData);

                    } catch (error) {
                        console.log(`Error processing quiz ${quizId}:`, error);
                        // Add basic quiz entry even if there's an error
                        transformedQuizzes.push({
                            id: quizId,
                            title: `Quiz ${quizId}`,
                            creator: 'Unknown',
                            questions: 0,
                            participants: 0,
                            status: 'active',
                            created: new Date().toLocaleDateString(),
                            description: '',
                            category: 'General',
                            difficulty: 'medium',
                            timeLimit: 30
                        });
                    }
                }

                console.log('Transformed quizzes:', transformedQuizzes);
                renderQuizzesTable(transformedQuizzes);
                return;

            } else if (Array.isArray(quizIds) && quizIds.length === 0) {
                console.log('No quizzes found');
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No quizzes found</td></tr>';
                return;
            }
        } else {
            console.log('Quiz API response not OK:', response.status, response.statusText);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Failed to load quizzes: ${response.status} ${response.statusText}</td></tr>`;
            return;
        }
    } catch (error) {
        console.error('Error calling quiz API:', error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">Error loading quizzes: ${error.message}</td></tr>`;
        return;
    }

    // Fallback to placeholder quizzes when API is not available
    console.log('API not available, showing placeholder quizzes...');
    const placeholderQuizzes = [
        {
            id: 'demo-js-quiz',
            title: 'JavaScript Basics Demo',
            creator: 'admin',
            questions: 10,
            participants: 25,
            status: 'active',
            created: new Date().toLocaleDateString(),
            description: 'Basic JavaScript concepts and syntax',
            category: 'Programming',
            difficulty: 'easy',
            timeLimit: 30
        },
        {
            id: 'demo-react-quiz',
            title: 'Advanced React Demo',
            creator: 'testuser',
            questions: 15,
            participants: 12,
            status: 'active',
            created: new Date(Date.now() - 86400000).toLocaleDateString(),
            description: 'Advanced React concepts and patterns',
            category: 'Programming',
            difficulty: 'hard',
            timeLimit: 45
        }
    ];

    renderQuizzesTable(placeholderQuizzes);
}

function renderQuizzesTable(quizzes) {
    const tbody = document.getElementById('quizzes-table-body');
    tbody.innerHTML = '';

    quizzes.forEach(quiz => {
        const row = document.createElement('tr');

        // Add data attributes for edit functionality
        row.setAttribute('data-quiz-id', quiz.id);
        row.setAttribute('data-description', quiz.description || '');
        row.setAttribute('data-category', quiz.category || 'General');
        row.setAttribute('data-difficulty', quiz.difficulty || 'medium');
        row.setAttribute('data-time-limit', quiz.timeLimit || 30);

        row.innerHTML = `
            <td>${quiz.id}</td>
            <td>${quiz.title}</td>
            <td>
                ${quiz.creator}
                ${quiz.creator !== currentUsername ? '<i class="fas fa-user-friends" title="Quiz created by another user" style="color: #ffe066; margin-left: 5px;"></i>' : '<i class="fas fa-user" title="Your quiz" style="color: #51cf66; margin-left: 5px;"></i>'}
            </td>
            <td>${quiz.questions}</td>
            <td>${quiz.participants}</td>
            <td><span class="badge badge-${quiz.status}">${quiz.status}</span></td>
            <td>${quiz.created}</td>
            <td>
                <button class="btn btn-sm" onclick="viewQuiz('${quiz.id}')" title="View Quiz: ${quiz.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm" onclick="editQuiz('${quiz.id}')" title="Edit Quiz: ${quiz.id} (Admin can edit any quiz)">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteQuiz('${quiz.id}')" title="Delete Quiz: ${quiz.id} (Admin can delete any quiz)">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Activity Logs
async function loadLogs() {
    try {
        // Try to get activity logs from auth service
        const response = await fetch(`${AUTH_API}/admin/logs`, { headers });
        if (response.ok) {
            const logs = await response.json();
            if (Array.isArray(logs)) {
                renderLogsTable(logs);
                return;
            }
        }

        // Fallback: create logs from available data
        const fallbackLogs = [];

        // Add quiz creation logs
        try {
            const quizResponse = await fetch(`${API_BASE}/quiz/all`, { headers });
            if (quizResponse.ok) {
                const quizzes = await quizResponse.json();
                if (Array.isArray(quizzes)) {
                    quizzes.slice(0, 5).forEach((quiz, index) => {
                        fallbackLogs.push({
                            timestamp: quiz.createdAt ? new Date(quiz.createdAt).toLocaleString() : new Date().toLocaleString(),
                            user: quiz.creator || 'Unknown',
                            action: 'CREATE_QUIZ',
                            resource: `Quiz: ${quiz.title || 'Untitled'}`,
                            ip: '192.168.1.' + (100 + index)
                        });
                    });
                }
            }
        } catch (e) {
            console.error('Error fetching quiz logs:', e);
        }

        // Add result submission logs
        try {
            const resultResponse = await fetch(`${RESULT_API}/admin/results/recent`, { headers });
            if (resultResponse.ok) {
                const results = await resultResponse.json();
                if (Array.isArray(results)) {
                    results.slice(0, 5).forEach((result, index) => {
                        fallbackLogs.push({
                            timestamp: result.submittedAt ? new Date(result.submittedAt).toLocaleString() : new Date().toLocaleString(),
                            user: result.studentUsername || result.student || 'Anonymous',
                            action: 'SUBMIT_QUIZ',
                            resource: `Quiz: ${result.quizTitle || result.quizId}`,
                            ip: '192.168.1.' + (150 + index)
                        });
                    });
                }
            }
        } catch (e) {
            console.error('Error fetching result logs:', e);
        }

        // Sort logs by timestamp (most recent first)
        fallbackLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (fallbackLogs.length > 0) {
            renderLogsTable(fallbackLogs);
        } else {
            renderLogsTable([]);
            showNotification('No activity logs available. Logs service may not be configured.', 'warning');
        }

    } catch (error) {
        console.error('Error loading logs:', error);
        showNotification('Error loading logs: ' + error.message, 'error');
        renderLogsTable([]);
    }
}

function renderLogsTable(logs) {
    const tbody = document.getElementById('logs-table-body');
    tbody.innerHTML = '';

    logs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${log.timestamp}</td>
            <td>${log.user}</td>
            <td><span class="badge badge-${log.action.toLowerCase()}">${log.action}</span></td>
            <td>${log.resource}</td>
            <td>${log.ip}</td>
        `;
        tbody.appendChild(row);
    });
}

// Search Functionality
function setupSearch() {
    console.log('Setting up search functionality...');
    const searchInputs = document.querySelectorAll('[id$="-search"]');
    console.log('Found search inputs:', searchInputs.length);

    searchInputs.forEach((input, index) => {
        console.log(`Search input ${index}:`, input.id);
        
        // Remove any existing listeners by cloning and replacing the node
        const newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);
        
        newInput.addEventListener('input', function (e) {
            const searchTerm = this.value.toLowerCase();
            console.log(`Search triggered on ${this.id} with term: "${searchTerm}"`);
            const tableId = this.id.replace('-search', '-table-body');
            const tbody = document.getElementById(tableId);
            
            if (!tbody) {
                console.error('Table body not found:', tableId);
                return;
            }
            
            const rows = tbody.querySelectorAll('tr');
            console.log(`Searching ${rows.length} rows in ${tableId}`);
            let visibleCount = 0;

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                const matches = text.includes(searchTerm);
                row.style.display = matches ? '' : 'none';
                if (matches) visibleCount++;
            });
            
            console.log(`Search term "${searchTerm}" - ${visibleCount}/${rows.length} rows visible`);
        });
        
        console.log(`Event listener attached to ${newInput.id}`);
    });
    
    console.log('Search setup complete');
}

// Filter Functionality
function setupFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    console.log('Setting up filter tabs:', filterTabs.length);

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            // Remove active class from all tabs
            filterTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');

            // Apply filter
            const filter = this.getAttribute('data-filter');
            console.log('Applying filter:', filter);
            applyFilter(filter);
        });
    });
}

function applyFilter(filter) {
    console.log('Filtering users by:', filter);
    const tbody = document.getElementById('users-table-body');
    if (!tbody) {
        console.error('users-table-body not found');
        return;
    }
    
    const rows = tbody.querySelectorAll('tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const statusCell = row.cells[3]; // Status column
        if (!statusCell) return;
        
        const statusText = statusCell.textContent.toLowerCase();
        let shouldShow = false;
        
        if (filter === 'all') {
            shouldShow = true;
        } else if (filter === 'active') {
            shouldShow = statusText.includes('active');
        } else if (filter === 'blocked') {
            shouldShow = statusText.includes('blocked') || statusText.includes('inactive');
        } else if (filter === 'admins') {
            shouldShow = statusText.includes('admin');
        }
        
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });
    
    console.log(`Filter "${filter}" - ${visibleCount}/${rows.length} rows visible`);
}

// Modal Management
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openCreateQuizModal() {
    // Clear the form first
    document.getElementById('quiz-form').reset();
    // Open the modal
    openModal('quiz-modal');
}

// CRUD Operations
async function editUser(userId) {
    try {
        console.log('Editing user with ID:', userId);

        // Fetch user data from the API
        const response = await fetch(`${AUTH_API}/admin/users/${userId}`, { headers });
        
        if (response.ok) {
            const userData = await response.json();
            
            // Check if this is the admin account before allowing edit
            if (userData.username.toLowerCase() === 'admin') {
                showNotification('Cannot edit the admin account - it is protected', 'error');
                return;
            }
            
            console.log('User data to edit:', userData);

            // Populate the edit modal form with user data
            const modal = document.getElementById('edit-user-modal');
            const form = document.getElementById('edit-user-form');

            // Update modal title
            const modalTitle = document.getElementById('edit-user-title');
            if (modalTitle) {
                modalTitle.textContent = `Edit User - ${userData.username}`;
            }

            // Populate form fields
            const usernameField = document.getElementById('edit-username');
            const emailField = document.getElementById('edit-email');
            const passwordField = document.getElementById('edit-password');
            const makeAdminCheckbox = document.getElementById('make-admin');

            if (usernameField) {
                usernameField.value = userData.username || '';
                usernameField.dataset.userId = userId; // Store userId for form submission
            }
            if (emailField) emailField.value = userData.email || '';
            if (passwordField) passwordField.value = ''; // Don't show existing password

            // Check if user is already an admin
            const adminList = JSON.parse(localStorage.getItem('adminList') || '[]');
            const isCurrentlyAdmin = adminList.includes(userData.username.toLowerCase());
            if (makeAdminCheckbox) makeAdminCheckbox.checked = isCurrentlyAdmin;

            // Open the edit modal
            openModal('edit-user-modal');
            showNotification('Loading user data for editing...', 'info');
        } else {
            const errorData = await response.json();
            showNotification('User not found or access denied: ' + (errorData.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error editing user:', error);
        showNotification('Error accessing user data: ' + error.message, 'error');
    }
}

async function deleteUser(userId, username) {
    // Prevent deletion of admin account
    if (username.toLowerCase() === 'admin') {
        showNotification('Cannot delete the admin account - it is protected', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
        try {
            const response = await fetch(`${AUTH_API}/admin/users/${userId}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                showNotification(`User "${username}" deleted successfully`, 'success');
                // Reload users table
                loadUsers();
                loadDashboardData(); // Refresh stats
            } else {
                const errorData = await response.json();
                showNotification('Failed to delete user: ' + (errorData.error || errorData.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user: ' + error.message, 'error');
        }
    }
}

async function toggleUserBlock(userId, username, isCurrentlyBlocked) {
    // Prevent blocking admin account
    if (username.toLowerCase() === 'admin') {
        showNotification('Cannot block the admin account - it is protected', 'error');
        return;
    }
    
    const action = isCurrentlyBlocked ? 'unblock' : 'block';
    if (confirm(`Are you sure you want to ${action} user "${username}"?`)) {
        try {
            const response = await fetch(`${AUTH_API}/admin/users/${userId}/toggle-status`, {
                method: 'PUT',
                headers
            });

            if (response.ok) {
                const result = await response.json();
                const newStatus = result.isBlocked ? 'blocked' : 'unblocked';
                showNotification(`User "${username}" ${newStatus} successfully`, 'success');
                // Reload users table
                loadUsers();
            } else {
                const errorData = await response.json();
                showNotification('Failed to update user status: ' + (errorData.error || errorData.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            showNotification('Error updating user status: ' + error.message, 'error');
        }
    }
}

async function promoteToAdmin(userId, username) {
    if (confirm(`Are you sure you want to promote "${username}" to Administrator? This will grant them full system access.`)) {
        try {
            const response = await fetch(`${AUTH_API}/admin/users/${userId}/promote`, {
                method: 'PUT',
                headers
            });

            if (response.ok) {
                showNotification(`User "${username}" promoted to Administrator`, 'success');
                // Also add to localStorage for client-side tracking
                const adminList = JSON.parse(localStorage.getItem('adminList') || '[]');
                if (!adminList.includes(username.toLowerCase())) {
                    adminList.push(username.toLowerCase());
                    localStorage.setItem('adminList', JSON.stringify(adminList));
                }
                // Reload users table
                loadUsers();
            } else {
                const errorData = await response.json();
                showNotification('Failed to promote user: ' + (errorData.error || errorData.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error promoting user:', error);
            showNotification('Error promoting user: ' + error.message, 'error');
        }
    }
}

async function demoteFromAdmin(userId, username) {
    // Prevent demoting admin account
    if (username.toLowerCase() === 'admin') {
        showNotification('Cannot demote the admin account - it is protected', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to remove Administrator privileges from "${username}"? They will become a regular user.`)) {
        try {
            const response = await fetch(`${AUTH_API}/admin/users/${userId}/demote`, {
                method: 'PUT',
                headers
            });

            if (response.ok) {
                showNotification(`Administrator privileges removed from "${username}"`, 'success');
                // Also remove from localStorage
                const adminList = JSON.parse(localStorage.getItem('adminList') || '[]');
                const index = adminList.indexOf(username.toLowerCase());
                if (index > -1) {
                    adminList.splice(index, 1);
                    localStorage.setItem('adminList', JSON.stringify(adminList));
                }
                // Reload users table
                loadUsers();
            } else {
                const errorData = await response.json();
                showNotification('Failed to demote user: ' + (errorData.error || errorData.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error demoting user:', error);
            showNotification('Error demoting user: ' + error.message, 'error');
        }
    }
}

async function toggleUserStatus(userId) {
    try {
        const response = await fetch(`${AUTH_API}/admin/users/${userId}/toggle-status`, {
            method: 'PUT',
            headers
        });

        if (response.ok) {
            showNotification('User status updated successfully', 'success');
            // Reload users table
            loadUsers();
        } else {
            const errorData = await response.json();
            showNotification('Failed to update user status: ' + (errorData.error || errorData.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        showNotification('Error updating user status: ' + error.message, 'error');
    }
}

function viewQuiz(quizId) {
    console.log('viewQuiz called with ID:', quizId);
    console.log('Type of quizId:', typeof quizId);

    if (!quizId || quizId === 'undefined' || quizId === 'null') {
        console.error('Invalid quiz ID received:', quizId);
        showNotification('Invalid quiz ID', 'error');
        return;
    }

    // Set the quiz ID in localStorage so quiz.js can pick it up
    localStorage.setItem("currentQuizId", quizId);
    console.log('Quiz ID set in localStorage:', localStorage.getItem("currentQuizId"));

    // Redirect to the quiz page
    window.location.href = "quiz.html";
}

function editQuiz(quizId) {
    console.log('Redirecting to edit questions for quiz ID:', quizId);

    if (!quizId || quizId === 'undefined' || quizId === 'null') {
        console.error('Invalid quiz ID received:', quizId);
        showNotification('Invalid quiz ID', 'error');
        return;
    }

    // Redirect to the admin question management page for this specific quiz
    window.location.href = `admin.html?quizId=${quizId}`;
}

// Create New Quiz
async function createQuiz() {
    console.log('Creating new quiz...');

    // Get form data
    const title = document.getElementById('new-quiz-title').value.trim();
    const description = document.getElementById('new-quiz-description').value.trim();
    const category = document.getElementById('new-quiz-category').value;
    const difficulty = document.getElementById('new-quiz-difficulty').value;
    const timeLimit = parseInt(document.getElementById('new-quiz-time-limit').value);
    const isActive = document.getElementById('new-quiz-active').checked;

    // Basic validation
    if (!title) {
        showNotification('Quiz title is required', 'error');
        return;
    }

    if (timeLimit <= 0) {
        showNotification('Time limit must be a positive number', 'error');
        return;
    }

    // Generate a unique quiz ID
    const quizId = 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    // Since we don't have a quiz metadata endpoint, we'll create a placeholder question
    // This matches how the host.js creates quizzes
    const placeholderQuestion = {
        questionText: "Quiz created - add your first question",
        optionA: "This is a placeholder question",
        optionB: "Please edit this question",
        optionC: "Add more questions to complete the quiz",
        optionD: "Use the admin panel to manage questions",
        correctAnswer: "A",
        quizId: quizId,
        quizName: title
    };

    console.log('Creating quiz with placeholder question:', placeholderQuestion);

    try {
        // Create the placeholder question to establish the quiz
        const response = await fetch(`${API_BASE}/add`, {
            method: 'POST',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(placeholderQuestion)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Quiz created successfully:', result);
            showNotification(`Quiz "${title}" created successfully! Quiz ID: ${quizId}`, 'success');

            // Clear form
            document.getElementById('quiz-form').reset();

            // Close modal
            closeModal('quiz-modal');

            // Reload quizzes
            loadQuizzes();
            loadDashboardData();
        } else {
            const errorData = await response.json();
            console.error('Error creating quiz:', errorData);
            showNotification('Failed to create quiz: ' + (errorData.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error creating quiz:', error);
        showNotification('Error creating quiz: ' + error.message, 'error');
    }
}

// Update Quiz
async function updateQuiz() {
    console.log('Updating quiz...');

    // Get form data
    const quizId = document.getElementById('edit-quiz-id').value;
    const title = document.getElementById('edit-quiz-title').value.trim();
    const description = document.getElementById('edit-quiz-description').value.trim();
    const category = document.getElementById('edit-quiz-category').value;
    const difficulty = document.getElementById('edit-quiz-difficulty').value;
    const timeLimit = parseInt(document.getElementById('edit-quiz-time-limit').value);
    const isActive = document.getElementById('edit-quiz-active').checked;

    // Basic validation
    if (!title) {
        showNotification('Quiz title is required', 'error');
        return;
    }

    if (timeLimit <= 0) {
        showNotification('Time limit must be a positive number', 'error');
        return;
    }

    console.log(`Updating quiz ${quizId} with title: ${title}`);

    try {
        // Get all questions for this quiz first
        const questionsResponse = await fetch(`${API_BASE}/quiz/${quizId}`, { headers });
        if (!questionsResponse.ok) {
            showNotification('Quiz not found', 'error');
            return;
        }

        const questions = await questionsResponse.json();
        console.log(`Found ${questions.length} questions for quiz ${quizId}`);

        if (questions.length === 0) {
            showNotification('Quiz has no questions to update', 'error');
            return;
        }

        // Update all questions with the new quiz name (this is the only metadata we can update currently)
        let updateCount = 0;
        let errorCount = 0;

        for (const question of questions) {
            try {
                const updatedQuestion = {
                    ...question,
                    quizName: title
                    // Note: The current Question model doesn't have fields for description, category, difficulty, timeLimit
                    // These would need to be added to the model if we want to persist them
                };

                const updateResponse = await fetch(`${API_BASE}/${question.id}`, {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedQuestion)
                });

                if (updateResponse.ok) {
                    updateCount++;
                    console.log(`Updated question ${question.id}`);
                } else {
                    errorCount++;
                    console.error(`Failed to update question ${question.id}:`, updateResponse.status);
                }
            } catch (error) {
                errorCount++;
                console.error(`Error updating question ${question.id}:`, error);
            }
        }

        if (updateCount > 0) {
            const creatorInfo = quizData.creator !== currentUsername ? ` (originally created by ${quizData.creator})` : '';
            showNotification(`Quiz "${title}" updated successfully! (${updateCount} questions updated)${creatorInfo}`, 'success');

            // Close modal
            closeModal('edit-quiz-modal');

            // Reload quizzes
            loadQuizzes();
            loadDashboardData();
        } else {
            showNotification('Failed to update quiz - no questions were updated', 'error');
        }

        if (errorCount > 0) {
            console.warn(`${errorCount} questions failed to update`);
        }

    } catch (error) {
        console.error('Error updating quiz:', error);
        showNotification('Error updating quiz: ' + error.message, 'error');
    }
}

async function deleteQuiz(quizId) {
    // Find the quiz creator for the confirmation message
    const tbody = document.getElementById('quizzes-table-body');
    let creator = 'Unknown';

    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        for (const row of rows) {
            const rowQuizId = row.getAttribute('data-quiz-id') || row.cells[0]?.textContent?.trim();
            if (rowQuizId === quizId || rowQuizId == quizId) {
                creator = row.cells[2]?.textContent?.trim() || 'Unknown';
                break;
            }
        }
    }

    const creatorInfo = creator !== currentUsername ? ` (created by ${creator})` : '';
    const confirmMessage = `Are you sure you want to delete this quiz${creatorInfo}? This action cannot be undone and will delete all questions and results.`;

    if (confirm(confirmMessage)) {
        try {
            // Use the correct delete endpoint from the QuestionController
            const response = await fetch(`${API_BASE}/quiz/${quizId}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                const successMessage = creator !== currentUsername
                    ? `Quiz deleted successfully (was created by ${creator})`
                    : 'Quiz deleted successfully';
                showNotification(successMessage, 'success');
                // Reload quizzes table
                loadQuizzes();
                // Also reload dashboard stats
                loadDashboardData();
            } else {
                const errorText = await response.text();
                console.error('Delete quiz error:', response.status, errorText);
                showNotification('Failed to delete quiz: ' + (errorText || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error deleting quiz:', error);
            showNotification('Error deleting quiz: ' + error.message, 'error');
        }
    }
}

async function viewQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE}/admin/questions/${questionId}`, { headers });
        if (response.ok) {
            const question = await response.json();
            alert(`Question: ${question.questionText || question.text}\n\nOptions:\n${(question.options || []).join('\n')}\n\nCorrect Answer: ${question.correctAnswer || 'Not specified'}`);
        } else {
            showNotification('Question not found', 'error');
        }
    } catch (error) {
        console.error('Error viewing question:', error);
        showNotification('Error loading question details: ' + error.message, 'error');
    }
}

async function editQuestion(questionId) {
    try {
        const response = await fetch(`${API_BASE}/admin/questions/${questionId}`, { headers });
        if (response.ok) {
            const question = await response.json();
            console.log('Question to edit:', question);
            // Here you would populate the question modal with real data
            openModal('question-modal');
        } else {
            showNotification('Question not found', 'error');
        }
    } catch (error) {
        console.error('Error editing question:', error);
        showNotification('Error loading question: ' + error.message, 'error');
    }
}

async function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
        try {
            const response = await fetch(`${API_BASE}/admin/questions/${questionId}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                showNotification('Question deleted successfully', 'success');
                // Reload questions table
                loadQuestions();
                // Also reload dashboard stats
                loadDashboardData();
            } else {
                const errorData = await response.json();
                showNotification('Failed to delete question: ' + (errorData.message || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error deleting question:', error);
            showNotification('Error deleting question: ' + error.message, 'error');
        }
    }
}

// Utility Functions
async function exportReports() {
    try {
        showNotification('Generating reports...', 'info');

        // Get all data for export
        const [users, quizzes, results] = await Promise.all([
            fetch(`${AUTH_API}/admin/users`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${API_BASE}/quiz/all`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
            fetch(`${RESULT_API}/admin/results/all`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
        ]);

        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add Users Report
        csvContent += "=== USERS REPORT ===\n";
        csvContent += "ID,Username,Email,Status,Last Login\n";
        users.forEach(user => {
            csvContent += `${user.id || ''},${user.username || ''},${user.email || ''},${user.status || ''},${user.lastLogin || ''}\n`;
        });

        csvContent += "\n=== QUIZZES REPORT ===\n";
        csvContent += "Quiz ID,Title,Creator,Questions Count,Participants,Status,Created Date\n";
        quizzes.forEach(quiz => {
            const questionCount = quiz.questions ? quiz.questions.length : (quiz.questionCount || 0);
            csvContent += `${quiz.id || quiz.quizId || ''},${quiz.title || ''},${quiz.creator || ''},${questionCount},${quiz.participants || 0},${quiz.status || (quiz.isActive ? 'active' : 'inactive')},${quiz.created || quiz.createdAt || ''}\n`;
        });

        csvContent += "\n=== RESULTS REPORT ===\n";
        csvContent += "Result ID,Student,Quiz ID,Score,Completion Status,Submitted Date\n";
        results.forEach(result => {
            csvContent += `${result.id || ''},${result.studentUsername || result.student || ''},${result.quizId || ''},${result.score || 0},${result.completed || false},${result.submittedAt || result.createdAt || ''}\n`;
        });

        // Create and download file
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `quiz_app_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Reports exported successfully', 'success');

    } catch (error) {
        console.error('Error exporting reports:', error);
        showNotification('Error exporting reports: ' + error.message, 'error');
    }
}

function clearLogs() {
    if (confirm('Are you sure you want to clear all logs?')) {
        document.getElementById('logs-table-body').innerHTML = '';
        showNotification('Logs cleared successfully', 'success');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;

    // Set background color based on type
    const colors = {
        success: 'linear-gradient(135deg, #51cf66, #37b24d)',
        error: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
        info: 'linear-gradient(135deg, #667eea, #764ba2)',
        warning: 'linear-gradient(135deg, #ffd43b, #ffc107)'
    };
    notification.style.background = colors[type] || colors.info;

    // Add to document
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        console.log('[Logout] Starting logout process...');
        
        // Stop heartbeat first
        if (window.stopHeartbeat) {
            window.stopHeartbeat();
            console.log('[Logout] Heartbeat stopped');
        }
        
        // Call logout endpoint to set user offline immediately
        const username = localStorage.getItem('username');
        const token = localStorage.getItem('token');
        
        console.log('[Logout] Username:', username, 'Token exists:', !!token);
        
        if (username) {
            // Use synchronous request to ensure it completes before redirect
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${AUTH_API}/logout`, false); // false = synchronous
            xhr.setRequestHeader('Content-Type', 'application/json');
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
            try {
                const payload = JSON.stringify({ username: username });
                console.log('[Logout] Sending logout request with payload:', payload);
                xhr.send(payload);
                console.log('[Logout] Response status:', xhr.status, 'Response:', xhr.responseText);
            } catch (err) {
                console.error('[Logout] Logout call failed:', err);
            }
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        console.log('[Logout] LocalStorage cleared, redirecting...');
        window.location.href = 'index.html';
    }
}

// Close modals when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Form submission handlers
document.addEventListener('DOMContentLoaded', function () {
    // User form submission
    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const userData = {
                username: formData.get('username'),
                email: formData.get('email'),
                password: formData.get('password')
            };

            // Validate fields
            if (!userData.username || !userData.email || !userData.password) {
                showNotification('All fields are required', 'error');
                return;
            }

            console.log('Creating user:', { username: userData.username, email: userData.email });

            try {
                const response = await fetch(`${AUTH_API}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('User created:', result);
                    showNotification('User created successfully', 'success');
                    closeModal('user-modal');
                    this.reset();
                    loadUsers(); // Reload users table
                    loadDashboardData(); // Refresh stats
                } else {
                    const errorData = await response.json();
                    console.error('Failed to create user:', errorData);
                    showNotification('Failed to create user: ' + (errorData.error || errorData.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                console.error('Error creating user:', error);
                showNotification('Error creating user: ' + error.message, 'error');
            }
        });
    }

    // Edit user form submission
    const editUserForm = document.getElementById('edit-user-form');
    if (editUserForm) {
        editUserForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const userId = document.getElementById('edit-username').dataset.userId;
            const username = document.getElementById('edit-username').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const password = document.getElementById('edit-password').value.trim();
            const makeAdmin = document.getElementById('make-admin').checked;

            if (!username) {
                showNotification('Username is required!', 'error');
                return;
            }

            if (!email) {
                showNotification('Email is required!', 'error');
                return;
            }

            try {
                console.log('Updating user:', { userId, username, email, password: password ? '[SET]' : '[EMPTY]', makeAdmin });

                // Update user data - only include password if it's provided
                const updateData = { username, email };
                if (password && password.length > 0) {
                    updateData.password = password;
                    console.log('Including password in update');
                } else {
                    console.log('Password field empty - keeping existing password');
                }

                const response = await fetch(`${AUTH_API}/admin/users/${userId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    // Handle admin promotion
                    if (makeAdmin) {
                        const adminList = JSON.parse(localStorage.getItem('adminList') || '[]');
                        const lowercaseUsername = username.toLowerCase();
                        if (!adminList.includes(lowercaseUsername)) {
                            adminList.push(lowercaseUsername);
                            localStorage.setItem('adminList', JSON.stringify(adminList));
                            console.log('User promoted to admin:', lowercaseUsername);
                        }
                    }

                    showNotification('User updated successfully!', 'success');
                    closeModal('edit-user-modal');
                    this.reset();
                    loadUsers(); // Refresh the user list
                } else {
                    const errorData = await response.json();
                    showNotification('Failed to update user: ' + (errorData.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                console.error('Error updating user:', error);
                showNotification('Error updating user: ' + error.message, 'error');
            }
        });
    }

    // Question form submission
    const questionForm = document.getElementById('question-form');
    if (questionForm) {
        questionForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const formData = new FormData(this);
            const questionData = {
                questionText: formData.get('question') || this.querySelector('textarea').value,
                category: formData.get('category') || this.querySelectorAll('input[type="text"]')[1].value,
                difficulty: formData.get('difficulty') || this.querySelector('select').value,
                // Add more fields as needed for your question structure
            };

            try {
                const response = await fetch(`${API_BASE}/admin/questions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(questionData)
                });

                if (response.ok) {
                    showNotification('Question added successfully', 'success');
                    closeModal('question-modal');
                    this.reset();
                    loadQuestions(); // Reload questions table
                } else {
                    const errorData = await response.json();
                    showNotification('Failed to add question: ' + (errorData.message || 'Unknown error'), 'error');
                }
            } catch (error) {
                console.error('Error adding question:', error);
                showNotification('Error adding question: ' + error.message, 'error');
            }
        });
    }

    // Quiz form submission (Create new quiz)
    const quizForm = document.getElementById('quiz-form');
    if (quizForm) {
        quizForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await createQuiz();
        });
    }

    // Edit quiz form submission
    const editQuizForm = document.getElementById('edit-quiz-form');
    if (editQuizForm) {
        editQuizForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await updateQuiz();
        });
    }
});

// Add CSS for animations and badges
const additionalStyles = `
    <style>
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .badge {
            padding: 0.3rem 0.6rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .badge-student { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; }
        .badge-teacher { background: linear-gradient(135deg, #f093fb, #f5576c); color: white; }
        .badge-admin { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .badge-active { background: linear-gradient(135deg, #51cf66, #37b24d); color: white; }
        .badge-blocked { background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; }
        .badge-easy { background: linear-gradient(135deg, #51cf66, #37b24d); color: white; }
        .badge-medium { background: linear-gradient(135deg, #ffd43b, #ffc107); color: white; }
        .badge-hard { background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; }
        .badge-login { background: linear-gradient(135deg, #4facfe, #00f2fe); color: white; }
        .badge-create_quiz { background: linear-gradient(135deg, #51cf66, #37b24d); color: white; }
        .badge-delete_user { background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; }
        
        .btn-sm {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
            margin: 0 0.2rem;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);
