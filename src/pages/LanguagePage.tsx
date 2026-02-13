import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Globe, 
  Check, 
  ChevronRight, 
  ArrowLeft, 
  Search, 
  Star, 
  StarOff,
  Languages,
  MapPin,
  BookOpen,
  Mic,
  Volume2,
  Smartphone,
  Laptop,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';

const languages = [
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸', region: 'United States', speakers: '1.5B+', rtl: false },
  { code: 'zh', label: 'Mandarin Chinese', native: '中文', flag: '🇨🇳', region: 'China', speakers: '1.1B+', rtl: false },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'India', speakers: '600M+', rtl: false },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'Spain, Latin America', speakers: '550M+', rtl: false },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', region: 'France, Canada, Africa', speakers: '300M+', rtl: false },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦', region: 'Middle East, North Africa', speakers: '420M+', rtl: true },
  { code: 'bn', label: 'Bengali', native: 'বাংলা', flag: '🇧🇩', region: 'Bangladesh, India', speakers: '270M+', rtl: false },
  { code: 'pt', label: 'Portuguese', native: 'Português', flag: '🇧🇷', region: 'Brazil, Portugal', speakers: '260M+', rtl: false },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺', region: 'Russia, CIS', speakers: '260M+', rtl: false },
  { code: 'ur', label: 'Urdu', native: 'اردو', flag: '🇵🇰', region: 'Pakistan, India', speakers: '230M+', rtl: true },
  { code: 'de', label: 'German', native: 'Deutsch', flag: '🇩🇪', region: 'Germany, Austria, Switzerland', speakers: '135M+', rtl: false },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵', region: 'Japan', speakers: '125M+', rtl: false },
  { code: 'ko', label: 'Korean', native: '한국어', flag: '🇰🇷', region: 'South Korea', speakers: '80M+', rtl: false },
  { code: 'it', label: 'Italian', native: 'Italiano', flag: '🇮🇹', region: 'Italy', speakers: '85M+', rtl: false },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', flag: '🇹🇷', region: 'Turkey', speakers: '85M+', rtl: false },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', region: 'Vietnam', speakers: '85M+', rtl: false },
  { code: 'th', label: 'Thai', native: 'ภาษาไทย', flag: '🇹🇭', region: 'Thailand', speakers: '70M+', rtl: false },
  { code: 'pl', label: 'Polish', native: 'Polski', flag: '🇵🇱', region: 'Poland', speakers: '50M+', rtl: false },
  { code: 'uk', label: 'Ukrainian', native: 'Українська', flag: '🇺🇦', region: 'Ukraine', speakers: '40M+', rtl: false },
  { code: 'nl', label: 'Dutch', native: 'Nederlands', flag: '🇳🇱', region: 'Netherlands, Belgium', speakers: '30M+', rtl: false },
];

// Language regions for grouping
const regions = [
  { id: 'popular', name: 'Most Popular', languages: ['en', 'es', 'zh', 'hi', 'ar', 'fr'] },
  { id: 'asia', name: 'Asia', languages: ['zh', 'hi', 'bn', 'ja', 'ko', 'vi', 'th', 'ur'] },
  { id: 'europe', name: 'Europe', languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'pl', 'uk', 'nl'] },
  { id: 'middleeast', name: 'Middle East & Africa', languages: ['ar', 'tr', 'ur'] },
  { id: 'americas', name: 'Americas', languages: ['en', 'es', 'pt', 'fr'] },
];

