import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, TrendingUp, AlertTriangle, ArrowRight, BarChart2, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useRouter } from 'next/navigation';

interface AIProps {
    data: any;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    type: 'text' | 'chart' | 'stat' | 'pie';
    content: string;
    chartData?: any[];
    suggestions?: string[];
    timestamp: Date;
    actions?: { label: string; action: string }[];
}

export default function AIAssistant({ data }: AIProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            type: 'text',
            content: "Hi! I'm your advanced analytics assistant. I can help you analyze trends, forecast occupancy, or navigate the dashboard.",
            suggestions: ['Analyze Revenue', 'Occupancy Forecast', 'Who are the top guests?', 'Outlet Performance'],
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, isOpen]);

    const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
        setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substr(2, 9), timestamp: new Date() }]);
    };

    const handleCommand = (cmd: string) => {
        if (cmd.includes('revenue')) router.push('/revenue-statement');
        if (cmd.includes('guest')) router.push('/guest-ledger');
    };

    const generateResponse = async (query: string) => {
        setIsTyping(true);
        await new Promise(r => setTimeout(r, 800)); // Simulate thinking

        const lowerQuery = query.toLowerCase();

        // Logic for analysis
        if (lowerQuery.includes('revenue') || lowerQuery.includes('money') || lowerQuery.includes('finance') || lowerQuery.includes('compare')) {
            const today = data?.revenue?.todayRevenue || 0;
            const mtd = data?.revenue?.mtdRevenue || 0;
            const target = data?.revenue?.monthlyTarget || 1;
            const progress = ((mtd / target) * 100).toFixed(1);

            // Prepare mini-chart data
            const trendData = Array.isArray(data?.revenueTrend) ? data.revenueTrend.slice(-7).map((d: any) => ({
                name: d.date ? d.date.split('-')[2] : '?',
                value: (d.roomRevenue || 0) + (d.fnbRevenue || 0) // Ensure safe addition
            })) : [];

            addMessage({
                role: 'assistant',
                type: 'chart',
                content: `Revenue Analysis:\n\nToday's revenue is **৳${today.toLocaleString()}**. You've reached **${progress}%** of your monthly target (৳${(target / 1000000).toFixed(1)}M).`,
                chartData: trendData,
                suggestions: ['Compare vs Last Week', 'Show Room Revenue', 'Go to Revenue Report']
            });

        } else if (lowerQuery.includes('occupancy') || lowerQuery.includes('forecast')) {
            const next7Days = data?.forecast || [];
            const safeDays = next7Days.length > 0 ? next7Days : [{ date: new Date().toISOString(), occupancyPercent: 0 }];
            const avgOcc = safeDays.reduce((acc: any, curr: any) => acc + (curr.occupancyPercent || 0), 0) / (safeDays.length || 1);

            const maxOccDay = safeDays.reduce((max: any, curr: any) => (curr.occupancyPercent || 0) > (max.occupancyPercent || 0) ? curr : max, safeDays[0]);
            const maxOccDate = maxOccDay?.date ? new Date(maxOccDay.date).toLocaleDateString() : 'N/A';
            const maxOccVal = maxOccDay?.occupancyPercent || 0;

            addMessage({
                role: 'assistant',
                type: 'text',
                content: `Occupancy Forecast:\n\nThe average occupancy for the next 7 days is **${avgOcc.toFixed(1)}%**. The highest demand is on ${maxOccDate}, reaching ${maxOccVal}%.\n\nRecommendation: ${avgOcc < 50 ? 'Launch a last-minute promotion.' : 'Yield up rates for high demand dates.'}`,
                suggestions: ['Show Vacant Rooms', 'Check Arrivals']
            });

        } else if (lowerQuery.includes('problem') || lowerQuery.includes('issue') || lowerQuery.includes('alert') || lowerQuery.includes('housekeeping')) {
            const ooo = data?.stats?.outOfOrder || 0;
            const oos = data?.stats?.outOfService || 0;

            if (ooo > 0 || oos > 0) {
                addMessage({
                    role: 'assistant',
                    type: 'stat',
                    content: `Operational Alerts:\n\nYou have **${ooo} Rooms Out of Order** and **${oos} Rooms Out of Service**. This is reducing your sellable inventory by ${(ooo + oos)}.`,
                    suggestions: ['View Housekeeping Status', 'Ignore']
                });
            } else {
                addMessage({
                    role: 'assistant',
                    type: 'text',
                    content: "Operations look smooth! No Out of Order rooms reported currently.",
                    suggestions: ['Check Arrivals', 'Revenue Stats']
                });
            }

        } else if (lowerQuery.includes('vacant') || lowerQuery.includes('room') || lowerQuery.includes('available')) {
            const vacant = data?.stats?.vacant || 0;
            const inhouse = data?.stats?.inhouse || 0;
            const expectedArrival = data?.stats?.expectedArrival || 0;

            addMessage({
                role: 'assistant',
                type: 'stat',
                content: `Room Availability:\n\nYou currently have **${vacant} Vacant Clean** rooms ready for guests.\n\nSummary:\n• In-house: ${inhouse}\n• Arrivals Pending: ${expectedArrival}`,
                suggestions: ['Check Arrivals', 'Occupancy Forecast']
            });

        } else if (lowerQuery.includes('guest') || lowerQuery.includes('client') || lowerQuery.includes('corporate') || lowerQuery.includes('top')) {
            const topClients = Array.isArray(data?.topCorporates) ? data.topCorporates.slice(0, 5) : [];

            if (topClients.length > 0) {
                const clientList = topClients.map((c: any, i: number) => `${i + 1}. ${c.name} (${c.value} bookings)`).join('\n');
                addMessage({
                    role: 'assistant',
                    type: 'text',
                    content: `Top Corporate Clients:\n\n${clientList}\n\nThese clients are your most frequent bookers based on active reservations.`,
                    suggestions: ['Analyze Revenue', 'Show Room Revenue']
                });
            } else {
                addMessage({
                    role: 'assistant',
                    type: 'text',
                    content: "I don't have enough data on top corporate clients right now.",
                    suggestions: ['Analyze Revenue', 'Occupancy Forecast']
                });
            }
        } else if (lowerQuery.includes('outlet') || lowerQuery.includes('restaurant') || lowerQuery.includes('food')) {
            const outletData = Array.isArray(data?.outletData) ? data.outletData : [];
            if (outletData.length > 0) {
                const bestOutlet = outletData.reduce((prev: any, current: any) => (prev.value > current.value) ? prev : current);
                addMessage({
                    role: 'assistant',
                    type: 'chart',
                    content: `Outlet Performance:\n\nThe top performing outlet this month is **${bestOutlet.name}** with sales of ৳${(bestOutlet.value || 0).toLocaleString()}.\n\nTotal F&B Revenue: ৳${outletData.reduce((sum: number, item: any) => sum + (item.value || 0), 0).toLocaleString()}`,
                    chartData: outletData,
                    suggestions: ['Analyze Revenue', 'Check Source of Business']
                });
            } else {
                addMessage({
                    role: 'assistant',
                    type: 'text',
                    content: "No outlet data available for this month yet.",
                    suggestions: ['Analyze Revenue']
                });
            }

        } else if (lowerQuery.includes('source') || lowerQuery.includes('coming from') || lowerQuery.includes('ota')) {
            const sourceData = Array.isArray(data?.sourceData) ? data.sourceData : [];
            if (sourceData.length > 0) {
                addMessage({
                    role: 'assistant',
                    type: 'pie',
                    content: `Source of Business:\n\nMost guests are booking via **${sourceData[0]?.name}** (${sourceData[0]?.value} bookings).`,
                    chartData: sourceData,
                    suggestions: ['Analyze Revenue', 'Check Top Guests']
                });
            } else {
                addMessage({
                    role: 'assistant',
                    type: 'text',
                    content: "No source of business data available.",
                    suggestions: ['Analyze Revenue']
                });
            }

        } else if (lowerQuery.includes('go to') || lowerQuery.includes('navigate')) {
            handleCommand(lowerQuery);
            addMessage({
                role: 'assistant',
                type: 'text',
                content: "Navigating based on your request...",
                suggestions: []
            });
        } else {
            addMessage({
                role: 'assistant',
                type: 'text',
                content: "I can help with Revenue, Occupancy, Top Clients, Outlets, and more. Try asking 'Which outlet is best?' or 'Where are guests coming from?'.",
                suggestions: ['Analyze Revenue', 'Occupancy Forecast', 'Who are the top guests?', 'Outlet Performance']
            });
        }

        setIsTyping(false);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        addMessage({ role: 'user', type: 'text', content: input });
        const currentInput = input;
        setInput('');
        generateResponse(currentInput);
    };

    const handleSuggestion = (suggestion: string) => {
        addMessage({ role: 'user', type: 'text', content: suggestion });

        // Handle specific suggestion logic mapping if needed, or just treat as query
        if (suggestion === 'Go to Revenue Report') {
            router.push('/revenue-statement');
            return;
        }

        generateResponse(suggestion);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="bg-[#1e293b]/95 backdrop-blur-xl border border-white/10 w-[380px] max-h-[85vh] rounded-2xl shadow-2xl mb-4 pointer-events-auto flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-blue-600/30 to-purple-600/30 p-4 border-b border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-lg">
                                        <Sparkles size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">AI Analytics Pro</h3>
                                        <p className="text-xs text-blue-200">Online • Advanced Model</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Chat Area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>

                                        {/* Message Bubble */}
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-[#0f172a] border border-white/10 text-gray-200 rounded-bl-none'
                                            }`}>
                                            {/* Text Content */}
                                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>

                                            {/* Chart Rendering - Area/Line */}
                                            {msg.type === 'chart' && msg.chartData && (
                                                <div className="mt-4 h-[120px] w-full bg-black/20 rounded-lg p-2">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={msg.chartData}>
                                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                                                            <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px', padding: '4px' }} itemStyle={{ padding: 0 }} />
                                                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Pie Chart Rendering */}
                                            {msg.type === 'pie' && msg.chartData && (
                                                <div className="mt-4 h-[150px] w-full bg-black/20 rounded-lg p-2 flex justify-center">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <RechartsPieChart>
                                                            <Pie
                                                                data={msg.chartData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={40}
                                                                outerRadius={60}
                                                                paddingAngle={5}
                                                                dataKey="value"
                                                            >
                                                                {msg.chartData.map((entry: any, index: number) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '10px' }} />
                                                        </RechartsPieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}

                                            {/* Stat Highlights */}
                                            {msg.type === 'stat' && (
                                                <div className="mt-3 flex gap-2">
                                                    <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 flex items-center gap-2">
                                                        <Sparkles size={16} className="text-emerald-400" />
                                                        <span className="text-xs text-emerald-200">Data Updated Live</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Suggestions Chips */}
                                        {msg.suggestions && msg.suggestions.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1 max-w-[90%]">
                                                {msg.suggestions.map((s, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleSuggestion(s)}
                                                        className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 text-blue-300 px-3 py-1.5 rounded-full transition-all animate-fade-in"
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <span className="text-[10px] text-gray-500 px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-[#0f172a] border border-white/10 p-4 rounded-2xl rounded-bl-none shadow-sm">
                                            <div className="flex gap-1.5 ">
                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-white/10 bg-[#0f172a]/50 backdrop-blur-md">
                                <div className="flex gap-2 relative">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder="Ask AI about everything..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-500"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed p-3 rounded-xl text-white transition-all shadow-lg hover:shadow-blue-500/20"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`group relative p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 pointer-events-auto ${isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600 hover:rotate-12'
                        }`}
                >
                    <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20"></div>
                    {isOpen ? <X size={24} className="text-white" /> : <Bot size={24} className="text-white" />}

                    {!isOpen && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#0f172a] rounded-full"></span>
                    )}
                </button>
            </div>
        </>
    );
}
