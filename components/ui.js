const { useState } = React;

window.Avatar = ({ username, size = 'md' }) => {
    const s = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-6 h-6' : 'w-10 h-10';
    return (
        <img 
            src={`https://images.websim.com/avatar/${username}`} 
            className={`${s} rounded-full bg-slate-200 object-cover border border-white shadow-sm`}
            alt={username}
        />
    );
};

window.StarBadge = ({ count, className = "" }) => (
    <div className={`flex items-center gap-1 font-bold ${className}`}>
        <i className="ri-star-fill text-yellow-400"></i>
        <span>{count.toLocaleString()}</span>
    </div>
);

// The Core Star Giving Interaction
window.StarGiver = ({ onGive, maxStars = 5, budget }) => {
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
                        "{window.STAR_MEANINGS[selected]}"
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