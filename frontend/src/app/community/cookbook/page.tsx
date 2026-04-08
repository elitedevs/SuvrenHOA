'use client';

import { useState, useEffect } from 'react';
import { X, Plus, ChefHat, Clock, BarChart2 } from 'lucide-react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Recipe {
  id: string;
  title: string;
  cuisine: string;
  difficulty: Difficulty;
  prepTime: number; // minutes
  submittedBy: string; // lot#
  description: string;
  ingredients: string[];
  steps: string[];
  emoji: string;
  createdAt: string;
}

const STORAGE_KEY = 'hoa_cookbook';

const SAMPLE_RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'Southern BBQ Brisket',
    cuisine: 'American',
    difficulty: 'Hard',
    prepTime: 480,
    submittedBy: 'Lot 4',
    description: 'Award-winning BBQ brisket perfect for neighborhood cookouts',
    emoji: '',
    ingredients: [
      '5 lbs beef brisket',
      '2 tbsp brown sugar',
      '1 tbsp smoked paprika',
      '1 tbsp garlic powder',
      '1 tbsp onion powder',
      '1 tsp black pepper',
      '1 tsp cayenne',
      '1 cup BBQ sauce',
    ],
    steps: [
      'Mix dry rub ingredients and coat brisket generously on all sides',
      'Wrap in plastic wrap and refrigerate overnight',
      'Preheat smoker to 225°F with oak or hickory wood',
      'Smoke brisket fat-side up for 6-8 hours until internal temp reaches 165°F',
      'Wrap in butcher paper and continue cooking until 203°F',
      'Rest for 1 hour before slicing against the grain',
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
  },
  {
    id: 'r2',
    title: 'Lemon Herb Chicken',
    cuisine: 'Mediterranean',
    difficulty: 'Easy',
    prepTime: 45,
    submittedBy: 'Lot 12',
    description: 'Light and fresh — great for summer gatherings',
    emoji: '',
    ingredients: [
      '4 chicken breasts',
      '3 lemons (juice and zest)',
      '4 cloves garlic, minced',
      '2 tbsp olive oil',
      '1 tbsp fresh rosemary',
      '1 tbsp fresh thyme',
      'Salt and pepper to taste',
    ],
    steps: [
      'Marinate chicken in lemon juice, zest, garlic, and herbs for 30 minutes',
      'Heat olive oil in skillet over medium-high heat',
      'Cook chicken 6-7 minutes per side until golden',
      'Rest 5 minutes before serving',
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
  {
    id: 'r3',
    title: 'Neighborhood Potluck Pasta',
    cuisine: 'Italian',
    difficulty: 'Medium',
    prepTime: 60,
    submittedBy: 'Lot 7',
    description: 'Feeds a crowd! Perfect for block parties',
    emoji: '',
    ingredients: [
      '2 lbs penne pasta',
      '2 lbs Italian sausage',
      '2 jars marinara sauce',
      '1 lb mozzarella, shredded',
      '1 cup parmesan',
      '1 large onion, diced',
      '4 cloves garlic',
      'Fresh basil',
    ],
    steps: [
      'Cook pasta al dente, reserve 1 cup pasta water',
      'Brown sausage with onion and garlic, drain fat',
      'Add marinara and simmer 20 minutes',
      'Toss with pasta, adding pasta water as needed',
      'Top with mozzarella and broil until bubbly',
      'Garnish with fresh basil and parmesan',
    ],
    createdAt: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
  },
  {
    id: 'r4',
    title: 'Grandma\'s Apple Pie',
    cuisine: 'American',
    difficulty: 'Medium',
    prepTime: 90,
    submittedBy: 'Lot 22',
    description: 'Classic comfort food for community dessert tables',
    emoji: '',
    ingredients: [
      '2 pre-made pie crusts',
      '6 Granny Smith apples, peeled and sliced',
      '3/4 cup sugar',
      '2 tbsp flour',
      '1 tsp cinnamon',
      '1/4 tsp nutmeg',
      '2 tbsp butter',
      '1 egg (for wash)',
    ],
    steps: [
      'Preheat oven to 375°F',
      'Mix apples with sugar, flour, and spices',
      'Line pie dish with first crust',
      'Fill with apple mixture, dot with butter',
      'Cover with second crust, crimp edges, cut vents',
      'Brush with egg wash, sprinkle sugar',
      'Bake 50-60 minutes until golden',
    ],
    createdAt: new Date(Date.now() - 21 * 24 * 3600000).toISOString(),
  },
];

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: 'text-[#2A5D4F] bg-[rgba(58,125,111,0.10)] border-[rgba(42,93,79,0.20)]',
  Medium: 'text-[#B09B71] bg-[rgba(176,155,113,0.10)] border-[rgba(176,155,113,0.20)]',
  Hard: 'text-[#8B5A5A] bg-[rgba(139,90,90,0.10)] border-[rgba(139,90,90,0.20)]',
};

