const { useState, useEffect, useMemo, useRef } = React;

const room = new WebsimSocket();

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

    // Mock Budget Logic (Local state for MVP)
    const [dailyBudget, setDailyBudget] = useState(10); 

    // Sync Data
    useEffect(() => {
        const fetchUser = async () => {
            const u = await window.websim.getCurrentUser();
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
        [...posts, ...replies].forEach(item => {
            if (item.username) map[item.author_id] = { username: item.username, id: item.author_id };
        });
        if (currentUser) map[currentUser.id] = currentUser;
        return map;
    }, [posts, replies, currentUser]);

    const handleGiveStars = async (amount, replyId, toUserId) => {
        if (!currentUser) return;
        
        try {
            // Optimistic Update
            setDailyBudget(prev => prev - amount);

            await room.collection('star_transaction').create({
                from_user_id: currentUser.id,
                to_user_id: toUserId,
                post_id: activePost.id,
                reply_id: replyId,
                amount: amount,
                domain: activePost.domain, 
                message: window.STAR_MEANINGS[amount]
            });

        } catch (e) {
            console.error("Star error", e);
            setDailyBudget(prev => prev + amount); // Rollback
        }
    };

    const handleReply = async (text) => {
        if (!activePost) return;
        try {
            await room.collection('reply').create({
                post_id: activePost.id,
                content: text,
                parent_id: activePost.id
            });
        } catch (e) {
            console.error(e);
        }
    };

    // Filter Logic
    const sortedPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const activeReplies = activePost ? replies.filter(r => r.post_id === activePost.id) : [];

    if (!currentUser) return <div className="flex items-center justify-center h-screen text-slate-400">Loading...</div>;

    const myStats = window.calculateUserStats(stars, currentUser.id);

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
                    <window.Avatar username={currentUser.username} />
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
                            <window.PostItem 
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
                        <window.ProfileCard user={currentUser} stats={myStats} />
                        
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
                                                        <div className="text-[10px] text-slate-400">From a user • {window.timeAgo(s.created_at)}</div>
                                                    </div>
                                                </div>
                                                <div className={`text-[10px] px-2 py-1 rounded bg-slate-100 text-slate-500`}>
                                                     {(window.DOMAINS.find(d => d.id === s.domain) || {}).label || 'Gen'}
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
            {activePost && (
                <window.PostDetail 
                    post={activePost}
                    currentUser={currentUser}
                    userMap={userMap}
                    replies={activeReplies}
                    allStars={stars}
                    dailyBudget={dailyBudget}
                    onClose={() => setActivePost(null)}
                    onReply={handleReply}
                    onGiveStars={handleGiveStars}
                />
            )}
            {isPosting && <window.CreatePostModal onClose={() => setIsPosting(false)} room={room} />}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);