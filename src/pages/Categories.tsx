import MobileLayout from '@/components/MobileLayout';
import { shopCategories, mockShops } from '@/data/mockData';
import ShopCard from '@/components/ShopCard';
import { useState } from 'react';

const Categories = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = selected ? mockShops.filter(s => s.category === selected) : mockShops;

  return (
    <MobileLayout>
      <div className="px-4 pt-4">
        <h1 className="font-display text-xl font-bold mb-4">Categories</h1>

        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => setSelected(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
              !selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
            }`}
          >
            All
          </button>
          {shopCategories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setSelected(cat.name)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px] ${
                selected === cat.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(shop => <ShopCard key={shop.id} shop={shop} />)}
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No shops in this category</p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default Categories;
