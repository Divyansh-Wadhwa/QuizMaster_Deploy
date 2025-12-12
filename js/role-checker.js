// role-checker.js - Utility for role-based access control
function getUserRole() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        return {
            username: tokenPayload.sub || tokenPayload.username,
            role: tokenPayload.role || 'student'
        };
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

function isSuperAdmin() {
    const user = getUserRole();
    if (!user) return false;

    // Check localStorage adminList for promoted users
    const adminList = JSON.parse(localStorage.getItem('adminList') || '[]');
    const isInAdminList = adminList.includes(user.username.toLowerCase());

    // Default admin users and roles
    const allowedRoles = ['super_admin', 'system_admin'];
    const allowedUsers = ['admin', 'superuser', 'system'];
    const isDefaultAdmin = allowedRoles.includes(user.role) || allowedUsers.includes(user.username.toLowerCase());

    return isDefaultAdmin || isInAdminList;
}

function isAdmin() {
    const user = getUserRole();
    if (!user) return false;

    const adminRoles = ['admin', 'super_admin', 'system_admin'];
    return adminRoles.includes(user.role);
}

function canAccessPage(requiredRole) {
    const user = getUserRole();
    if (!user) return false;

    const roleHierarchy = {
        'student': 0,
        'teacher': 1,
        'admin': 2,
        'super_admin': 3,
        'system_admin': 4
    };

    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
}

// Add super admin link to navigation if user has access
document.addEventListener('DOMContentLoaded', function () {
    console.log('Role checker loaded, checking admin status...');
    const user = getUserRole();
    console.log('Current user:', user);

    const adminList = JSON.parse(localStorage.getItem('adminList') || '[]');
    console.log('Admin list:', adminList);

    const isAdmin = isSuperAdmin();
    console.log('Is super admin:', isAdmin);

    if (isAdmin) {
        console.log('Adding super admin button...');
        addSuperAdminLink();
    } else {
        console.log('User does not have super admin access');
    }
});

function addSuperAdminLink() {
    // Check if super admin button already exists to avoid duplicates
    if (document.querySelector('.super-admin-btn')) {
        return;
    }

    // Try to find the dashboard center element or buttons container
    const targetElements = [
        document.querySelector('.dashboard-center'),
        document.querySelector('#published-quizzes-btn'),
        document.body
    ];

    for (let target of targetElements) {
        if (target) {
            const superAdminButton = document.createElement('button');
            superAdminButton.innerHTML = `
                <i class="fas fa-crown" style="margin-right: 8px;"></i>
                Super Admin Panel
            `;
            superAdminButton.className = 'super-admin-btn dashboard-btn';
            superAdminButton.style.cssText = `
                background: linear-gradient(135deg, #ff6b6b, #ee5a52) !important;
                color: white !important;
                border: none;
                padding: 14px 20px;
                border-radius: 12px;
                font-weight: 600;
                cursor: pointer;
                margin: 10px 0;
                font-family: 'Quicksand', sans-serif;
                font-size: 1.1rem;
                width: 100%;
                max-width: 520px;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                text-decoration: none;
            `;

            superAdminButton.addEventListener('mouseenter', function () {
                this.style.transform = 'translateY(-2px) scale(1.02)';
                this.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.4)';
            });

            superAdminButton.addEventListener('mouseleave', function () {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
            });

            superAdminButton.addEventListener('click', function () {
                window.location.href = 'super-admin.html';
            });

            // Insert the button before the logout button if in dashboard-center
            if (target.className === 'dashboard-center') {
                const logoutBtn = target.querySelector('.dashboard-logout');
                if (logoutBtn) {
                    target.insertBefore(superAdminButton, logoutBtn);
                } else {
                    target.appendChild(superAdminButton);
                }
            } else {
                target.appendChild(superAdminButton);
            }

            console.log('Super Admin button added for user');
            break;
        }
    }
}
