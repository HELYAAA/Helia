import { Search } from 'lucide-react';
import type { Game } from '../shared/types';
import banner1 from "figma:asset/a57da68e27e57306115bc37b9c859a0bf238ea34.png";
import banner2 from "figma:asset/ebff7fbe5d2752717eb10a70cf7e0656757245ca.png";
import banner3 from "figma:asset/e02c4f6214239123dceca651f2d6c329e24ffbe8.png";
import { useState, useEffect } from 'react';

interface HomePageProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  banners?: string[];
}

export function HomePage({ games, onSelectGame, banners = [] }: HomePageProps) {
  const defaultBanners = [banner1, banner2, banner3];
  const displayBanners = banners.length > 0 ? banners : defaultBanners;
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % displayBanners.length);
    }, 1500); // Change banner every 1.5 seconds

    return () => clearInterval(interval);
  }, [displayBanners.length]);

  // Group games by category
  const popularGames = games.filter(game => game.category === "Popular Games");
  const loadGames = games.filter(game => game.category === "Load");

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
        <input
          type="text"
          placeholder="Search games, services, or products..."
          className="w-full bg-white/90 backdrop-blur-sm border border-pink-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Banner Carousel */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        <div className="relative aspect-[2/1] md:aspect-[3/1]">
          {displayBanners.map((banner, index) => (
            <img
              key={index}
              src={banner}
              alt={`Banner ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                index === currentBanner ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
        </div>
        
        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {displayBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentBanner 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Popular Games */}
      {popularGames.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Popular Games</h2>
          <p className="text-gray-600 text-sm mb-6">Top up your favorite games instantly</p>
          
          <div className="grid grid-cols-12 gap-3">
            {popularGames.map((game) => (
              <button
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`group relative bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden hover:ring-2 hover:ring-pink-400 transition-all border border-pink-100 hover:shadow-xl hover:shadow-pink-200/50 ${
                  game.gridSpan === 'wide' 
                    ? 'col-span-8 md:col-span-6 lg:col-span-4' 
                    : 'col-span-4 md:col-span-3 lg:col-span-2'
                }`}
              >
                {/* Game Image */}
                <div className={`${
                  game.gridSpan === 'wide' ? 'aspect-[2/1]' : 'aspect-[3/4]'
                } relative overflow-hidden`}>
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
                </div>
                
                {/* Game Info */}
                <div className="p-1.5">
                  {game.serverLabel && (
                    <div className="text-[10px] text-pink-500 font-semibold mb-0.5">{game.serverLabel}</div>
                  )}
                  <h3 className="font-bold text-[10px] line-clamp-1 text-gray-800">{game.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Load */}
      {loadGames.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Load</h2>
          <p className="text-gray-600 text-sm mb-6">Mobile load and data promos</p>
          
          <div className="grid grid-cols-12 gap-3">
            {loadGames.map((game) => (
              <button
                key={game.id}
                onClick={() => onSelectGame(game)}
                className={`group relative bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden hover:ring-2 hover:ring-pink-400 transition-all border border-pink-100 hover:shadow-xl hover:shadow-pink-200/50 ${
                  game.gridSpan === 'wide' 
                    ? 'col-span-8 md:col-span-6 lg:col-span-4' 
                    : 'col-span-4 md:col-span-3 lg:col-span-2'
                }`}
              >
                {/* Game Image */}
                <div className={`${
                  game.gridSpan === 'wide' ? 'aspect-[2/1]' : 'aspect-[3/4]'
                } relative overflow-hidden`}>
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
                </div>
                
                {/* Game Info */}
                <div className="p-1.5">
                  <h3 className="font-bold text-[10px] line-clamp-1 text-gray-800">{game.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}