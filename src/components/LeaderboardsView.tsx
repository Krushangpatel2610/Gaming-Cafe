import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Trophy, 
  Plus, 
  Search, 
  Award, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  Gamepad2,
  Trash2
} from "lucide-react";
import { LeaderboardEntry, Customer, Game } from "../types";

interface LeaderboardsViewProps {
  leaderboard: LeaderboardEntry[];
  customers: Customer[];
  games: Game[];
  onSubmitScore: (entry: Omit<LeaderboardEntry, "id" | "rank" | "date">) => void;
}

export default function LeaderboardsView({ leaderboard, customers, games, onSubmitScore }: LeaderboardsViewProps) {
  const [textSearch, setTextSearch] = useState<string>("");
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);

  // Form states for high score submission
  const [playerName, setPlayerName] = useState<string>("");
  const [gameTitle, setGameTitle] = useState<string>("");
  const [statName, setStatName] = useState<string>("K/D Ratio");
  const [statValue, setStatValue] = useState<string>("");
  const [reward, setReward] = useState<string>("");

  const filteredLeaderboard = leaderboard.filter(item => {
    return item.playerName.toLowerCase().includes(textSearch.toLowerCase()) ||
           item.gameTitle.toLowerCase().includes(textSearch.toLowerCase());
  });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 border-amber-500 shadow-md shadow-amber-500/10";
      case 2:
        return "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-800 border-slate-400";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-700 text-amber-50 border-amber-800";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitScore({
      playerName: playerName || "Anonymous Gamer",
      gameTitle: gameTitle || "Valorant",
      statName,
      statValue,
      reward: reward || "Lounge keychain"
    });

    // Reset
    setShowScoreModal(false);
    setPlayerName("");
    setGameTitle("");
    setStatName("K/D Ratio");
    setStatValue("");
    setReward("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-precision">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-display">Esports Leaderboard & High Scores</h2>
          <p className="text-xs text-slate-400 mt-1">
            Publish weekly high scores, run custom gaming competitions, and reward elite community members.
          </p>
        </div>
        <button
          onClick={() => setShowScoreModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-lg transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Score</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search leaderboard players, game titles..."
          value={textSearch}
          onChange={(e) => setTextSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
        />
      </div>

      {/* Main Leaderboard Rankings list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Main table list of top players */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-precision overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Weekly Competitive Rosters</h3>
              <p className="text-xs text-slate-400">Verified and audited logs of champion submissions.</p>
            </div>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold font-mono uppercase tracking-wider text-[10px] bg-slate-50/30">
                  <th className="p-4 text-center w-16">Rank</th>
                  <th className="p-4">Player Name</th>
                  <th className="p-4">Game Title</th>
                  <th className="p-4 text-right">High Score Record</th>
                  <th className="p-4 text-right">Award Claimed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No high score records matched the search query.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-center">
                        <span className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-xs font-bold border ${getRankBadge(item.rank)}`}>
                          {item.rank}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{item.playerName}</td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-700 block">{item.gameTitle}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Date: {item.date}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="font-mono font-bold text-indigo-600 text-xs">{item.statValue}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.statName}</div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="inline-flex items-center space-x-1 bg-yellow-50 text-amber-800 border border-yellow-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                          <Award className="w-3 h-3 text-amber-500" />
                          <span>{item.reward}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Top Rewards & Trophy Guidelines */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl border border-slate-700/30 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Prize Pools</span>
              </div>
              <h3 className="text-base font-bold font-display">Lounge Esports Champion Pool</h3>
              <p className="text-xs text-slate-300">We reward active players who register top stats. Each week, rank 1, 2, and 3 entries can claim top up vouchers or energy drinks.</p>
              
              <div className="border-t border-slate-800 pt-4 space-y-3 font-sans">
                {[
                  { rank: "1st Place", prize: "10 Free VIP Zone Gaming Hours + Trophy Badge" },
                  { rank: "2nd Place", prize: "$20 immediate Lounge Credit match voucher" },
                  { rank: "3rd Place", prize: "Free Energy Drinks / Premium Peripherals check" }
                ].map((pr, i) => (
                  <div key={i} className="flex justify-between items-baseline gap-4 text-xs">
                    <span className="text-amber-400 font-bold shrink-0">{pr.rank}:</span>
                    <span className="text-slate-200 text-right">{pr.prize}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: Submit High Score */}
      {showScoreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900 font-display">Record Competitor High Score</h3>
              <p className="text-xs text-slate-400 mt-1">Audit and submit scores onto the weekly public leaderboards.</p>
            </div>
            
            <form onSubmit={handleScoreSubmit} className="p-6 space-y-4">
              
              {/* Selector for players */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Player Account</label>
                <select
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 cursor-pointer transition-all"
                >
                  <option value="">-- Choose Member --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.membershipLevel})</option>
                  ))}
                  <option value="Unregistered Guest">Guest Player</option>
                </select>
              </div>

              {/* Selector for games */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Select Gaming Title</label>
                <select
                  required
                  value={gameTitle}
                  onChange={(e) => setGameTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 cursor-pointer transition-all"
                >
                  <option value="">-- Choose Game --</option>
                  {games.map(g => (
                    <option key={g.id} value={g.title}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Metric name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Metric (e.g. K/D Ratio)</label>
                  <input
                    type="text"
                    required
                    value={statName}
                    onChange={(e) => setStatName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  />
                </div>
                {/* Score value */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Score Value</label>
                  <input
                    type="text"
                    required
                    value={statValue}
                    onChange={(e) => setStatValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                    placeholder="e.g. 1.95 (Avg)"
                  />
                </div>
              </div>

              {/* Reward won */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Assigned Weekly Reward</label>
                <input
                  type="text"
                  required
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 transition-all"
                  placeholder="e.g. 10 Free VIP Hours"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScoreModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-lg"
                >
                  Submit Score
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