function formatPrepTime(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl p-5 border border-[rgba(245,240,232,0.04)] cursor-pointer hover:border-[rgba(176,155,113,0.20)] hover-lift transition-all"
    >
      <div className="text-3xl mb-3">{recipe.emoji}</div>
      <h3 className="text-base font-medium text-[var(--parchment)] mb-1">{recipe.title}</h3>
      <p className="text-xs text-[var(--text-disabled)] mb-3 line-clamp-2">{recipe.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-[var(--text-disabled)] bg-[rgba(245,240,232,0.04)] px-2 py-0.5 rounded-full">{recipe.cuisine}</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
          {recipe.difficulty}
        </span>
        <span className="text-[11px] text-[var(--text-disabled)] flex items-center gap-1">
          <Clock className="w-3 h-3" /> {formatPrepTime(recipe.prepTime)}
        </span>
      </div>
      <div className="mt-3 text-[10px] text-[var(--text-disabled)]">Shared by {recipe.submittedBy}</div>
    </div>
  );
}

function RecipeModal({ recipe, onClose }: { recipe: Recipe; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass w-full max-w-lg rounded-xl border border-[rgba(245,240,232,0.08)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(245,240,232,0.06)]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{recipe.emoji}</span>
            <div>
              <h2 className="text-base font-medium text-[var(--parchment)]">{recipe.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[recipe.difficulty]}`}>{recipe.difficulty}</span>
                <span className="text-[11px] text-[var(--text-disabled)]">{recipe.cuisine}</span>
                <span className="text-[11px] text-[var(--text-disabled)]">{formatPrepTime(recipe.prepTime)}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          <p className="text-sm text-[var(--text-muted)] italic">{recipe.description}</p>
          <div>
            <h3 className="text-xs font-medium text-[#B09B71] uppercase tracking-widest mb-3">Ingredients</h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-body)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B09B71] shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-medium text-[#B09B71] uppercase tracking-widest mb-3">Instructions</h3>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[var(--text-body)]">
                  <span className="w-6 h-6 rounded-full bg-[rgba(176,155,113,0.20)] text-[#B09B71] text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="text-[11px] text-[var(--text-disabled)] pt-2 border-t border-[rgba(245,240,232,0.04)]">
            Submitted by {recipe.submittedBy} · {new Date(recipe.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddRecipeModal({ onAdd, onClose }: { onAdd: (r: Recipe) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', cuisine: '', difficulty: 'Easy' as Difficulty, prepTime: '',
    submittedBy: '', description: '', emoji: '', ingredients: '', steps: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    onAdd({
      id: `r_${Date.now()}`,
      title: form.title,
      cuisine: form.cuisine || 'Other',
      difficulty: form.difficulty,
      prepTime: parseInt(form.prepTime) || 30,
      submittedBy: form.submittedBy || 'Anonymous',
      description: form.description,
      emoji: form.emoji || '',
      ingredients: form.ingredients.split('\n').filter(l => l.trim()),
      steps: form.steps.split('\n').filter(l => l.trim()),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="glass w-full max-w-lg rounded-xl border border-[rgba(245,240,232,0.08)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(245,240,232,0.06)]">
          <h2 className="text-base font-medium text-[var(--parchment)]">Share a Recipe</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgba(245,240,232,0.06)] text-[var(--text-muted)] cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Title *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="My Famous Chili"
                className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]" required />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Emoji</label>
              <input value={form.emoji} onChange={e => setForm({...form, emoji: e.target.value})} placeholder=""
                className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Cuisine</label>
              <input value={form.cuisine} onChange={e => setForm({...form, cuisine: e.target.value})} placeholder="Italian"
                className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Difficulty</label>
              <select value={form.difficulty} onChange={e => setForm({...form, difficulty: e.target.value as Difficulty})}
                className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Prep (min)</label>
              <input type="number" value={form.prepTime} onChange={e => setForm({...form, prepTime: e.target.value})} placeholder="30"
                className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Your Lot #</label>
            <input value={form.submittedBy} onChange={e => setForm({...form, submittedBy: e.target.value})} placeholder="Lot 5"
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Description</label>
            <textarea rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Tell us about this recipe..."
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Ingredients (one per line)</label>
            <textarea rows={4} value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} placeholder="2 cups flour&#10;1 tsp salt"
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] resize-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Steps (one per line)</label>
            <textarea rows={4} value={form.steps} onChange={e => setForm({...form, steps: e.target.value})} placeholder="Preheat oven to 375°F&#10;Mix dry ingredients"
              className="w-full px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] focus:outline-none focus:border-[rgba(176,155,113,0.50)] resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[rgba(245,240,232,0.08)] text-sm text-[var(--text-muted)] hover:text-[var(--parchment)] transition-all cursor-pointer">Cancel</button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all cursor-pointer">Share Recipe</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CookbookPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<Difficulty | 'All'>('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setRecipes(raw ? JSON.parse(raw) : SAMPLE_RECIPES);
    } catch {
      setRecipes(SAMPLE_RECIPES);
    }
  }, []);

  const save = (data: Recipe[]) => {
    setRecipes(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const addRecipe = (recipe: Recipe) => {
    save([recipe, ...recipes]);
    setShowAdd(false);
  };

  const filtered = recipes
    .filter(r => filter === 'All' || r.difficulty === filter)
    .filter(r => !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.cuisine.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-medium gradient-text">Community Cookbook</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Recipes shared by your neighbors </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#B09B71] hover:bg-[#D4C4A0] text-[var(--surface-2)] text-sm font-medium transition-all cursor-pointer shrink-0">
          <Plus className="w-4 h-4" /> Share Recipe
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Recipes', value: recipes.length, icon: '' },
          { label: 'Cuisines', value: new Set(recipes.map(r => r.cuisine)).size, icon: '' },
          { label: 'Contributors', value: new Set(recipes.map(r => r.submittedBy)).size, icon: '' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-4 text-center border border-[rgba(245,240,232,0.04)]">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-xl font-medium text-[#B09B71]">{s.value}</div>
            <div className="text-[10px] text-[var(--text-disabled)]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-[rgba(245,240,232,0.04)] border border-[rgba(245,240,232,0.08)] text-sm text-[var(--parchment)] placeholder-[rgba(245,240,232,0.20)] focus:outline-none focus:border-[rgba(176,155,113,0.50)]"
        />
        <div className="glass rounded-xl p-1 flex gap-1 border border-[rgba(245,240,232,0.04)]">
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map(d => (
            <button key={d} onClick={() => setFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filter === d ? 'bg-[rgba(176,155,113,0.20)] text-[#D4C4A0] border border-[rgba(176,155,113,0.30)]' : 'text-[var(--text-disabled)] hover:text-[var(--text-body)]'
              }`}
            >{d}</button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelected(recipe)} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-16 text-[var(--text-disabled)]">
            <div className="text-4xl mb-3"></div>
            <p className="text-sm">No recipes found. Be the first to share!</p>
          </div>
        )}
      </div>

      {selected && <RecipeModal recipe={selected} onClose={() => setSelected(null)} />}
      {showAdd && <AddRecipeModal onAdd={addRecipe} onClose={() => setShowAdd(false)} />}
    </main>
  );
}
