import { useLanguage } from '@/contexts/LanguageContext';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
      className="flex items-center h-8 rounded-full border border-border bg-card overflow-hidden text-xs font-semibold shrink-0"
      aria-label="Toggle language"
    >
      <span className={`px-2.5 py-1 transition-colors ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
        EN
      </span>
      <span className={`px-2.5 py-1 transition-colors ${language === 'ur' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
        اردو
      </span>
    </button>
  );
};

export default LanguageToggle;
