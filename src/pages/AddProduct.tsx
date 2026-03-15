import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const categories = ['Grocery', 'Bakery', 'Medicine', 'Vegetables', 'Electronics', 'Dairy', 'Snacks', 'Hygiene'];

const AddProduct = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [discount, setDiscount] = useState('');

  const handleSubmit = () => {
    if (!name || !price || !category) return;
    toast.success('Product added successfully!');
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-4 pb-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-xl font-bold">Add Product</h1>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Product Name *</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" placeholder="e.g., Basmati Rice 5kg" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Description</label>
          <Input value={description} onChange={e => setDescription(e.target.value)} className="h-12 rounded-xl" placeholder="Brief description" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Price (Rs) *</label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-12 rounded-xl" placeholder="0" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Category *</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-2 rounded-lg text-sm font-medium border min-h-[40px] ${category === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Discount %</label>
          <Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} className="h-12 rounded-xl" placeholder="0" max={100} />
        </div>

        <Button onClick={handleSubmit} disabled={!name || !price || !category} className="w-full h-14 text-base font-display font-semibold rounded-xl">
          Add Product
        </Button>
      </div>
    </div>
  );
};

export default AddProduct;
