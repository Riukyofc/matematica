"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShopItem, getShopItems, purchaseItem, equipItem, unequipItem } from "@/lib/firebase";

export default function ShopPage() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const loadItems = useCallback(async () => {
    try {
      const data = await getShopItems();
      setItems(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  if (!user || !profile) return null;

  const coins = Number(profile.coins) || 0;
  const ownedItems = (profile.ownedItems as string[]) || [];

  const handlePurchase = async (item: ShopItem) => {
    setActionLoading(item.id);
    try {
      const res = await purchaseItem(user.uid, item);
      showMsg(res.message);
    } catch {
      showMsg("❌ Erro ao comprar item");
    }
    setActionLoading(null);
  };

  const handleEquip = async (item: ShopItem) => {
    setActionLoading(item.id);
    try {
      await equipItem(user.uid, item);
      showMsg(`✅ ${item.name} equipado!`);
    } catch {
      showMsg("❌ Erro ao equipar");
    }
    setActionLoading(null);
  };

  const handleUnequip = async (category: "theme" | "border" | "title") => {
    try {
      await unequipItem(user.uid, category);
      showMsg(`✅ Desequipado!`);
    } catch {
      showMsg("❌ Erro ao desequipar");
    }
  };

  const categories = [
    { id: "theme", label: "Temas de Interface" },
    { id: "border", label: "Bordas Animadas" },
    { id: "title", label: "Títulos de Perfil" }
  ];

  const getRarityColor = (r: string) => {
    switch (r) {
      case "common": return "text-gray-500 border-gray-500";
      case "rare": return "text-blue-500 border-blue-500";
      case "epic": return "text-purple-500 border-purple-500";
      case "legendary": return "text-yellow-500 border-yellow-500";
      default: return "text-gray-500";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            <span>🛒</span> Lojinha de Customização
          </h1>
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            Gaste suas moedas de ouro para personalizar seu perfil e sua interface!
          </p>
        </div>
        <div className="stat-card px-6 py-3 flex items-center gap-3">
          <span className="text-2xl font-black text-yellow-500">{coins}</span>
          <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Moedas<br/>Disponíveis</span>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-bold animate-fade-in">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="h-64 rounded-2xl bg-[var(--color-bg-secondary)] animate-pulse" />
      ) : (
        <div className="space-y-12">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category === cat.id);
            if (catItems.length === 0) return null;

            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-black">{cat.label}</h2>
                  {(profile.equippedTheme && cat.id === "theme") ||
                   (profile.equippedBorder && cat.id === "border") ||
                   (profile.equippedTitle && cat.id === "title") ? (
                    <button onClick={() => handleUnequip(cat.id as any)} className="text-xs font-bold text-red-500 hover:underline">
                      Desequipar atual
                    </button>
                  ) : null}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {catItems.map(item => {
                    const isOwned = ownedItems.includes(item.id);
                    const isEquipped = profile.equippedTheme === item.preview || profile.equippedBorder === item.preview || profile.equippedTitle === item.preview;
                    const canAfford = coins >= item.price;
                    const isProcessing = actionLoading === item.id;

                    return (
                      <div key={item.id} className={`glass-card p-5 flex flex-col relative overflow-hidden transition-all duration-300 ${isEquipped ? 'ring-2 ring-emerald-500' : ''}`}>
                        {isEquipped && (
                          <div className="absolute top-3 right-3 text-xs font-black bg-emerald-500 text-white px-2 py-1 rounded-md shadow-md">
                            EQUIPADO
                          </div>
                        )}
                        
                        <div className="text-4xl mb-3 text-center">{item.icon}</div>
                        
                        <div className="text-center mb-4 flex-1">
                          <h3 className="font-black text-lg mb-1">{item.name}</h3>
                          <p className="text-xs text-[var(--color-text-secondary)]">{item.description}</p>
                          <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border rounded-full ${getRarityColor(item.rarity)}`}>
                            {item.rarity}
                          </span>
                        </div>

                        <div className="mt-auto">
                          {isOwned ? (
                            <button
                              disabled={isEquipped || isProcessing}
                              onClick={() => handleEquip(item)}
                              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${isEquipped ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] cursor-not-allowed' : 'btn-primary'}`}
                            >
                              {isProcessing ? "Aguarde..." : isEquipped ? "Em uso" : "Equipar"}
                            </button>
                          ) : (
                            <button
                              disabled={!canAfford || isProcessing}
                              onClick={() => handlePurchase(item)}
                              className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${!canAfford ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600 text-white shadow-md shadow-yellow-500/20'}`}
                            >
                              {isProcessing ? "Comprando..." : (
                                <>
                                  <span>Comprar</span>
                                  <span className="font-black">{item.price} 🟡</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
