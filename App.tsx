import React, { useState, useEffect, useCallback } from 'react';
import { Experience } from './components/Experience';
import { ViewMode } from './types';

const App: React.FC = () => {
  // Progress: 0 = Chaos, 1 = Formed
  const [progress, setProgress] = useState(1);
  const [showInstructions, setShowInstructions] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('default');

  // Interaction Handler for Desktop Scroll (Mouse Wheel)
  const handleScroll = useCallback((e: WheelEvent) => {
    setProgress((prev) => {
      const sensitivity = 0.0015;
      const next = prev + (e.deltaY * sensitivity);
      return Math.min(1, Math.max(0, next));
    });
    
    if (showInstructions) setShowInstructions(false);
  }, [showInstructions]);

  useEffect(() => {
    window.addEventListener('wheel', handleScroll, { passive: false });
    return () => window.removeEventListener('wheel', handleScroll);
  }, [handleScroll]);

  // Touch handlers for mobile
  const touchStart = React.useRef({ x: 0, y: 0 });
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const deltaY = touchStart.current.y - e.touches[0].clientY;
    const deltaX = touchStart.current.x - e.touches[0].clientX;
    
    // Determine dominant axis
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical movement -> Transform
        setProgress((prev) => {
          const sensitivity = 0.005;
          const next = prev + (deltaY * sensitivity);
          return Math.min(1, Math.max(0, next));
        });
        if (showInstructions) setShowInstructions(false);
    } 
    
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  return (
    <div className="w-full h-screen relative bg-black text-white font-serif overflow-hidden"
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
    >
      <Experience 
        scrollProgress={progress} 
        viewMode={viewMode}
        onStarClick={() => setViewMode('topDown')}
      />

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-8 z-10">
        
        {/* Top Header Area */}
        <div className="flex justify-end items-start pointer-events-auto h-16">
            {/* View Reset Button */}
            {viewMode === 'topDown' && (
                 <div className="animate-fade-in">
                     <button 
                        onClick={() => setViewMode('default')}
                        className="px-6 py-2 bg-[#FFD700] text-black font-bold uppercase tracking-widest hover:bg-white transition-colors rounded-sm shadow-[0_0_15px_#FFD700]"
                     >
                        Reset View
                     </button>
                 </div>
            )}
        </div>

        {/* Instructions */}
        <div className={`transition-opacity duration-1000 ${showInstructions ? 'opacity-100' : 'opacity-0'} absolute inset-0 flex items-center justify-center pointer-events-none`}>
           <div className="text-center bg-black/60 p-6 rounded-full border border-emerald-500/30 backdrop-blur-xl">
              <p className="text-[#FFD700] text-lg uppercase tracking-widest mb-2">Controls</p>
              <div className="flex flex-col items-center justify-center space-y-2 text-white/70 text-sm">
                <div>SCROLL / SWIPE VERTICAL to Transform</div>
                <div>HOLD LEFT / RIGHT to Rotate</div>
                <div>CLICK STAR for Top View</div>
              </div>
           </div>
        </div>

        {/* Bottom Footer Area */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 pointer-events-auto">
          {/* Title - Moved to Bottom Left */}
          <div className="bg-black/40 backdrop-blur-md p-4 border-l-2 border-[#FFD700] rounded-sm transition-all duration-500 text-left">
            <h1 className="text-lg md:text-2xl text-[#FFD700] tracking-widest uppercase font-bold leading-snug" style={{ textShadow: "0 0 15px #FFD700" }}>
              Merry Christmas<br />
              <span className="block mt-1 text-base md:text-xl opacity-90">Only For You</span>
            </h1>
            <p className="text-emerald-400 text-[0.6rem] md:text-xs tracking-[0.5em] mt-2 font-bold uppercase drop-shadow-md">
              2025
            </p>
          </div>

          {/* Status & Progress */}
          <div className="flex flex-col items-end gap-2">
              <div className="text-xs text-[#FFD700]/60 tracking-widest text-right">
                STATE: {progress < 0.1 ? 'CHAOS DETECTED' : progress > 0.9 ? 'COMPLETE FORM' : 'TRANSFORMING...'}
                <br />
                INTEGRITY: {Math.floor(progress * 100)}%
              </div>
              <div className="hidden md:block w-32 h-1 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                <div 
                    className="h-full bg-[#FFD700] transition-all duration-100 ease-out shadow-[0_0_10px_#FFD700]" 
                    style={{ width: `${progress * 100}%` }}
                />
              </div>
          </div>
        </div>
      </div>
      
      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,10,5,0.4)_100%)]"></div>
    </div>
  );
};

export default App;