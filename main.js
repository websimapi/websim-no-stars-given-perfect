const { useState, useEffect, useMemo, useRef } = React;

const room = new WebsimSocket();

/* --- Constants & Config --- */
const DOMAINS = [
    { id: 'gamedev', label: 'Game Design', color: 'bg-purple-100 text-purple-700' },
    { id: 'code', label: 'Programming', color: 'bg-blue-100 text-blue-700' },
    { id: 'art', label: 'Visual Art', color: 'bg-pink-100 text-pink-700' },
    { id: 'ux', label: 'UX/UI', color: 'bg-orange-100 text-orange-700' },
    { id: 'audio', label: 'Audio', color: 'bg-teal-100 text-teal-700' },
    { id: 'writing', label: 'Writing', color: 'bg-slate-200 text-slate-700' },
];

const STAR_MEANINGS = {
    1: "This helped",
    2: "Helped + Clear",
    3: "Solved my issue",
    4: "Solved + Taught me",
    5: "Changed how I think"
};

/* --- Data Helpers --- */

// Format relative time
function timeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

/* --- Components --- */

const Avatar = ({ username, size = 'md' }) => {
    const s = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-6 h-6' : 'w-10 h-10';
    return (
        <img 
            src={`https://images.websim.com/avatar/${username}`} 
            className={`${s} rounded-full bg-slate-200 object-cover border border-white shadow-sm`}
            alt={username}
        />
    );
};

const StarBadge = ({ count, className = "" }) => (
    <div className={`flex items-center gap-1 font-bold ${className}`}>
        <i className="ri-star-fill text-yellow-400"></i>
        <span>{count.toLocaleString()}</span>
    </div>
);

// The Core Star Giving Interaction
const StarGiver = ({ onGive, maxStars = 5, budget }) => {
    const [selected, setSelected] = useState(0);

    return (
        <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-100">
            <h3 className="text-center font-bold text-slate-800 mb-4">Value Delivered?</h3>
            
            <div className="flex justify-between mb-6 px-2">
                {[1, 2, 3, 4, 5].map(num => (
                    <button
                        key={num}
                        onClick={() => setSelected(num)}
                        className={`
                            w-10 h-14 rounded-full flex flex-col items-center justify-center transition-all duration-200
                            ${selected >= num ? 'scale-110' : 'scale-100 opacity-40 grayscale'}
                        `}
                    >
                        <i className={`ri-star-fill text-2xl ${selected >= num ? 'text-yellow-400' : 'text-slate-300'}`}></i>
                        <span className="text-xs font-bold text-slate-400 mt-1">{num}</span>
                    </button>
                ))}
            </div>

            <div className="h-12 flex items-center justify-center text-center mb-4 transition-all">
                {selected > 0 ? (
                    <span className="text-sm font-medium text-slate-700 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                        "{STAR_MEANINGS[selected]}"
                    </span>
                ) : (
                    <span className="text-sm text-slate-400 italic">Select star amount</span>
                )}
            </div>

            <button
                disabled={selected === 0 || budget < selected}
                onClick={() => onGive(selected)}
                className={`
                    w-full py-3 rounded-lg font-bold text-white transition-all
                    ${selected > 0 && budget >= selected 
                        ? 'bg-slate-900 shadow-md active:scale-95' 
                        : 'bg-slate-200 cursor-not-allowed'}
                `}
            >
                {budget < selected ? `Not enough budget (${budget})` : selected > 0 ? `Give ${selected} Stars` : 'Select Stars'}
            </button>
        </div>
    );
};

