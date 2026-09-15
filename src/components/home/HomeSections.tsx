'use client';

import { useEffect, useState } from 'react';
import BrandsBar from './BrandsBar';

interface HomeSection {
  id: string;
  type: 'contact' | 'map' | 'reviews' | 'payment' | 'brands' | 'embed' | 'html';
  title: string;
  content: string;
  enabled: boolean;
}

function safeEmbedUrl(value: string) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function safeHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
}

export default function HomeSections() {
  const [sections, setSections] = useState<HomeSection[]>([]);

  useEffect(() => {
    fetch('/api/public/settings?keys=home_sections')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data?.home_sections) return;
        try {
          const parsed = JSON.parse(data.home_sections);
          if (Array.isArray(parsed)) setSections(parsed.filter((section: HomeSection) => section.enabled !== false));
        } catch { /* malformed setting is ignored */ }
      })
      .catch(() => {});
  }, []);

  if (!sections.length) return null;

  return (
    <section className="mx-auto max-w-[1400px] space-y-6 px-4 py-8">
      {sections.map(section => {
        const embedUrl = safeEmbedUrl(section.content);
        return (
          <article key={section.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-center text-lg font-bold uppercase tracking-wide text-[#315b91]">{section.title}</h2>
            {section.type === 'brands' ? (
              <BrandsBar />
            ) : section.type === 'payment' ? (
              section.content ? <img src={section.content} alt={section.title} className="mx-auto max-h-[180px] max-w-full rounded-xl object-contain" /> : null
            ) : section.type === 'map' || section.type === 'reviews' || section.type === 'embed' ? (
              embedUrl ? <iframe title={section.title} src={embedUrl} className="h-[280px] w-full rounded-xl border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /> : null
            ) : section.type === 'html' ? (
              <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: safeHtml(section.content) }} />
            ) : (
              <div className="whitespace-pre-line text-center text-sm text-gray-600">{section.content}</div>
            )}
          </article>
        );
      })}
    </section>
  );
}
