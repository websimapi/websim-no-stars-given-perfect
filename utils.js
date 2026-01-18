/* --- Constants & Config --- */
window.DOMAINS = [
    { id: 'gamedev', label: 'Game Design', color: 'bg-purple-100 text-purple-700' },
    { id: 'code', label: 'Programming', color: 'bg-blue-100 text-blue-700' },
    { id: 'art', label: 'Visual Art', color: 'bg-pink-100 text-pink-700' },
    { id: 'ux', label: 'UX/UI', color: 'bg-orange-100 text-orange-700' },
    { id: 'audio', label: 'Audio', color: 'bg-teal-100 text-teal-700' },
    { id: 'writing', label: 'Writing', color: 'bg-slate-200 text-slate-700' },
];

window.STAR_MEANINGS = {
    1: "This helped",
    2: "Helped + Clear",
    3: "Solved my issue",
    4: "Solved + Taught me",
    5: "Changed how I think"
};

/* --- Data Helpers --- */

// Format relative time
window.timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

// Calculate Stats for a user
window.calculateUserStats = (allStars, userId) => {
    const received = allStars.filter(s => s.to_user_id === userId);
    const total = received.reduce((sum, s) => sum + (s.amount || 0), 0);
    
    const byDomain = {};
    received.forEach(s => {
        if (s.domain) {
            byDomain[s.domain] = (byDomain[s.domain] || 0) + s.amount;
        }
    });

    return { total, byDomain };
};