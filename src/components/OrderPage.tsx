import type { Game, OrderData } from '../shared/types';
import profileImage from 'figma:asset/ba79a9921d212b3c4f1c637ba6a0408050ebca02.png';
import hokUidImage from 'figma:asset/2f0999dee69437b4732d50cf4ff9ede00a8443dc.png';
import { useEffect, useRef, useState } from 'react';
import { Info, X } from 'lucide-react';

interface OrderPageProps {
  game: Game;
  orderData: OrderData;
  updateOrderData: (updates: Partial<OrderData>) => void;
  onContinue: () => void;
  onAddToCart: () => void;
}

export function OrderPage({ game, orderData, updateOrderData, onContinue, onAddToCart }: OrderPageProps) {
  const subscriptions = game.products.filter(p => p.subscription); // Filter by subscription flag
  const doubleRewards = game.products.filter(p => p.doubleReward); // Filter by doubleReward flag
  const battlePass = game.products.filter(p => p.battlePass); // Filter by battlePass flag
  const passes = game.products.filter(p => p.pass); // Filter by pass flag for Blood Strike and Honkai
  const welkinMoon = game.products.filter(p => p.welkinMoon); // Filter by welkinMoon flag for Genshin
  const genesis = game.products.filter(p => p.genesis); // Filter by genesis flag for Genshin
  const chronal = game.products.filter(p => p.chronal); // Filter by chronal flag for Genshin
  const diamonds = game.products.filter(p => !p.subscription && !p.doubleReward && !p.battlePass && !p.pass && !p.welkinMoon && !p.genesis && !p.chronal); // Everything else
  
  const [codmProcess, setCodmProcess] = useState<'redeem-code' | 'player-id' | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const total = (orderData.product?.price || 0) * orderData.quantity;
  
  // Detect if this is a load product, CODM, Blood Strike, or Honkai
  const isLoadProduct = game.category === 'Load';
  const isCODM = game.id === 'codm';
  const isBloodStrike = game.id === 'bloodstrike';
  const isHonkai = game.id === 'honkai';
  const isWuthering = game.id === 'wuthering';
  const isHOK = game.id === 'hok';
  const isPUBGM = game.id === 'pubgm';
  const isCrossfire = game.id === 'crossfire';
  const isMarvelRivals = game.id === 'marvelrivals';
  const isGenshin = game.id === 'hoyo';
  const isValorant = game.id === 'valorant';
  const isML = ['ml-ph', 'ml-global', 'ml-indo'].includes(game.id);

  const alwaysShowTutorial = isCODM || isBloodStrike || isHonkai || isWuthering || isHOK || isPUBGM || isCrossfire || isMarvelRivals || isGenshin || isValorant || isLoadProduct;
  
  // Update validation logic
  const isValid = isCODM 
    ? (codmProcess === 'redeem-code' ? orderData.product : (orderData.product && orderData.playerId.trim()))
    : isCrossfire
      ? orderData.product
      : isML
        ? (orderData.product && orderData.playerId.trim())
      : (isHOK || isBloodStrike || isLoadProduct || isPUBGM || isMarvelRivals || isValorant) 
        ? (orderData.product && orderData.playerId.trim())
        : (orderData.product && orderData.playerId.trim() && orderData.server.trim()); 

  const buttonsSectionRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const accountDetailsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to buttons when product is selected
  useEffect(() => {
    if (orderData.product && buttonsSectionRef.current) {
      buttonsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [orderData.product]);

  // Auto-scroll based on CODM process selection
  useEffect(() => {
    if (codmProcess === 'redeem-code' && productsRef.current) {
      // Process 1: Scroll to products directly
      productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (codmProcess === 'player-id' && accountDetailsRef.current) {
      // Process 2: Scroll to account details (Player ID input)
      accountDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [codmProcess]);

  // Force quantity to 1 for specific items
  useEffect(() => {
    if (orderData.product && ['twilightpass', 'monthlyepic', 'weeklyelite'].includes(orderData.product.id)) {
      if (orderData.quantity !== 1) {
        updateOrderData({ quantity: 1 });
      }
    }
  }, [orderData.product, orderData.quantity]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Game Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-pink-100 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-purple-50/50 z-0" />
        <div className="flex items-center gap-4 relative z-10">
          <img src={game.image} alt={game.name} className="w-16 h-16 rounded-2xl object-cover shadow-md border-2 border-white" />
          <div>
            <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">
              {game.name}
            </h1>
            <p className="text-xs font-bold text-pink-500 uppercase tracking-wider mt-1">
              {game.serverLabel || game.category || "Game Top-up"}
            </p>
          </div>
        </div>
        {!alwaysShowTutorial && (
          <button 
            onClick={() => setShowTutorial(!showTutorial)}
            className={`relative z-10 p-2 rounded-full transition-all flex items-center gap-2 ${showTutorial ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-pink-500'}`}
            title="How to Top-up"
          >
            <span className="text-xs font-bold hidden sm:inline">{showTutorial ? 'Hide Guide' : 'How to Top-up?'}</span>
            {showTutorial ? <X size={24} /> : <Info size={24} className="animate-pulse" />}
          </button>
        )}
      </div>

      {/* Tutorial Section */}
      {(showTutorial || alwaysShowTutorial) && (
        <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-l-4 border-pink-500 shadow-lg ${alwaysShowTutorial ? '' : 'animate-in fade-in slide-in-from-top-4 duration-300'}`}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <span className="text-2xl text-pink-500">|</span> {isCODM ? 'How to Redeem Garena Shells' : isBloodStrike ? 'HOW TO BUY GOLD IN BLOODSTRIKE' : isHonkai ? 'How to Top-up?' : isWuthering ? 'How to Top-up?' : isGenshin ? 'How to Top-up?' : isHOK ? 'How to Top-up HOK Tokens?' : isLoadProduct ? 'HOW TO BUY LOAD' : isPUBGM ? 'HOW TO BUY UC IN PUBG: MOBILE' : isCrossfire ? 'HOW TO TOP-UP IN CROSSFIRE' : isMarvelRivals ? 'HOW TO BUY LATTICE IN MARVEL RIVALS' : isValorant ? 'HOW TO BUY VP IN VALORANT' : 'How to Top-up MLBB Diamonds?'}
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
          {isCODM ? (
            <>
              <p className="font-bold text-pink-600 mb-3">Choose your preferred redemption process:</p>
              
              {/* Process 1: Redeem Code - Clickable Button */}
              <button
                onClick={() => {
                  setCodmProcess('redeem-code');
                  updateOrderData({ playerId: 'N/A', server: 'N/A' });
                }}
                className={`w-full text-left bg-pink-50 border-2 rounded-xl p-4 mb-4 transition-all hover:shadow-lg ${
                  codmProcess === 'redeem-code' ? 'border-pink-500 ring-4 ring-pink-200 shadow-lg' : 'border-pink-200'
                }`}
              >
                <h3 className="font-bold text-gray-800 mb-2">🎮 Process 1: Redeem Code (You Redeem)</h3>
                <ol className="space-y-2 list-decimal list-inside text-xs">
                  <li>Visit the Official Garena Shop<br/>
                    <span className="text-gray-500 ml-6">Go to <a href="https://shop.garena.ph/app" target="_blank" rel="noopener noreferrer" className="text-pink-500 underline font-semibold" onClick={(e) => e.stopPropagation()}>https://shop.garena.ph/app</a></span>
                  </li>
                  <li>Select "Call of Duty"<br/>
                    <span className="text-gray-500 ml-6">Click on the "Call of Duty" option from the list.</span>
                  </li>
                  <li>Log in to Your Call of Duty: Mobile Account<br/>
                    <span className="text-gray-500 ml-6">Choose your preferred login method: Facebook or Garena Account.</span>
                  </li>
                  <li>Choose Your Game<br/>
                    <span className="text-gray-500 ml-6">Select Call of Duty: Mobile-Garena from the options.</span>
                  </li>
                  <li>Select Garena Prepaid Card<br/>
                    <span className="text-gray-500 ml-6">Choose the Garena Prepaid Card option as your payment method.</span>
                  </li>
                  <li>Enter Your Card PIN<br/>
                    <span className="text-gray-500 ml-6">Input the password or PIN from your Garena Prepaid Card to redeem.</span>
                  </li>
                </ol>
                {codmProcess === 'redeem-code' && (
                  <div className="mt-3 bg-green-100 border border-green-300 rounded-lg p-2">
                    <p className="text-xs text-green-800 font-bold">✅ Selected! You can now proceed to select products below.</p>
                  </div>
                )}
              </button>

              {/* Process 2: Via Player ID - Clickable Button */}
              <button
                onClick={() => {
                  setCodmProcess('player-id');
                  updateOrderData({ playerId: '', server: 'N/A' });
                }}
                className={`w-full text-left bg-purple-50 border-2 rounded-xl p-4 transition-all hover:shadow-lg ${
                  codmProcess === 'player-id' ? 'border-purple-500 ring-4 ring-purple-200 shadow-lg' : 'border-purple-200'
                }`}
              >
                <h3 className="font-bold text-gray-800 mb-2">👤 Process 2: Via Player ID (We Redeem)</h3>
                <p className="text-xs text-gray-600">Simply enter your Player ID below and we'll redeem the Garena Shells for you!</p>
                {codmProcess === 'player-id' && (
                  <div className="mt-3 bg-green-100 border border-green-300 rounded-lg p-2">
                    <p className="text-xs text-green-800 font-bold">✅ Selected! Please enter your Player ID below.</p>
                  </div>
                )}
              </button>
            </>
          ) : isBloodStrike ? (
            <>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Enter your Bloodstrike User ID</li>
                <li>Select the amount of gold you want to buy.</li>
                <li>Complete the payment.</li>
                <li>Bloodstrike gold will be added to your account.</li>
              </ol>
              
              {/* Blood Strike Note */}
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-xs text-yellow-800 font-bold">
                  ⚡ <strong>Note:</strong><br/><br/>
                  Items listed below (e.g., Level Up Pass, Strike Elite Pass, Strike Premium Pass, Ultra Skin Lucky Chest) are processed manually and may take 1–30 minutes to be delivered.<br/><br/>
                  All other products are processed automatically and will be credited instantly after successful payment.
                </p>
              </div>
            </>
          ) : isHonkai ? (
            <>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Enter your User ID and Select Server</li>
                <li>Select the product you want.</li>
              </ol>
            </>
          ) : isWuthering ? (
            <>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Enter your User ID and Select Server</li>
                <li>Select the product you want.</li>
              </ol>
            </>
          ) : isGenshin ? (
            <>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Enter your User ID and Select Server</li>
                <li>Select the product you want.</li>
              </ol>
            </>
          ) : isHOK ? (
            <>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Enter your UID<br/>
                  <span className="text-gray-500 ml-6">Example: <span className="text-pink-500 font-semibold">6382939382</span></span>
                </li>
                <li>Select the Tokens you want.</li>
                <li>Complete the payment.</li>
                <li>Tokens will be added to your HOK account.</li>
              </ol>
              
              {/* HOK How to find UID */}
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-3">
                <p className="text-sm text-purple-800 font-bold mb-2">How to find UID?</p>
                <ol className="space-y-1 list-decimal list-inside text-xs text-purple-700">
                  <li>Tap your Avatar to access the Profile page in game.</li>
                  <li>Go to Settings and copy your UID.</li>
                </ol>
                <div className="mt-3">
                  <img src={hokUidImage} alt="HOK UID Example" className="w-full rounded-lg" />
                </div>
              </div>
            </>
          ) : isLoadProduct ? (
            <ol className="space-y-2 list-decimal list-inside">
              <li>Enter your prepaid mobile number.<br/>
                <span className="text-gray-500 ml-6">Example: <span className="text-pink-500 font-semibold">09123456789</span></span>
              </li>
              <li>Select the amount of load or promo that you want to buy.</li>
              <li>Complete the payment. Once purchased, the load is received instantly.</li>
            </ol>
          ) : isPUBGM ? (
            <ol className="space-y-2 list-decimal list-inside">
              <li>Enter your User ID</li>
              <li>Choose the amount of UC you want to buy.</li>
              <li>Complete the payment.</li>
              <li>UC will be added to your PUBGM account.</li>
            </ol>
          ) : isCrossfire ? (
            <ol className="space-y-2 list-decimal list-inside">
              <li>Go to this link: <a href="https://cfph.onstove.com/" target="_blank" rel="noopener noreferrer" className="text-pink-500 underline font-semibold">https://cfph.onstove.com/</a></li>
              <li>Select top-up tab.</li>
              <li>Then, input purchased Gameclub Code and Password to complete transaction.</li>
            </ol>
          ) : isMarvelRivals ? (
            <ol className="space-y-2 list-decimal list-inside">
              <li>Enter your User ID</li>
              <li>Select the amount of lattice you want to buy.</li>
              <li>Complete the payment.</li>
              <li>Lattices will be added to your Marvel Rivals account.</li>
            </ol>
          ) : isValorant ? (
            <ol className="space-y-2 list-decimal list-inside">
              <li>Enter your Riot ID and Tagline<br/>
                <span className="text-gray-500 ml-6">Example: <span className="text-pink-500 font-semibold">HELIA#1234</span></span>
              </li>
              <li>Select the amount of valorant points you want to buy.</li>
              <li>Complete the payment.</li>
              <li>Valorant points will be added to your Valorant account.</li>
            </ol>
          ) : (
            <ol className="space-y-2 list-decimal list-inside">
              <li>Enter your User ID and Zone ID<br/>
                <span className="text-gray-500 ml-6">Example: <span className="text-pink-500 font-semibold">123456789 (1234)</span></span>
              </li>
              <li>Select the Diamonds you want.</li>
              <li>Complete the payment.</li>
              <li>Diamonds will be added to your MLBB account.</li>
            </ol>
          )}
          
          {isLoadProduct && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs text-yellow-800 font-bold">
                <strong>NOTE:</strong> Make sure to select the right network provider.<br/>
                Please avoid multiple quantity to avoid errors
              </p>
            </div>
          )}
          
          {/* Processing Time Note - not for Blood Strike since it has its own note */}
          {!isBloodStrike && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-800 font-bold">
                ⏱️ <strong>Estimated Processing Time:</strong> 1min to 30mins
              </p>
            </div>
          )}
          
          {/* Profile Image - only show for non-load and non-CODM and non-BloodStrike and non-Honkai and non-Wuthering products */}
          {!isLoadProduct && !isCODM && !isBloodStrike && !isHonkai && !isWuthering && !isGenshin && !isHOK && !isPUBGM && !isCrossfire && !isMarvelRivals && !isValorant && (
            <div className="mt-4">
              <img src={profileImage} alt="MLBB Profile Example" className="w-full rounded-lg object-cover object-top max-h-96" />
            </div>
          )}
        </div>
      </div>
      )}

      {/* Account Details */}
      {(!isCODM || (isCODM && codmProcess === 'player-id')) && !isCrossfire && (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-lg" ref={accountDetailsRef}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
            <span className="text-2xl text-pink-500">|</span> Account Details
          </h2>
          
          {/* Server Note */}
          {game.note && (
            <div className="mb-4 bg-pink-50 border border-pink-200 rounded-xl p-3">
              <p className="text-xs text-pink-700 font-medium">
                ℹ️ {game.note}
              </p>
            </div>
          )}
          
          {isLoadProduct ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Number</label>
              <input
                type="text"
                placeholder="Enter mobile number"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
          ) : isCODM ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Player ID</label>
              <input
                type="text"
                placeholder="Enter Player ID"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
              {/* WHERE TO FIND PLAYER ID */}
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-[10px] text-blue-800 leading-relaxed">
                  <strong>WHERE TO FIND PLAYER ID:</strong><br/>
                  To find your Player ID, go to Settings, tap User Settings, and your Player ID will be visible right away at the bottom under Legal and Privacy.
                </p>
              </div>
            </div>
          ) : isBloodStrike ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">User ID</label>
              <input
                type="text"
                placeholder="Enter User ID"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
          ) : isHonkai ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">User ID</label>
                <input
                  type="text"
                  placeholder="Enter User ID"
                  value={orderData.playerId}
                  onChange={(e) => updateOrderData({ playerId: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Select Server</label>
                <select
                  value={orderData.server}
                  onChange={(e) => updateOrderData({ server: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                >
                  <option value="">Choose Server</option>
                  <option value="Asia">Asia</option>
                  <option value="America">America</option>
                  <option value="Europe">Europe</option>
                  <option value="TW, HK, MO">TW, HK, MO</option>
                </select>
              </div>
            </div>
          ) : isWuthering ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">User ID</label>
                <input
                  type="text"
                  placeholder="Enter User ID"
                  value={orderData.playerId}
                  onChange={(e) => updateOrderData({ playerId: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Select Server</label>
                <select
                  value={orderData.server}
                  onChange={(e) => updateOrderData({ server: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                >
                  <option value="">Choose Server</option>
                  <option value="SEA">SEA</option>
                  <option value="Asia">Asia</option>
                  <option value="America">America</option>
                  <option value="Europe">Europe</option>
                  <option value="TW, HK, MO">TW, HK, MO</option>
                </select>
              </div>
            </div>
          ) : isGenshin ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">User ID</label>
                <input
                  type="text"
                  placeholder="Enter User ID"
                  value={orderData.playerId}
                  onChange={(e) => updateOrderData({ playerId: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Select Server</label>
                <select
                  value={orderData.server}
                  onChange={(e) => updateOrderData({ server: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                >
                  <option value="">Choose Server</option>
                  <option value="Asia">Asia</option>
                  <option value="America">America</option>
                  <option value="Europe">Europe</option>
                  <option value="TW, HK, MO">TW, HK, MO</option>
                </select>
              </div>
            </div>
          ) : isHOK ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">UID</label>
              <input
                type="text"
                placeholder="Enter UID"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
          ) : isPUBGM ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">User ID</label>
              <input
                type="text"
                placeholder="Enter User ID"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
          ) : isMarvelRivals ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">User ID</label>
              <input
                type="text"
                placeholder="Enter User ID"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
          ) : isValorant ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Riot ID & Tagline</label>
              <input
                type="text"
                placeholder="Enter Riot ID & Tagline (e.g. HELIA#1234)"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
              {/* NOTE: Remove the space from your riot ID */}
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-[10px] text-yellow-800 leading-relaxed">
                  <strong>NOTE:</strong> Remove the space from your riot ID
                </p>
              </div>
              {/* PRE ORDER: Processing time 1-60mins */}
              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-3">
                <p className="text-[10px] text-purple-800 leading-relaxed font-bold">
                  <strong>PRE ORDER:</strong> Processing time 1-60mins.
                </p>
              </div>
            </div>
          ) : isML ? (
            <div>
              <label className="block text-sm text-gray-600 mb-2 font-medium">Enter ID, Server and IGN</label>
              <input
                type="text"
                placeholder="Example: 123456789 (1234) Helia"
                value={orderData.playerId}
                onChange={(e) => updateOrderData({ playerId: e.target.value, server: 'N/A', ign: '' })}
                className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">User ID</label>
                <input
                  type="text"
                  placeholder="Enter User ID"
                  value={orderData.playerId}
                  onChange={(e) => updateOrderData({ playerId: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Zone ID</label>
                <input
                  type="text"
                  placeholder="Enter Zone ID"
                  value={orderData.server}
                  onChange={(e) => updateOrderData({ server: e.target.value })}
                  className="w-full bg-white border border-pink-200 rounded-xl py-3 px-4 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Select Product */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-lg" ref={productsRef}>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
          <span className="text-2xl text-pink-500">|</span> Select Product
        </h2>

        {/* Subscriptions Section */}
        {subscriptions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Subscriptions</h3>
            <div className="grid grid-cols-3 gap-4">
              {subscriptions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Double Rewards Section */}
        {doubleRewards.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Double Rewards</h3>
            <div className="grid grid-cols-3 gap-4">
              {doubleRewards.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Battle Pass Section */}
        {battlePass.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Battle Pass</h3>
            <div className="grid grid-cols-3 gap-4">
              {battlePass.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Passes Section */}
        {passes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Passes</h3>
            <div className="grid grid-cols-3 gap-4">
              {passes.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Welkin Moon Section */}
        {welkinMoon.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Welkin Moon</h3>
            <div className="grid grid-cols-3 gap-4">
              {welkinMoon.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Genesis Section */}
        {genesis.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Genesis Crystals</h3>
            <div className="grid grid-cols-3 gap-4">
              {genesis.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chronal Section */}
        {chronal.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Chronal Crystals</h3>
            <div className="grid grid-cols-3 gap-4">
              {chronal.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Diamonds Section */}
        {diamonds.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-700">{isLoadProduct ? 'Load' : isCODM ? 'COD POINTS' : isBloodStrike ? 'GOLD' : isHonkai ? 'Oneiric Shard Packages' : isWuthering ? 'Lunites' : isHOK ? 'Tokens' : isPUBGM ? 'UC' : isCrossfire ? 'ECOINS' : isMarvelRivals ? 'MARVEL RIVALS CREDITS' : isValorant ? 'VP' : 'Diamonds'}</h3>
            <div className="grid grid-cols-3 gap-4">
              {diamonds.map((product) => (
                <button
                  key={product.id}
                  onClick={() => updateOrderData({ product })}
                  className={`bg-white border border-pink-200 rounded-xl p-4 hover:shadow-lg transition-all text-left ${
                    orderData.product?.id === product.id 
                      ? 'ring-4 ring-pink-400 shadow-lg' 
                      : ''
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-800 leading-tight">{product.name}</div>
                  {product.note && (
                    <div className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md mb-1 inline-block">{product.note}</div>
                  )}
                  {product.bonus && (
                    <div className="text-[11px] text-gray-600 mb-2">( {product.bonus} )</div>
                  )}
                  <div className="text-xs font-bold text-gray-800">₱{product.price.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
          <span className="text-2xl text-pink-500">|</span> Quantity
        </h2>
        
        {['twilightpass', 'monthlyepic', 'weeklyelite'].includes(orderData.product?.id || '') ? (
          <div className="mt-6 text-center">
             <div className="text-3xl font-bold text-gray-400 mb-2">1</div>
             <div className="text-xs text-pink-500 font-medium italic">
               Limit: 1 per transaction
             </div>
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={() => updateOrderData({ quantity: Math.max(1, orderData.quantity - 1) })}
              className="w-10 h-10 rounded-lg bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-400 flex items-center justify-center font-bold text-xl transition-colors text-gray-700"
            >
              −
            </button>
            <div className="text-center min-w-[60px]">
              <input
                type="number"
                min="1"
                max="10"
                value={orderData.quantity}
                onChange={(e) => updateOrderData({ quantity: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
                className="w-full bg-white border border-pink-200 rounded-lg py-2 px-3 text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => updateOrderData({ quantity: Math.min(10, orderData.quantity + 1) })}
              className="w-10 h-10 rounded-lg bg-white border border-pink-200 hover:bg-pink-50 hover:border-pink-400 flex items-center justify-center font-bold text-xl transition-colors text-gray-700"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Total & Continue Button */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-100 shadow-lg" ref={buttonsSectionRef}>
        {/* Disclaimer */}
        {game.disclaimer && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs text-yellow-800 font-bold text-center">
              ⚠️ {game.disclaimer}
            </p>
          </div>
        )}
        
        <div className="text-center mb-4">
          <div className="text-sm text-gray-600 mb-1 font-medium">Total Amount</div>
          <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">₱{total.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">Quantity: {orderData.quantity}</div>
        </div>
        
        <button
          onClick={onContinue}
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          Continue to Payment
        </button>
        
        <button
          onClick={onAddToCart}
          disabled={!isValid}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:shadow-none mt-4"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}