// Profile / Reputation Card
const ProfileCard = ({ user, stats }) => {
    // Determine top domains
    const topDomains = Object.entries(stats.byDomain || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-slate-50 to-slate-100 -z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <Avatar username={user.username} size="lg" />
                <h2 className="mt-3 font-bold text-xl text-slate-900">@{user.username}</h2>
                
                <div className="mt-4 flex flex-col items-center">
                    <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Total Contribution</span>
                    <div className="text-4xl font-black text-slate-800 flex items-center gap-2">
                        <i className="ri-star-fill text-yellow-400 animate-pulse"></i>
                        {stats.total.toLocaleString()}
                    </div>
                </div>

                {topDomains.length > 0 && (
                    <div className="mt-6 w-full">
                        <div className="text-xs font-semibold text-slate-400 mb-2 border-b border-slate-100 pb-2">TRUSTED IN</div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {topDomains.map(([domainId, count]) => {
                                const domain = DOMAINS.find(d => d.id === domainId) || { label: domainId, color: 'bg-gray-100' };
                                return (
                                    <span key={domainId} className={`text-xs px-2 py-1 rounded-md font-medium ${domain.color}`}>
                                        {domain.label} <span className="opacity-60">· {count}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PostItem = ({ post, onOpen, userMap, repliesCount }) => {
    const author = userMap[post.author_id] || { username: 'Unknown' };
    const domain = DOMAINS.find(d => d.id === post.domain) || DOMAINS[0];

    return (
        <div 
            onClick={onOpen}
            className="bg-white p-4 mb-3 rounded-xl card-shadow border border-slate-50 active:scale-[0.99] transition-transform cursor-pointer"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Avatar username={author.username} size="sm" />
                    <span className="text-sm font-semibold text-slate-700">@{author.username}</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${domain.color}`}>
                    {domain.label}
                </span>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 leading-snug mb-1">{post.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-2">{post.content}</p>
            
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{timeAgo(post.created_at)}</span>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <i className="ri-chat-1-line"></i> {repliesCount || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};

const CreatePostModal = ({ onClose }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [domain, setDomain] = useState(DOMAINS[0].id);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSubmitting(true);
        try {
            await room.collection('post').create({
                title,
                content,
                domain,
            });
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col p-4 animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Ask for Help</h2>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full"><i className="ri-close-line"></i></button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Domain</label>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {DOMAINS.map(d => (
                                <button 
                                    key={d.id}
                                    onClick={() => setDomain(d.id)}
                                    className={`
                                        whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                        ${domain === d.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}
                                    `}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                        <input 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Briefly describe your challenge..." 
                            className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-slate-900 outline-none font-bold text-slate-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Details</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Provide context, code snippets, or specifics..." 
                            className="w-full h-40 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-slate-900 outline-none resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !title.trim()}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold active:scale-95 transition-transform"
                    >
                        {isSubmitting ? 'Posting...' : 'Post Request'}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Positive contributions only. No ratings.
                    </p>
                </div>
            </div>
        </div>
    );
};

/* --- Main App Container --- */

const App = () => {
    const [view, setView] = useState('feed'); // feed, profile
    const [currentUser, setCurrentUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [stars, setStars] = useState([]); // All star transactions
    const [replies, setReplies] = useState([]); // All replies
    
    // UI State
    const [activePost, setActivePost] = useState(null);
    const [isPosting, setIsPosting] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [givingStarsTo, setGivingStarsTo] = useState(null); // { replyId, userId }

    // Mock Budget Logic (Local state for MVP)
    const [dailyBudget, setDailyBudget] = useState(10); 

    // Sync Data
    useEffect(() => {
        const fetchUser = async () => {
            const u = await room.getCurrentUser();
            setCurrentUser(u);
        };
        fetchUser();

        const unsubPosts = room.collection('post').subscribe(setPosts);
        const unsubReplies = room.collection('reply').subscribe(setReplies);
        const unsubStars = room.collection('star_transaction').subscribe(setStars);

        return () => {
            unsubPosts();
            unsubReplies();
            unsubStars();
        };
    }, []);

    // Derived Data
    const userMap = useMemo(() => {
        const map = {};
        // We can't fetch all users easily in this API, so we infer from records
        // In a real app we'd have a user collection or join. 
        // For MVP, we extract author info attached to posts/replies if available, 
        // or just store what we have.
        // Actually, Websim records include 'username' automatically.
        [...posts, ...replies].forEach(item => {
            if (item.username) map[item.author_id] = { username: item.username, id: item.author_id };
        });
        if (currentUser) map[currentUser.id] = currentUser;
        return map;
    }, [posts, replies, currentUser]);

    // Calculate Stats for a user
    const getUserStats = (userId) => {
        const received = stars.filter(s => s.to_user_id === userId);
        const total = received.reduce((sum, s) => sum + (s.amount || 0), 0);
        
        const byDomain = {};
        received.forEach(s => {
            if (s.domain) {
                byDomain[s.domain] = (byDomain[s.domain] || 0) + s.amount;
            }
        });

        return { total, byDomain };
    };

    const handleGiveStars = async (amount) => {
        if (!givingStarsTo || !currentUser) return;
        
        try {
            // Optimistic Update
            setDailyBudget(prev => prev - amount);

            await room.collection('star_transaction').create({
                from_user_id: currentUser.id,
                to_user_id: givingStarsTo.userId,
                post_id: activePost.id,
                reply_id: givingStarsTo.replyId,
                amount: amount,
                domain: activePost.domain, 
                message: STAR_MEANINGS[amount]
            });

            setGivingStarsTo(null);
        } catch (e) {
            console.error("Star error", e);
            setDailyBudget(prev => prev + amount); // Rollback
        }
    };

    const handleReply = async () => {
        if (!replyText.trim() || !activePost) return;
        try {
            await room.collection('reply').create({
                post_id: activePost.id,
                content: replyText,
                parent_id: activePost.id
            });
            setReplyText("");
        } catch (e) {
            console.error(e);
        }
    };

    // Filter Logic
    const sortedPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const activeReplies = activePost ? replies.filter(r => r.post_id === activePost.id) : [];

    // Detailed Post View
    const renderDetail = () => {
        if (!activePost) return null;
        const author = userMap[activePost.author_id] || { username: 'Unknown' };
        const domain = DOMAINS.find(d => d.id === activePost.domain) || DOMAINS[0];
        
        return (
            <div className="fixed inset-0 bg-white z-40 flex flex-col animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                    <button onClick={() => setActivePost(null)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <i className="ri-arrow-left-line text-xl"></i>
                    </button>
                    <span className="font-bold text-slate-800">Discussion</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 pb-24">
                    {/* OP */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Avatar username={author.username} />
                            <div>
                                <div className="text-sm font-bold">@{author.username}</div>
                                <div className="text-xs text-slate-400">{timeAgo(activePost.created_at)}</div>
                            </div>
                        </div>
                        <h1 className="text-xl font-black text-slate-900 mb-2">{activePost.title}</h1>
                        <div className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded mb-4 ${domain.color}`}>
                            {domain.label}
                        </div>
                        <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {activePost.content}
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-6"></div>

                    {/* Replies */}
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">
                        Contributions ({activeReplies.length})
                    </h3>

                    <div className="space-y-6">
                        {activeReplies.map(reply => {
                            const rAuthor = userMap[reply.author_id] || { username: 'Unknown' };
                            const rStats = getUserStats(reply.author_id);
                            
                            // Check if I gave stars to this reply already
                            const myStarsToReply = stars.find(s => 
                                s.from_user_id === currentUser?.id && 
                                s.reply_id === reply.id
                            );
                            
                            // Total stars this reply received
                            const replyStars = stars
                                .filter(s => s.reply_id === reply.id)
                                .reduce((sum, s) => sum + s.amount, 0);

                            const isOP = currentUser?.id === activePost.author_id;
                            const isMe = currentUser?.id === reply.author_id;

                            return (
                                <div key={reply.id} className="flex gap-3">
                                    <div className="flex flex-col items-center gap-1">
                                        <Avatar username={rAuthor.username} size="sm" />
                                        {replyStars > 0 && (
                                            <div className="flex flex-col items-center mt-1">
                                                <i className="ri-star-fill text-yellow-400 text-xs"></i>
                                                <span className="text-[10px] font-bold text-slate-600">{replyStars}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div className="text-sm font-bold text-slate-800">@{rAuthor.username}</div>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                <span><i className="ri-star-line"></i> {rStats.total} total</span>
                                                <span>• {timeAgo(reply.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-lg rounded-tl-none mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                                            {reply.content}
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="mt-2 flex items-center justify-between">
                                            {myStarsToReply ? (
                                                <div className="text-xs font-bold text-yellow-600 flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                                                    <i className="ri-star-fill"></i> You gave {myStarsToReply.amount} stars
                                                </div>
                                            ) : isOP && !isMe ? (
                                                <button 
                                                    onClick={() => setGivingStarsTo({ replyId: reply.id, userId: reply.author_id })}
                                                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-all"
                                                >
                                                    <i className="ri-gift-line"></i> Give Stars
                                                </button>
                                            ) : (
                                                <div></div> 
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {activeReplies.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                No contributions yet. Be the first to help!
                            </div>
                        )}
                    </div>
                </div>

                {/* Reply Input */}
                <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-end">
                    <textarea 
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Contribute help..."
                        className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none h-12 max-h-32"
                    ></textarea>
                    <button 
                        onClick={handleReply}
                        disabled={!replyText.trim()}
                        className="bg-slate-900 text-white w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 active:scale-95 transition-transform"
                    >
                        <i className="ri-send-plane-fill"></i>
                    </button>
                </div>

                {/* Star Modal Overlay */}
                {givingStarsTo && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <div className="w-full max-w-sm relative">
                            <button 
                                onClick={() => setGivingStarsTo(null)}
                                className="absolute -top-12 right-0 text-white/80 p-2"
                            >
                                Cancel
                            </button>
                            <StarGiver 
                                budget={dailyBudget} 
                                onGive={handleGiveStars} 
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (!currentUser) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

    const myStats = getUserStats(currentUser.id);

    return (
        <div className="max-w-md mx-auto h-screen flex flex-col bg-slate-50 relative overflow-hidden shadow-2xl">
            {/* Top Bar */}
            <div className="px-5 pt-12 pb-4 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <i className="ri-shining-fill text-yellow-400"></i>
                    </div>
                    <span className="font-bold text-lg tracking-tight">No Stars Given</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Budget</span>
                        <div className="flex items-center gap-1 text-slate-900 font-bold">
                            <i className="ri-copper-coin-line text-yellow-500"></i>
                            {dailyBudget}
                        </div>
                    </div>
                    <Avatar username={currentUser.username} />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative p-4 pb-24">
                {view === 'feed' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                         {/* Intro Concept Card (Dismissible in real app) */}
                        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg relative overflow-hidden mb-6">
                            <i className="ri-star-line absolute -right-4 -bottom-4 text-9xl opacity-10"></i>
                            <h2 className="font-bold text-lg mb-1">Feedback without fear.</h2>
                            <p className="text-slate-300 text-xs leading-relaxed max-w-[90%]">
                                Stars are accumulative. 0 stars is not an action. Only positive help is recorded.
                            </p>
                        </div>

                        {sortedPosts.map(post => (
                            <PostItem 
                                key={post.id} 
                                post={post} 
                                userMap={userMap}
                                repliesCount={replies.filter(r => r.post_id === post.id).length}
                                onOpen={() => setActivePost(post)} 
                            />
                        ))}
                        
                        {sortedPosts.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <i className="ri-windy-line text-4xl mb-2 block"></i>
                                <p>No requests yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {view === 'profile' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <ProfileCard user={currentUser} stats={myStats} />
                        
                        <div className="mt-8">
                            <h3 className="font-bold text-slate-800 mb-4 px-2">History</h3>
                            {stars.filter(s => s.to_user_id === currentUser.id).length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-8">No stars received yet. Go help someone!</p>
                            ) : (
                                <div className="space-y-3">
                                    {stars
                                        .filter(s => s.to_user_id === currentUser.id)
                                        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                                        .map(s => (
                                            <div key={s.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-yellow-50 w-10 h-10 rounded-full flex items-center justify-center text-yellow-500 font-bold">
                                                        +{s.amount}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-800">{s.message || "Helpful"}</div>
                                                        <div className="text-[10px] text-slate-400">From a user • {timeAgo(s.created_at)}</div>
                                                    </div>
                                                </div>
                                                <div className={`text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500`}>
                                                     {(DOMAINS.find(d => d.id === s.domain) || {}).label || 'Gen'}
                                                </div>
                                            </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 bottom-nav px-6 py-3 flex justify-between items-center z-20">
                <button 
                    onClick={() => setView('feed')}
                    className={`flex flex-col items-center gap-1 ${view === 'feed' ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <i className={`text-2xl ${view === 'feed' ? 'ri-home-fill' : 'ri-home-line'}`}></i>
                </button>

                <button 
                    onClick={() => setIsPosting(true)}
                    className="w-14 h-14 bg-slate-900 rounded-full shadow-lg shadow-slate-900/20 text-white flex items-center justify-center -mt-8 border-4 border-slate-50 active:scale-95 transition-transform"
                >
                    <i className="ri-add-line text-2xl"></i>
                </button>

                <button 
                    onClick={() => setView('profile')}
                    className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-slate-900' : 'text-slate-400'}`}
                >
                    <i className={`text-2xl ${view === 'profile' ? 'ri-user-fill' : 'ri-user-line'}`}></i>
                </button>
            </div>

            {/* Modals */}
            {activePost && renderDetail()}
            {isPosting && <CreatePostModal onClose={() => setIsPosting(false)} />}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);