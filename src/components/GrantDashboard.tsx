import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart, 
  Pie, 
  Sector,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { type Call } from '../data/rules';
import { TrendingUp, PieChart as PieIcon, BarChart2, Info, Calendar, Target, ChevronDown, ChevronUp, FileText, Clock, Wallet, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

interface Props {
  calls: Call[];
}

const COLORS = ['#001D3D', '#003566', '#FFC300', '#64748B', '#94A3B8', '#CBD5E1'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-sans font-black text-lg">
        {payload.title.split(' ')[0]}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#374151" className="text-xs font-bold">{`${value} mil. Kč`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#9CA3AF" className="text-[10px]">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

export const GrantDashboard: React.FC<Props> = ({ calls }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

  const totalAllocation = useMemo(() => {
    return calls.reduce((sum, call) => sum + call.numericAllocation, 0);
  }, [calls]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const selectedCall = calls[activeIndex];

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-[32px] border border-nat-border shadow-sm flex items-center gap-4 md:gap-6"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-nat-primary shrink-0">
            <TrendingUp className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <span className="block text-[8px] md:text-[10px] font-black uppercase text-nat-accent opacity-50 tracking-widest mb-1">Celková alokace</span>
            <span className="text-xl md:text-3xl font-sans font-black text-nat-text">{(totalAllocation / 1000).toFixed(1)} mld. Kč</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 md:p-8 rounded-[32px] border border-nat-border shadow-sm flex items-center gap-4 md:gap-6"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-nat-secondary shrink-0">
            <Target className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <span className="block text-[8px] md:text-[10px] font-black uppercase text-nat-accent opacity-50 tracking-widest mb-1">Počet výzev</span>
            <span className="text-xl md:text-3xl font-sans font-black text-nat-text">{calls.length} aktivních</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-nat-dark p-6 md:p-8 rounded-[32px] text-white flex items-center gap-4 md:gap-6 sm:col-span-2 lg:col-span-1"
        >
          <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-2xl flex items-center justify-center text-nat-primary shrink-0">
            <Calendar className="w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">Nejbližší uzávěrka</span>
            <span className="text-xl md:text-3xl font-sans font-black text-white">30. 06. 2026</span>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Main Chart Card */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[44px] border border-nat-border shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-primary flex items-center gap-3">
              <BarChart2 className="w-5 h-5" />
              Srovnání alokací dle výzev
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-nat-accent bg-nat-bg px-3 py-1 rounded-full border border-nat-border">
                <div className="w-1.5 h-1.5 rounded-full bg-nat-primary" /> Otevřená
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-nat-accent bg-nat-bg px-3 py-1 rounded-full border border-nat-border">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Plánovaná
              </span>
            </div>
          </div>

          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={calls} 
                layout="vertical" 
                margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                onMouseMove={(state) => {
                  if (state.activeTooltipIndex !== undefined) {
                    setActiveIndex(state.activeTooltipIndex);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F3F4F6" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="number" 
                  type="category" 
                  stroke="#9CA3AF" 
                  fontSize={10} 
                  fontWeight="black"
                  tickFormatter={(val) => `#${val}`}
                  width={40}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB', radius: 12 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as Call;
                      return (
                        <div className="bg-nat-dark p-5 rounded-2xl shadow-2xl border border-white/10 text-white min-w-[280px] backdrop-blur-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-nat-primary mb-2">
                            Výzva {data.number} • {data.status}
                          </p>
                          <p className="text-base font-sans font-black mb-4 leading-tight">{data.title}</p>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                            <div>
                              <span className="block text-[8px] text-white/40 uppercase font-black mb-1">Alokace</span>
                              <span className="text-sm font-black text-nat-secondary">{data.allocation}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-white/40 uppercase font-black mb-1">Platnost do</span>
                              <span className="text-sm font-black text-slate-300">{data.closes}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="numericAllocation" 
                  radius={[0, 16, 16, 0]} 
                  barSize={40}
                >
                  {calls.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === activeIndex ? '#FFC300' : entry.status === 'Plánovaná' ? '#E5E7EB' : '#003566'} 
                      className="transition-all duration-300"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Card */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-nat-dark p-10 rounded-[44px] shadow-xl text-white flex-1 flex flex-col items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-primary mb-8 self-start flex items-center gap-3">
              <PieIcon className="w-5 h-5 text-nat-primary" />
              Podíl na rozpočtu
            </h3>
            
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={calls}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    fill="#8884d8"
                    dataKey="numericAllocation"
                    onMouseEnter={onPieEnter}
                    stroke="none"
                  >
                    {calls.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={entry.status === 'Plánovaná' ? 0.4 : 1} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full mt-auto pt-8 border-t border-white/5 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: COLORS[activeIndex % COLORS.length] }} />
                    <div>
                      <span className="block text-[9px] font-black uppercase text-white/30 tracking-widest">Detail vybrané výzvy</span>
                      <p className="text-sm font-bold leading-tight">{selectedCall?.title}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="block text-[8px] font-black text-white/40 uppercase mb-1">Podíl</span>
                      <span className="text-lg font-black">{((selectedCall?.numericAllocation / totalAllocation) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="block text-[8px] font-black text-white/40 uppercase mb-1">Status</span>
                      <span className={`text-xs font-black uppercase tracking-widest ${selectedCall?.status === 'Otevřená' ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {selectedCall?.status}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="bg-nat-bg p-8 rounded-[38px] border border-nat-border flex flex-col justify-center gap-4 relative overflow-hidden group">
            <Info className="absolute -right-4 -top-4 w-24 h-24 text-nat-primary opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
            <span className="text-nat-primary font-black text-[9px] uppercase tracking-widest">Metodická poznámka</span>
            <p className="text-[11px] text-nat-accent font-medium leading-relaxed italic border-l-2 border-nat-primary/20 pl-4 py-1">
              Data o alokacích jsou čerpána z oficiálních věstníků SFŽP a jsou aktualizována v reálném čase přes API endpoint NKOD.
            </p>
          </div>
        </div>
      </div>

      {/* Detailed View Section */}
      <div className="space-y-6 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-nat-primary mb-1">Detailní přehled dotačních příležitostí</h3>
            <p className="text-[10px] text-nat-accent font-medium italic opacity-60">Klikněte na výzvu pro zobrazení podrobných informací a popisu</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-nat-accent">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Otevřené ({(calls.filter(c => c.status === 'Otevřená').length)})
          </div>
        </div>

        <div className="space-y-4">
          {calls.map((call, idx) => (
            <CallDetailItem 
              key={call.id}
              call={call} 
              index={idx}
              isExpanded={expandedCallId === call.id}
              onToggle={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CallDetailItemProps {
  call: Call;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

const CallDetailItem: React.FC<CallDetailItemProps> = ({ call, isExpanded, onToggle, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-[32px] border transition-all duration-500 overflow-hidden ${
        isExpanded ? 'border-nat-primary ring-4 ring-nat-primary/5 shadow-xl' : 'border-nat-border hover:border-nat-primary/40 shadow-sm'
      }`}
    >
      <button 
        onClick={onToggle}
        className="w-full text-left p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4 md:gap-6">
          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
            isExpanded ? 'bg-nat-primary text-white' : 'bg-nat-bg text-nat-accent group-hover:bg-nat-primary/10 group-hover:text-nat-primary'
          }`}>
            <FileText className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-1">
              <span className="px-2 py-0.5 bg-nat-bg border border-nat-border rounded text-[7px] md:text-[8px] font-black uppercase text-nat-primary">{call.providerId}</span>
              <span className="text-[8px] md:text-[10px] font-black uppercase text-nat-primary tracking-widest">Výzva {call.number}</span>
              <span className={`px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest ${
                call.status === 'Otevřená' ? 'bg-nat-secondary text-nat-dark' : 'bg-gray-100 text-gray-600'
              }`}>
                {call.status}
              </span>
            </div>
            <h4 className="text-sm md:text-lg font-sans font-black text-nat-text leading-tight">{call.title}</h4>
          </div>
        </div>
        <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8 border-t border-dashed border-nat-border pt-4 md:pt-0 md:border-0">
          <div className="text-left md:text-right">
            <span className="block text-[7px] md:text-[8px] font-black uppercase text-nat-accent opacity-40 mb-1">Alokace</span>
            <span className="text-xs md:text-sm font-black text-nat-text">{call.allocation}</span>
          </div>
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border border-nat-border group-hover:border-nat-primary/30 transition-colors ${
            isExpanded ? 'bg-nat-primary/10 border-nat-primary/20 text-nat-primary rotate-180' : 'text-nat-accent'
          }`}>
            <ChevronDown className="w-4 h-4 md:w-5 md:h-5 transition-transform duration-500" />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="border-t border-nat-border bg-nat-bg/30"
          >
            <div className="p-6 md:p-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-10">
                <div className="lg:col-span-3 space-y-6">
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-nat-accent opacity-40 mb-3">O výzvě</h5>
                    <p className="text-xs md:text-sm leading-relaxed font-medium text-nat-accent/80">
                      {call.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-nat-border flex items-center justify-center text-primary shadow-sm">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase text-nat-accent opacity-40">Otevření</span>
                        <span className="text-xs font-bold">{call.opens}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-nat-border flex items-center justify-center text-nat-secondary shadow-sm">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase text-nat-accent opacity-40">Uzávěrka</span>
                        <span className="text-xs font-bold">{call.closes}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-nat-border flex items-center justify-center text-nat-primary shadow-sm">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[8px] font-black uppercase text-nat-accent opacity-40">Objem</span>
                        <span className="text-xs font-bold">{call.allocation}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-nat-border flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck className="w-4 h-4 text-nat-secondary" />
                       <span className="text-[9px] font-black uppercase text-nat-accent tracking-widest">Shoda s metodikou</span>
                    </div>
                    <div className="w-full h-2 bg-nat-bg rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: '85%' }}
                         className="h-full bg-nat-secondary" 
                       />
                    </div>
                    <p className="text-[10px] font-bold text-nat-accent/60 leading-relaxed">
                      Váš projektový profil vykazuje vysokou míru shody s touto výzvou. Doporučujeme dokončit Audit pro finální ověření.
                    </p>
                    
                    {call.officialUrl && (
                      <a 
                        href={call.officialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-nat-bg rounded-xl border border-nat-border text-[9px] font-black uppercase tracking-widest text-nat-primary hover:bg-white hover:border-nat-secondary transition-all"
                      >
                        <ExternalLink className="w-4 h-4 text-nat-secondary" />
                        Dokumentace Výzvy
                      </a>
                    )}
                  </div>
                  <button className="w-full mt-6 py-4 rounded-xl bg-nat-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-lg shadow-nat-primary/10 flex items-center justify-center gap-2">
                    Spustit Audit Výzvy <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