// Language Card Component
const LanguageCard = ({ 
  lang, 
  isSelected, 
  onSelect, 
  isFavorite, 
  onToggleFavorite 
}: { 
  lang: typeof languages[0]; 
  isSelected: boolean; 
  onSelect: () => void; 
  isFavorite: boolean; 
  onToggleFavorite: (e: React.MouseEvent) => void;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        relative p-4 rounded-xl border-2 transition-all cursor-pointer
        ${isSelected 
          ? 'border-[#F0B90B] bg-[#F0B90B]/5' 
          : 'border-[#2B3139] hover:border-[#F0B90B]/50 bg-[#1E2329]'
        }
      `}
      onClick={onSelect}
    >
      {/* RTL Support Indicator */}
      {lang.rtl && (
        <Badge className="absolute top-3 right-3 bg-[#2B3139] text-[#848E9C] text-[10px]">
          RTL
        </Badge>
      )}
      
      <div className="flex items-start gap-4">
        {/* Flag */}
        <div className="text-4xl">{lang.flag}</div>
        
        {/* Language Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[#EAECEF]">{lang.label}</span>
            <span className="text-sm text-[#848E9C]">({lang.native})</span>
            {lang.code === 'en' && (
              <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] text-[10px]">
                Default
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-[#848E9C]">
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {lang.region}
            </span>
            <span className="flex items-center gap-1">
              <Mic size={12} />
              {lang.speakers} speakers
            </span>
          </div>
        </div>
        
        {/* Selection & Favorite */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFavorite}
            className="p-2 hover:bg-[#2B3139] rounded-lg transition-colors"
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? (
              <Star className="w-5 h-5 fill-[#F0B90B] text-[#F0B90B]" />
            ) : (
              <StarOff className="w-5 h-5 text-[#848E9C]" />
            )}
          </button>
          
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-[#F0B90B] flex items-center justify-center">
              <Check className="w-4 h-4 text-[#181A20]" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Region Section Component
const RegionSection = ({ 
  region, 
  languages, 
  selected, 
  onSelect,
  favorites,
  onToggleFavorite
}: {
  region: typeof regions[0];
  languages: typeof languages;
  selected: string;
  onSelect: (code: string) => void;
  favorites: string[];
  onToggleFavorite: (code: string, e: React.MouseEvent) => void;
}) => {
  const regionLanguages = languages.filter(lang => 
    region.languages.includes(lang.code)
  );
  
  if (regionLanguages.length === 0) return null;
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#EAECEF]">{region.name}</h3>
        <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
          {regionLanguages.length} languages
        </Badge>
      </div>
      
      <div className="space-y-3">
        {regionLanguages.map(lang => (
          <LanguageCard
            key={lang.code}
            lang={lang}
            isSelected={selected === lang.code}
            onSelect={() => onSelect(lang.code)}
            isFavorite={favorites.includes(lang.code)}
            onToggleFavorite={(e) => onToggleFavorite(lang.code, e)}
          />
        ))}
      </div>
    </div>
  );
};

export default function LanguagePage() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(i18n.language || 'en');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  
  // Load saved preferences
  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      setSelected(savedLang);
    }
    
    const savedFavorites = localStorage.getItem('language_favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    } else {
      // Default favorites
      setFavorites(['en', 'es', 'zh', 'hi', 'ar']);
    }
  }, []);

  // Filter languages based on search
  const filteredLanguages = languages.filter(lang => 
    lang.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get favorite languages
  const favoriteLanguages = languages.filter(lang => 
    favorites.includes(lang.code)
  );

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    i18n.changeLanguage(selected);
    localStorage.setItem('language', selected);
    localStorage.setItem('language_favorites', JSON.stringify(favorites));
    
    setIsSaving(false);
    navigate(-1);
  };

  // Toggle favorite
  const handleToggleFavorite = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const newFavorites = prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code];
      return newFavorites;
    });
  };

  return (
    <motion.div 
      className="min-h-screen bg-[#181A20] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#181A20]/95 backdrop-blur border-b border-[#2B3139]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-[#23262F] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#848E9C]" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#F0B90B]/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-[#F0B90B]" />
              </div>
              <h1 className="text-lg font-bold text-[#EAECEF]">{t('Language Settings')}</h1>
            </div>
          </div>
          
          <Badge className="bg-[#F0B90B]/10 text-[#F0B90B] border-[#F0B90B]/20">
            <Languages className="w-3 h-3 mr-1" />
            {languages.length} Languages
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#848E9C]" />
          <Input
            type="text"
            placeholder={t('Search languages...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 bg-[#1E2329] border-[#2B3139] text-[#EAECEF] placeholder:text-[#5E6673] h-11 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#848E9C] hover:text-[#EAECEF]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Favorites Section */}
      {favoriteLanguages.length > 0 && searchQuery === '' && (
        <div className="px-4 pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-[#F0B90B] fill-[#F0B90B]" />
            <h2 className="text-sm font-semibold text-[#EAECEF]">Favorites</h2>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {favoriteLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelected(lang.code)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl transition-all
                  ${selected === lang.code 
                    ? 'bg-[#F0B90B] text-[#181A20]' 
                    : 'bg-[#1E2329] border border-[#2B3139] text-[#EAECEF] hover:border-[#F0B90B]'
                  }
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.native}</span>
                {selected === lang.code && <Check className="w-4 h-4 ml-1" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 px-4 py-6 pb-28 overflow-y-auto custom-scrollbar">
        {searchQuery ? (
          // Search Results
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#EAECEF]">Search Results</h3>
              <Badge className="bg-[#2B3139] text-[#848E9C] text-[10px]">
                {filteredLanguages.length} languages
              </Badge>
            </div>
            
            {filteredLanguages.length === 0 ? (
              <Card className="bg-[#1E2329] border border-[#2B3139] p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2B3139] flex items-center justify-center">
                  <Languages className="w-8 h-8 text-[#5E6673]" />
                </div>
                <h4 className="text-[#EAECEF] font-medium mb-2">No languages found</h4>
                <p className="text-xs text-[#848E9C]">
                  Try adjusting your search or browse all languages
                </p>
              </Card>
            ) : (
              filteredLanguages.map(lang => (
                <LanguageCard
                  key={lang.code}
                  lang={lang}
                  isSelected={selected === lang.code}
                  onSelect={() => setSelected(lang.code)}
                  isFavorite={favorites.includes(lang.code)}
                  onToggleFavorite={(e) => handleToggleFavorite(lang.code, e)}
                />
              ))
            )}
          </div>
        ) : (
          // Tabbed Browse
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 w-full bg-[#1E2329] p-1 rounded-xl mb-6">
              <TabsTrigger 
                value="all" 
                className="text-xs data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                All
              </TabsTrigger>
              <TabsTrigger 
                value="popular" 
                className="text-xs data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Popular
              </TabsTrigger>
              <TabsTrigger 
                value="asia" 
                className="text-xs data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Asia
              </TabsTrigger>
              <TabsTrigger 
                value="europe" 
                className="text-xs data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Europe
              </TabsTrigger>
              <TabsTrigger 
                value="americas" 
                className="text-xs data-[state=active]:bg-[#F0B90B] data-[state=active]:text-[#181A20] rounded-lg"
              >
                Americas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6 mt-0">
              {regions.map(region => (
                <RegionSection
                  key={region.id}
                  region={region}
                  languages={languages}
                  selected={selected}
                  onSelect={setSelected}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </TabsContent>

            {regions.slice(1).map(region => (
              <TabsContent key={region.id} value={region.id} className="space-y-3 mt-0">
                <RegionSection
                  region={region}
                  languages={languages}
                  selected={selected}
                  onSelect={setSelected}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Save Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#181A20] border-t border-[#2B3139] p-4 z-40">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#2B3139] flex items-center justify-center">
                  {languages.find(l => l.code === selected)?.flag || '🌐'}
                </div>
                <div>
                  <div className="text-xs text-[#848E9C]">Selected Language</div>
                  <div className="text-sm font-medium text-[#EAECEF]">
                    {languages.find(l => l.code === selected)?.label} 
                    <span className="text-[#848E9C] ml-1">
                      ({languages.find(l => l.code === selected)?.native})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            className="w-full bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20] font-bold h-12 rounded-xl text-base shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('Saving...')}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Save className="w-5 h-5" />
                {t('Save Language Preferences')}
              </div>
            )}
          </Button>
          
          <p className="text-[10px] text-[#5E6673] text-center mt-3">
            Interface language affects menus, buttons, and system messages
          </p>
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1E2329;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #2B3139;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F0B90B;
        }
        
        @media (max-width: 640px) {
          input, select, button {
            font-size: 16px !important;
          }
        }
      `}</style>
    </motion.div>
  );
}