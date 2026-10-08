import { useState, useEffect, useCallback } from 'react';
import { MM_LANG, TRANS_CACHE_KEY, FALLBACK } from '../utils/constants';

function loadCache() {
  try { return JSON.parse(localStorage.getItem(TRANS_CACHE_KEY) || '{}'); }
  catch(e){ return {}; }
}

function saveCache(cache) {
  try { localStorage.setItem(TRANS_CACHE_KEY, JSON.stringify(cache)); } catch(e){}
}

export function useTranslation(currentLang) {
  const [transCache, setTransCache] = useState(loadCache);
  const [isLoading, setIsLoading] = useState(false);

  const translateOne = useCallback(async (text, targetLang) => {
    if (!text || targetLang === 'VI') return text;
    const target = MM_LANG[targetLang] || targetLang.toLowerCase();
    const cacheKey = `${target}::${text}`;

    if (transCache[cacheKey]) return transCache[cacheKey];

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=vi|${target}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const translated = data?.responseData?.translatedText || text;
      if (/MYMEMORY WARNING/i.test(translated)) return text;

      setTransCache(prev => {
        const next = { ...prev, [cacheKey]: translated };
        saveCache(next);
        return next;
      });
      return translated;
    } catch(e){
      return text;
    }
  }, [transCache]);

  const translateBatch = useCallback(async (texts, targetLang) => {
    if (targetLang === 'VI') return texts;
    return Promise.all(texts.map(txt => translateOne(txt, targetLang)));
  }, [translateOne]);

  const getPoiText = useCallback((p) => {
    if (currentLang === 'VI') {
      return { name:p.name, tag:p.tag, desc:p.desc, dist:p.dist, hours:p.hours, price:p.price, addr:p.addr };
    }
    const target = MM_LANG[currentLang];
    const pick = (field) => transCache[`${target}::${p[field]}`] || p[field];
    return {
      name: pick('name'),
      tag: pick('tag'),
      desc: pick('desc'),
      dist: pick('dist'),
      hours: p.hours,
      price: p.price,
      addr: pick('addr')
    };
  }, [currentLang, transCache]);

  const translateAllPois = useCallback(async (pois) => {
    if (currentLang === 'VI') return;

    setIsLoading(true);
    const texts = [];
    const target = MM_LANG[currentLang];

    pois.forEach(p => {
      ['name','tag','desc','addr'].forEach(f => {
        const cacheKey = `${target}::${p[f]}`;
        if (!transCache[cacheKey]) texts.push(p[f]);
      });
    });

    const BATCH = 8;
    for (let i = 0; i < texts.length; i += BATCH) {
      const chunk = texts.slice(i, i + BATCH);
      await translateBatch(chunk, currentLang);
    }
    setIsLoading(false);
  }, [currentLang, transCache, translateBatch]);

  return { transCache, getPoiText, translateAllPois, isLoading };
}