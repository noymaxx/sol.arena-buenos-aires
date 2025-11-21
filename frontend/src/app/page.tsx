"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 opacity-20">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-purple-600/10" />
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-px h-full bg-gradient-to-b from-transparent via-emerald-400/30 to-transparent"
          style={{ left: `${(i + 1) * 5}%` }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scaleY: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute h-px w-full bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"
          style={{ top: `${(i + 1) * 7}%` }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scaleX: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 4 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const DuelCard = () => {
  return (
    <motion.div
      className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-emerald-500/30 rounded-lg p-4 max-w-sm"
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-emerald-400">LIVE DUEL</span>
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-300">Hugo</div>
          <div className="text-xs text-gray-500">VS</div>
          <div className="text-sm text-gray-300">Alice</div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>CROWD BET</span>
            <span>2.4 SOL</span>
          </div>

          <div className="relative">
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-emerald-400 to-purple-500 h-full rounded-full"
                initial={{ width: "45%" }}
                animate={{ width: ["45%", "60%", "45%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>45%</span>
              <span>55%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function LandingPage() {
  const router = useRouter();

  const handleEnterArena = () => {
    router.push("/app");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Animated Grid Background */}
      <AnimatedGrid />

      {/* Main Content - Split Layout */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh]">

            {/* Left Column - Copy + Animation */}
            <div className="relative">
              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  transform: 'rotate(-1deg)',
                  transformOrigin: 'left center'
                }}
                initial={{ opacity: 0, x: -50, rotate: -3 }}
                animate={{ opacity: 1, x: 0, rotate: -1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                Two wallets.<br />
                One duel.<br />
                <span className="text-emerald-400">A crowd behind it.</span>
              </motion.h1>

              <motion.p
                className="text-lg text-gray-300 mb-8 max-w-lg leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                On-chain 1v1 bets where the main players earn a spread from everyone watching and betting on them.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <div className="bg-emerald-500/20 text-emerald-300 px-4 py-2 rounded-lg text-sm font-medium border border-emerald-500/30">
                  1v1 duels on Solana
                </div>
                <div className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg text-sm font-medium border border-purple-500/30">
                  Crowd prediction pools
                </div>
                <div className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-lg text-sm font-medium border border-blue-500/30">
                  Spread for players & arbiters
                </div>
              </motion.div>
            </div>

            {/* Right Column - CTA + Demo */}
            <div className="flex flex-col items-center lg:items-end space-y-8">

              {/* Main CTA Button */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <motion.button
                  onClick={handleEnterArena}
                  className="group relative bg-gradient-to-r from-emerald-500 to-purple-600 text-white px-8 py-6 rounded-xl text-lg font-bold tracking-wide transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30 border border-emerald-400/50"
                  whileHover={{
                    rotateX: 5,
                    rotateY: -5,
                    scale: 1.05,
                  }}
                  whileTap={{ scale: 0.95 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <span className="relative z-10 text-xl">
                    Launch sol.arena
                  </span>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-50"
                    animate={{
                      opacity: [0, 0.3, 0],
                      scale: [0.8, 1.1, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.button>

                <motion.p
                  className="text-sm text-gray-400 mt-3 text-center max-w-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  Connect your wallet, pick a side and feel the crowd.
                </motion.p>
              </motion.div>

              {/* Demo Duel Card */}
              <DuelCard />

              {/* On Solana Badge */}
              <motion.div
                className="flex items-center space-x-2 text-sm text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <span>Powered by</span>
                <div className="font-bold text-emerald-400">SOLANA</div>
              </motion.div>
            </div>

        </div>
        <div className="flex justify-end mt-10">
          <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-mono border border-emerald-500/30">
            LIVE ON DEVNET · SOLANA · sol.arena
          </div>
        </div>
      </div>
    </div>

      {/* Footer */}
      <footer className="relative z-10 px-6 pb-6 text-sm text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
            <span className="text-white/70">
              © 2025 sol.arena · Built at Solana Hacker Hotel · DevCon Buenos Aires
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
