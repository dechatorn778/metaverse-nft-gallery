'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Gallery3D from './Gallery3D';
import { MARKETPLACE_ADDRESS, GG_TOKEN_ADDRESS, GG_TOKEN_ABI, MARKETPLACE_ABI } from './contractConfig';

export default function Home() {
  const [account, setAccount] = useState<string>('');
  const [tbnbBalance, setTbnbBalance] = useState<string>('0');
  const [ggBalance, setGgBalance] = useState<string>('0');
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'gallery' | 'mint' | 'collection'>('gallery');
  const [timeLeft, setTimeLeft] = useState<string>('');

  const [mintName, setMintName] = useState('');
  const [mintPrice, setMintPrice] = useState('');
  const [mintImageUrl, setMintImageUrl] = useState('');

  const [nfts, setNfts] = useState<any[]>([]);

  // 1. โหลดข้อมูล NFT + ตั้งเวลาประมูล
  useEffect(() => {
    const savedNfts = localStorage.getItem('museum_nfts');
    if (savedNfts) {
      setNfts(JSON.parse(savedNfts));
    } else {
      const now = Date.now();
      const initialNfts = [
        { id: 1, name: "Mona Lisa", currentBid: "5000", highestBidder: null, endTime: now + 3600000 * 5, imageUrl: "/monalisa.jpg", isSoldOut: false, owner: null },
        { id: 2, name: "The Starry Night", currentBid: "4500", highestBidder: null, endTime: now + 3600000 * 8, imageUrl: "/starrynight.jpg", isSoldOut: false, owner: null },
        { id: 3, name: "The Scream", currentBid: "3200", highestBidder: null, endTime: now + 3600000 * 12, imageUrl: "/scream.jpg", isSoldOut: false, owner: null },
        { id: 4, name: "Girl with a Pearl Earring", currentBid: "2800", highestBidder: null, endTime: now + 3600000 * 2, imageUrl: "/pearlearring.jpg", isSoldOut: false, owner: null },
        { id: 5, name: "The Persistence of Memory", currentBid: "3500", highestBidder: null, endTime: now + 3600000 * 24, imageUrl: "/memory.jpg", isSoldOut: false, owner: null },
        { id: 6, name: "The Kiss", currentBid: "2500", highestBidder: null, endTime: now + 3600000 * 6, imageUrl: "/kiss.jpg", isSoldOut: false, owner: null },
        { id: 7, name: "The Birth of Venus", currentBid: "4000", highestBidder: null, endTime: now + 3600000 * 18, imageUrl: "/venus.jpg", isSoldOut: false, owner: null },
        { id: 8, name: "The Creation of Adam", currentBid: "4800", highestBidder: null, endTime: now + 3600000 * 10, imageUrl: "/adam.jpg", isSoldOut: false, owner: null },
        { id: 9, name: "The Last Supper", currentBid: "5500", highestBidder: null, endTime: now + 3600000 * 15, imageUrl: "/lastsupper.jpg", isSoldOut: false, owner: null },
        { id: 10, name: "Guernica", currentBid: "6000", highestBidder: null, endTime: now + 3600000 * 3, imageUrl: "/guernica.jpg", isSoldOut: false, owner: null },
      ];
      setNfts(initialNfts);
    }
  }, []);

  useEffect(() => {
    if (nfts.length > 0) {
      localStorage.setItem('museum_nfts', JSON.stringify(nfts));
    }
  }, [nfts]);

  // 2. ตรวจจับการเชื่อมต่อ MetaMask (เช็กสถานะ Logout จาก localStorage เพื่อไม่ให้ต่อให้อัตโนมัติหลัง F5)
  useEffect(() => {
    const isDisconnected = localStorage.getItem('isDisconnected') === 'true';

    if (!isDisconnected && typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          loadBalances(accounts[0]);
        }
      });

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          loadBalances(accounts[0]);
        } else {
          disconnectWallet();
        }
      });
    }
  }, []);

  // 3. ระบบนับเวลาถอยหลังการประมูล
  useEffect(() => {
    if (!selectedNFT) return;

    const timer = setInterval(() => {
      const endTime = selectedNFT.endTime || (Date.now() + 3600000 * 5);
      const distance = endTime - Date.now();
      
      if (distance <= 0) {
        setTimeLeft("หมดเวลาประมูลแล้ว!");
        clearInterval(timer);
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours} ชม. ${minutes} น. ${seconds} ว.`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedNFT]);

  const loadBalances = async (address: string) => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const balance = await provider.getBalance(address);
        setTbnbBalance(parseFloat(ethers.formatEther(balance)).toFixed(3));

        if (GG_TOKEN_ADDRESS && GG_TOKEN_ADDRESS !== '0x6...') {
          const ggContract = new ethers.Contract(GG_TOKEN_ADDRESS, GG_TOKEN_ABI, provider);
          const ggBal = await ggContract.balanceOf(address);
          setGgBalance(parseFloat(ethers.formatEther(ggBal)).toFixed(2));
        }
      }
    } catch (err) {
      console.error("Error loading balances:", err);
    }
  };

  // ฟังก์ชันเชื่อมต่อกระเป๋า Connect Wallet
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // ล้างสถานะ Disconnect เพื่อให้ระบบกลับมาเชื่อมต่อตามปกติ
        localStorage.removeItem('isDisconnected');

        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        loadBalances(accounts[0]);
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("กรุณาติดตั้ง MetaMask");
    }
  };

  // 4. ฟังก์ชัน Logout / Disconnect Wallet (บันทึกสถานะลง localStorage)
  const disconnectWallet = () => {
    localStorage.setItem('isDisconnected', 'true');
    setAccount('');
    setTbnbBalance('0');
    setGgBalance('0');
  };

  // 5. ระบบเสนอราคาประมูล
  const handlePlaceBid = async () => {
    if (!account) return alert("กรุณาเชื่อมต่อ MetaMask ก่อน");
    
    const currentMin = parseFloat(selectedNFT.currentBid || selectedNFT.price || '0');
    if (!bidAmount || parseFloat(bidAmount) <= currentMin) {
      return alert(`ราคาประมูลต้องมากกว่าราคาปัจจุบัน (${currentMin} GG)`);
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const priceInWei = ethers.parseEther(bidAmount);

      alert("ขั้นตอนที่ 1/2: กดยืนยันการอนุญาตหักเหรียญ GG บน MetaMask");
      const ggContract = new ethers.Contract(GG_TOKEN_ADDRESS, GG_TOKEN_ABI, signer);
      const approveTx = await ggContract.approve(MARKETPLACE_ADDRESS, priceInWei);
      await approveTx.wait();

      alert("ขั้นตอนที่ 2/2: กดยืนยันเสนอราคาประมูลผลงานศิลปะ");
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
      const buyTx = await marketplaceContract.buyNFT(selectedNFT.id);
      await buyTx.wait();

      alert(`เสนอราคาสำเร็จ! คุณเป็นผู้เสนอราคาสูงสุดที่ ${bidAmount} GG`);

      setNfts(prev => prev.map(nft => {
        if (nft.id === selectedNFT.id) {
          return {
            ...nft,
            currentBid: bidAmount,
            highestBidder: account,
            price: bidAmount,
            isSoldOut: true,
            owner: account
          };
        }
        return nft;
      }));

      setSelectedNFT(null);
      setBidAmount('');
      loadBalances(account);
    } catch (err: any) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการประมูล: ตรวจสอบว่ายอดเหรียญ GG และค่า Gas (tBNB) เพียงพอหรือไม่");
    } finally {
      setLoading(false);
    }
  };

  const myCollection = nfts.filter(nft => nft.owner?.toLowerCase() === account?.toLowerCase());

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans">
      <nav className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-lg sticky top-0 z-40 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-black text-slate-950 text-xl">3D</div>
          <span className="text-2xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">ART AUCTION MUSEUM</span>
        </div>

        <div className="flex gap-2 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
          <button onClick={() => setActiveTab('gallery')} className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'gallery' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>🏛️ 3D Exhibition</button>
          <button onClick={() => setActiveTab('mint')} className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'mint' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>🎨 Mint Artwork</button>
          <button onClick={() => setActiveTab('collection')} className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === 'collection' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>🖼️ My Collection</button>
        </div>

        <div className="flex items-center gap-4">
          {account && (
            <div className="hidden md:flex gap-3 text-xs font-semibold">
              <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl"><span className="text-slate-400">tBNB:</span> <span className="text-amber-400">{tbnbBalance}</span></div>
              <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl"><span className="text-slate-400">GG:</span> <span className="text-sky-400">{ggBalance}</span></div>
            </div>
          )}

          {/* ปุ่ม Connect / Account Info & Logout */}
          {account ? (
            <div className="flex items-center gap-2">
              <div className="bg-slate-800 border border-amber-500/40 text-amber-400 font-bold px-4 py-2 rounded-xl text-sm">
                {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
              </div>
              <button 
                onClick={disconnectWallet}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold px-3.5 py-2 rounded-xl transition text-sm flex items-center gap-1.5"
                title="Logout / Disconnect Wallet"
              >
                🚪 <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl transition">
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        {activeTab === 'gallery' && <Gallery3D nfts={nfts} onSelectNFT={(nft) => setSelectedNFT(nft)} />}

        {activeTab === 'mint' && (
          <div className="max-w-lg mx-auto bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
            <h2 className="text-2xl font-black text-amber-400 mb-6">Mint & Auction New Art</h2>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <input type="text" placeholder="ชื่อผลงาน..." value={mintName} onChange={(e) => setMintName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
              <input type="number" placeholder="ราคาเริ่มต้นประมูล (GG Token)..." value={mintPrice} onChange={(e) => setMintPrice(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
              <input type="text" placeholder="ลิงก์รูปภาพ https://..." value={mintImageUrl} onChange={(e) => setMintImageUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500" />
              <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-4 rounded-xl transition mt-4">
                {loading ? "กำลังบันทึก..." : "🚀 Mint Artwork"}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <h2 className="text-3xl font-black text-amber-400 mb-2">My Collection</h2>
            <p className="text-slate-400 mb-8">แกลเลอรี่ส่วนตัวที่เก็บผลงานศิลปะที่คุณชนะการประมูล</p>
            
            {!account ? (
              <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-700">
                <p className="text-xl text-slate-500">กรุณาเชื่อมต่อกระเป๋า MetaMask เพื่อดูคอลเลกชันของคุณ</p>
              </div>
            ) : myCollection.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-dashed border-slate-700">
                <p className="text-xl text-slate-500">คุณยังไม่ได้ครอบครองผลงานใดๆ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {myCollection.map((nft) => (
                  <div key={nft.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4">
                    <img src={nft.imageUrl} alt={nft.name} className="w-full h-48 object-cover rounded-xl mb-4" />
                    <h3 className="text-xl font-bold text-white mb-1">{nft.name}</h3>
                    <p className="text-emerald-400 font-bold">Owned by You</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auction Modal */}
      {selectedNFT && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-amber-500/40 shadow-2xl">
            <div className="w-full h-56 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 mb-4 overflow-hidden relative">
              <img src={selectedNFT.imageUrl} alt={selectedNFT.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md border border-amber-500/50 text-amber-400 text-xs font-bold px-3 py-1 rounded-full">
                ⏱️ {timeLeft || 'กำลังคำนวณ...'}
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-1">{selectedNFT.name}</h2>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">ราคาประมูลสูงสุดปัจจุบัน:</span>
                <span className="text-amber-400 font-black">{selectedNFT.currentBid || selectedNFT.price} GG</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">ผู้ชนะประมูลอันดับ 1:</span>
                <span className="text-sky-400 font-semibold">{selectedNFT.highestBidder ? `${selectedNFT.highestBidder.substring(0,6)}...` : 'ยังไม่มีผู้เสนอราคา'}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs text-slate-400 font-bold block">เสนอราคาประมูลสู้ (GG Token):</label>
              <input 
                type="number" 
                placeholder={`ต้องมากกว่า ${selectedNFT.currentBid || selectedNFT.price} GG`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-4 py-3 text-white focus:outline-none font-bold text-amber-400"
              />
            </div>

            <button onClick={handlePlaceBid} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 rounded-xl transition mb-3">
              {loading ? "กำลังทำรายการบน Blockchain..." : "🔨 ยืนยันเสนอราคาประมูล (หักเหรียญ GG)"}
            </button>

            <button onClick={() => setSelectedNFT(null)} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl transition text-sm">
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </main>
  );
}