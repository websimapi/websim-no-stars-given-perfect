window.ProfileCard = ({ user, stats }) => {
    // Determine top domains
    const topDomains = Object.entries(stats.byDomain || {})
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-slate-50 to-slate-100 -z-0"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <window.Avatar username={user.username} size="lg" />
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
                                const domain = window.DOMAINS.find(d => d.id === domainId) || { label: domainId, color: 'bg-gray-100' };
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