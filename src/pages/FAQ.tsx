import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  lastUpdated: string;
}

const categories = [
  'Getting Started',
  'Account Management',
  'Trading & Orders',
  'Deposits & Withdrawals',
  'Security & Verification',
  'Fees & Limits',
  'Technical Issues',
  'Legal & Compliance',
];

export default function FAQ() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [faqData, setFaqData] = useState<Record<string, FAQItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/src/pages/faqData.json')
      .then(res => res.json())
      .then(data => {
        setFaqData(data);
        setLoading(false);
      });
  }, []);

  const filteredFaqs = (faqData[activeCategory] || []).filter(
    (faq) =>
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#181A20] text-white flex flex-col">
      <div className="p-4 border-b border-[#23262F]">
        <h1 className="text-2xl font-bold mb-2">{t('FAQ')}</h1>
        <Input
          placeholder={t('Search FAQs...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-xl bg-[#23262F] border-none text-white placeholder:text-[#888]"
        />
      </div>
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="px-4 pt-4">
        <TabsList className="flex flex-wrap gap-2 bg-transparent">
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="rounded-full px-4 py-2 text-sm font-semibold bg-[#23262F] text-white data-[state=active]:bg-[#F0B90B] data-[state=active]:text-black">
              {t(cat)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="text-center text-gray-400">{t('Loading...')}</div>
        ) : (
          <Accordion type="single" collapsible>
            {filteredFaqs.map(faq => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-lg font-medium">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-[#ccc]">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        {/* Placeholder for future features: helpful voting, related questions, contact support */}
      </div>
    </div>
  );
} 