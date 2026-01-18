const { useState } = React;

window.PostItem = ({ post, onOpen, userMap, repliesCount }) => {
    const author = userMap[post.author_id] || { username: 'Unknown' };
    const domain = window.DOMAINS.find(d => d.id === post.domain) || window.DOMAINS[0];

    return (
        <div 
            onClick={onOpen}
            className="bg-white p-4 mb-3 rounded-xl card-shadow border border-slate-50 active:scale-[0.99] transition-transform cursor-pointer"
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <window.Avatar username={author.username} size="sm" />
                    <span className="text-sm font-semibold text-slate-700">@{author.username}</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${domain.color}`}>
                    {domain.label}
                </span>
            </div>
            
            <h3 className="font-bold text-lg text-slate-800 leading-snug mb-1">{post.title}</h3>
            <p className="text-slate-500 text-sm line-clamp-2">{post.content}</p>
            
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{window.timeAgo(post.created_at)}</span>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <i className="ri-chat-1-line"></i> {repliesCount || 0}
                    </span>
                </div>
            </div>
        </div>
    );
};

window.CreatePostModal = ({ onClose, onCreate }) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [domain, setDomain] = useState(window.DOMAINS[0].id);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) return;
        setIsSubmitting(true);
        try {
            await onCreate({
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
                            {window.DOMAINS.map(d => (
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

window.PostDetail = ({ 
    post, 
    onClose, 
    userMap, 
    replies, 
    allStars, 
    currentUser, 
    dailyBudget, 
    onReply, 
    onGiveStars 
}) => {
    const [replyText, setReplyText] = useState("");
    const [givingStarsTo, setGivingStarsTo] = useState(null); // { replyId, userId }

    const author = userMap[post.author_id] || { username: 'Unknown' };
    const domain = window.DOMAINS.find(d => d.id === post.domain) || window.DOMAINS[0];
    
    const handleReplySubmit = async () => {
        if (!replyText.trim()) return;
        await onReply(replyText);
        setReplyText("");
    };

    const handleStarSubmit = async (amount) => {
        if (!givingStarsTo) return;
        await onGiveStars(amount, givingStarsTo.replyId, givingStarsTo.userId);
        setGivingStarsTo(null);
    };

    return (
        <div className="fixed inset-0 bg-white z-40 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <button onClick={onClose} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                    <i className="ri-arrow-left-line text-xl"></i>
                </button>
                <span className="font-bold text-slate-800">Discussion</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-24">
                {/* OP */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <window.Avatar username={author.username} />
                        <div>
                            <div className="text-sm font-bold">@{author.username}</div>
                            <div className="text-xs text-slate-400">{window.timeAgo(post.created_at)}</div>
                        </div>
                    </div>
                    <h1 className="text-xl font-black text-slate-900 mb-2">{post.title}</h1>
                    <div className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded mb-4 ${domain.color}`}>
                        {domain.label}
                    </div>
                    <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-6"></div>

                {/* Replies */}
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">
                    Contributions ({replies.length})
                </h3>

                <div className="space-y-6">
                    {replies.map(reply => {
                        const rAuthor = userMap[reply.author_id] || { username: 'Unknown' };
                        const rStats = window.calculateUserStats(allStars, reply.author_id);
                        
                        // Check if I gave stars to this reply already
                        const myStarsToReply = allStars.find(s => 
                            s.from_user_id === currentUser?.id && 
                            s.reply_id === reply.id
                        );
                        
                        // Total stars this reply received
                        const replyStars = allStars
                            .filter(s => s.reply_id === reply.id)
                            .reduce((sum, s) => sum + s.amount, 0);

                        const isOP = currentUser?.id === post.author_id;
                        const isMe = currentUser?.id === reply.author_id;

                        return (
                            <div key={reply.id} className="flex gap-3">
                                <div className="flex flex-col items-center gap-1">
                                    <window.Avatar username={rAuthor.username} size="sm" />
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
                                            <span>• {window.timeAgo(reply.created_at)}</span>
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
                    {replies.length === 0 && (
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
                    onClick={handleReplySubmit}
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
                        <window.StarGiver 
                            budget={dailyBudget} 
                            onGive={handleStarSubmit} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};