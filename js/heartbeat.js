// heartbeat.js - Keep user session active and track online status

(function() {
    const AUTH_API = window.AUTH_API_BASE || 'http://localhost:8080/api/auth';
    const HEARTBEAT_INTERVAL = 10000; // Send heartbeat every 10 seconds for faster detection
    
    let heartbeatTimer = null;
    
    function sendHeartbeat() {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        
        // Reduced logging noise
        // console.log('[Heartbeat] Checking credentials - token:', !!token, 'username:', username);
        
        if (!token || !username) {
            // console.log('[Heartbeat] No credentials found, stopping heartbeat');
            stopHeartbeat();
            return;
        }
        
        // console.log('[Heartbeat] Sending heartbeat for user:', username);
        
        fetch(`${AUTH_API}/heartbeat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => {
            // console.log('[Heartbeat] Response status:', response.status);
            if (!response.ok) {
                console.log('[Heartbeat] Failed, user may have been logged out');
                stopHeartbeat();
            }
            return response.json();
        })
        .then(data => {
            // console.log('[Heartbeat] Response data:', data);
        })
        .catch(err => {
            console.log('[Heartbeat] Error:', err);
        });
    }
    
    function startHeartbeat() {
        // Send initial heartbeat
        sendHeartbeat();
        
        // Set up periodic heartbeat
        heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
        
        console.log('Heartbeat started - sending every', HEARTBEAT_INTERVAL / 1000, 'seconds');
    }
    
    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
            console.log('Heartbeat stopped');
        }
    }
    
    function setUserOffline() {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        
        if (username) {
            console.log('[Heartbeat] Setting user offline:', username);
            
            // Try multiple methods to ensure logout is called
            const data = JSON.stringify({ username: username });
            
            // Method 1: sendBeacon (best for page unload)
            if (navigator.sendBeacon) {
                const blob = new Blob([data], { type: 'application/json' });
                const sent = navigator.sendBeacon(`${AUTH_API}/logout`, blob);
                console.log('[Heartbeat] sendBeacon result:', sent);
            }
            
            // Method 2: Synchronous XHR as backup
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${AUTH_API}/logout`, false); // synchronous
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(data);
                console.log('[Heartbeat] XHR logout completed');
            } catch (err) {
                console.log('[Heartbeat] XHR failed:', err);
            }
        }
    }
    
    // Start heartbeat when page loads if user is logged in
    if (localStorage.getItem('token') && localStorage.getItem('username')) {
        startHeartbeat();
    }
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Don't stop heartbeat when hidden - let it timeout naturally
            // This prevents premature offline status
        } else {
            console.log('[Heartbeat] Page visible - ensuring heartbeat is active');
            if (localStorage.getItem('token') && localStorage.getItem('username')) {
                if (!heartbeatTimer) {
                    startHeartbeat();
                }
            }
        }
    });
    
    // Set user offline when page is closing/reloading
    window.addEventListener('beforeunload', function() {
        stopHeartbeat();
        setUserOffline();
    });
    
    // Handle page unload
    window.addEventListener('unload', function() {
        setUserOffline();
    });
    
    // Expose functions globally for manual control if needed
    window.startHeartbeat = startHeartbeat;
    window.stopHeartbeat = stopHeartbeat;
})();
