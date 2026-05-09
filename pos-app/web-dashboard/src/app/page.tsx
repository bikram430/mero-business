'use client';
import { useState, useEffect, useRef } from 'react';

/* ── SVG Icons ── */
const Ic = {
  Currency: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg>,
  Receipt:  () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/></svg>,
  Book:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="10" x2="16" y2="10"/></svg>,
  Star:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Scan:     () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  Ledger:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  Chart:    () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  MapPin:   () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Check:    () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X:        () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ArrowR:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

const FEATURE_ICON: Record<string, () => JSX.Element> = {
  pos: Ic.Scan, khata: Ic.Ledger, analytics: Ic.Chart, discover: Ic.MapPin,
};


/* ── Feature abstract visuals ── */
function FeatureVisual({ id, color }: { id: string; color: string }) {
  if (id === 'pos') return (
    <svg viewBox="0 0 120 140" width="120" height="140" fill="none">
      <rect x="10" y="10" width="100" height="120" rx="10" stroke={color} strokeWidth="2" opacity="0.3"/>
      <rect x="20" y="24" width="80" height="12" rx="4" fill={color} opacity="0.6"/>
      {[44,60,76,92].map((y,i) => <rect key={i} x="20" y={y} width={[70,55,80,45][i]} height="8" rx="3" fill={color} opacity={0.25+i*0.05}/>)}
      <rect x="20" y="108" width="80" height="14" rx="5" fill={color} opacity="0.8"/>
    </svg>
  );
  if (id === 'khata') return (
    <svg viewBox="0 0 120 140" width="120" height="140" fill="none">
      {[0,1,2,3,4].map(row => [0,1,2].map(col => (
        <rect key={`${row}-${col}`} x={10+col*38} y={16+row*24} width="32" height="16" rx="4"
          fill={color} opacity={row===0 ? 0.7 : col===2 && row>0 ? (row<3?0.6:0.2) : 0.2}/>
      )))}
    </svg>
  );
  if (id === 'analytics') return (
    <svg viewBox="0 0 120 140" width="120" height="140" fill="none">
      <line x1="15" y1="125" x2="115" y2="125" stroke={color} strokeWidth="1.5" opacity="0.3"/>
      {[40,70,50,90,65,110,80].map((h,i) => (
        <rect key={i} x={15+i*15} y={125-h} width="11" height={h} rx="4"
          fill={color} opacity={0.3+i*0.08}/>
      ))}
      <polyline points="20,85 35,55 50,75 65,35 80,60 95,20 110,45"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 120 140" width="120" height="140" fill="none">
      <circle cx="60" cy="65" r="45" stroke={color} strokeWidth="1.5" opacity="0.15"/>
      <circle cx="60" cy="65" r="30" stroke={color} strokeWidth="1.5" opacity="0.25"/>
      <circle cx="60" cy="65" r="15" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      <circle cx="60" cy="65" r="6" fill={color} opacity="0.8"/>
      <line x1="60" y1="20" x2="60" y2="60" stroke={color} strokeWidth="2" opacity="0.6"/>
      <polygon points="60,16 63,24 57,24" fill={color} opacity="0.8"/>
    </svg>
  );
}

/* ── Content ── */
const CONTENT = {
  en: {
    navLinks: ['Features', 'Pricing', 'Growth'],
    merchantLogin: 'Merchant Login',
    customer: 'Customer',
    heroBadge: 'Built for Nepal · Works Offline · Free to Start',
    heroTitle: "Nepal's smartest",
    heroTitleHighlight: 'POS & receipt platform',
    heroSub: '800,000 small businesses. Zero digital receipts. One solution. Bill, track Khata, and know your profit — all in one app.',
    heroCta: 'Start Free — Merchant',
    heroCtaSecondary: 'Browse Stores',
    heroCards: [
      { icon: 'currency', label: "Today's Sales", value: 'Rs 4,850' },
      { icon: 'receipt',  label: 'Transactions',  value: '23 sales' },
      { icon: 'book',     label: 'Khata Due',      value: 'Rs 1,200' },
      { icon: 'star',     label: 'Store Rating',   value: '4.8 / 5'  },
    ],
    statsBadge: 'The Numbers',
    stats: [
      { value: 800000, suffix: '+', label: 'Small businesses in Nepal with no digital POS' },
      { value: 15, suffix: 'B+', prefix: 'Rs ', label: 'Estimated uncollected Khata/credit yearly' },
      { value: 2, suffix: ' min', label: 'Time to set up your first product and make a sale' },
      { value: 15000, suffix: '/mo', prefix: 'Rs ', label: 'What competitors charge — we charge Rs 2–5 per sale' },
    ],
    problemBadge: 'The Problem',
    problemTitle: "Nepal's small businesses are flying blind",
    problems: [
      { stat: '90%',     bar: 90,  desc: "of Nepal's small vendors issue zero receipts — no proof of purchase for customers" },
      { stat: 'Rs 15B+', bar: 75,  desc: 'estimated unrecovered credit (Khata) yearly because paper ledgers get lost' },
      { stat: '800K+',   bar: 85,  desc: 'small businesses with zero financial visibility — no P&L, no tax records' },
      { stat: '14 hrs',  bar: 60,  desc: 'average daily load shedding — existing POS systems fail completely without power' },
    ],
    featuresBadge: 'Features',
    featuresTitle: 'Everything your business needs',
    features: [
      { id: 'pos',       label: 'Smart POS',    title: 'Complete a sale in under 10 seconds', desc: 'Add products, scan barcodes, set quantities — done. Works on any Android phone, even an entry-level one.', points: ['Barcode scanner built-in', 'eSewa & Fonepay QR payment', 'Offline mode — works during load shedding', 'Receipt auto-sends via WhatsApp'], color: '#2563EB' },
      { id: 'khata',     label: 'Khata / Credit', title: 'Digital credit ledger — no more paper', desc: 'Track who owes what, automatically. Set due dates, send WhatsApp reminders, and watch your collection rate improve.', points: ['Track credit by customer phone number', 'Auto WhatsApp reminder before due date', 'Partial payment support', 'Rs 15B+ uncollected Khata in Nepal — solved'], color: '#D97706' },
      { id: 'analytics', label: 'P&L Reports',  title: 'Know your profit every single day', desc: 'See exactly how much you made today. Cash vs digital. Compare week-over-week. No accountant needed.', points: ['Daily, weekly, monthly breakdown', 'Cash vs Digital vs Khata split', '7-day sales chart', 'VAT-ready reports (coming soon)'], color: '#7C3AED' },
      { id: 'discover',  label: 'Store Discovery', title: 'Customers find and order from your store', desc: 'Customers discover your shop nearby, browse your products, see your offers, and place Click & Collect orders.', points: ['Location-based store discovery', 'Full product catalog browsing', 'Click & Collect orders', 'Store ratings & reviews'], color: '#16A34A' },
    ],
    howBadge: 'How It Works',
    howTitle: 'Start selling digitally in 3 steps',
    steps: [
      { step: '01', title: 'Register your shop', desc: 'Add your store name and phone number. Takes 2 minutes — no paperwork, no office visit.' },
      { step: '02', title: 'Add your products',  desc: 'Type or barcode-scan your products and prices. Your catalog is ready instantly.' },
      { step: '03', title: 'Start selling',       desc: 'Make a sale. Customer pays via cash, eSewa, or Fonepay. Receipt auto-sends on WhatsApp.' },
    ],
    growthBadge: 'Growth',
    growthTitle: 'Year 1 Revenue Projection',
    growthSub: 'Break-even at Month 2 · Rs 10.8 lakh/month by December',
    milestones: [
      { label: 'Break-even',     value: 'Month 2',   color: '#16A34A' },
      { label: 'Khata goes live',value: 'Month 9',   color: '#D97706' },
      { label: 'Year 1 profit',  value: 'Rs 58.8L',  color: '#2563EB' },
      { label: 'Target merchants',value: '209 by Dec',color: '#7C3AED' },
    ],
    pricingBadge: 'Pricing',
    pricingTitle: 'Pay only when you earn',
    pricingSub: 'No monthly subscription. No setup fee. Just Rs 2–5 per transaction.',
    plans: [
      { name: 'Big POS Systems', price: 'Rs 15,000/mo', features: ['Complex setup required', 'Monthly fee on slow days', 'No Nepal payment support', 'Fails during load shedding'], isMero: false },
      { name: 'Mero Business',   price: 'Rs 2–5 / sale', features: ['Ready in 5 minutes', 'Pay only when you earn', 'eSewa + Fonepay built-in', 'Works offline always'], isMero: true },
      { name: 'Paper / Excel',   price: 'Free but costly', features: ['Receipts get lost', 'Manual entry errors', 'No customer tracking', 'Zero financial visibility'], isMero: false },
    ],
    partnersBadge: "Integrated with Nepal's payment ecosystem",
    partners: ['eSewa', 'Fonepay', 'Khalti', 'WhatsApp', 'Sparrow SMS', 'Claude AI'],
    partnerColors: ['#16A34A', '#2563EB', '#7C3AED', '#16A34A', '#D97706', '#374151'],
    loopBadge: 'Growth Loop',
    loopTitle: 'Every receipt is a free advertisement',
    loop: [
      { title: 'Merchant uses Mero Business', desc: 'Makes sales, issues digital receipts instantly' },
      { title: 'Customer receives WhatsApp receipt', desc: 'Clean, branded receipt on their phone' },
      { title: 'Sees the Mero Business brand', desc: '"Get receipts from all shops — download Mero Business"' },
      { title: 'Customer downloads the app', desc: 'Browses stores, places orders, tracks receipts' },
      { title: 'Asks other shops', desc: '"Do you use Mero Business?"' },
      { title: 'New merchant signs up', desc: 'Loop completes — network grows organically' },
    ],
    ctaTitle: 'Ready to take your business digital?',
    ctaSub: 'Start free. No setup fee. No monthly subscription. Just Rs 2–5 per sale.',
    ctaMerchant: 'Merchant — Register Free',
    ctaCustomer: 'Customer — Join Free',
    ctaFeatures: ['No credit card needed', 'Works on any Android', 'Offline mode included', 'Cancel anytime'],
    footerTagline: "Nepal's Digital POS & Receipt Platform",
    footerBuilt: 'Built with care for Nepal\'s small businesses',
    footerCols: [
      { title: 'Product', links: [{ label: 'Merchant Register', href: '/register' }, { label: 'Merchant Login', href: '/login' }, { label: 'Browse Stores', href: '/shop' }, { label: 'Customer Login', href: '/customer/login' }] },
      { title: 'Company', links: [{ label: 'Features', href: '#features' }, { label: 'Pricing', href: '#pricing' }, { label: 'Growth', href: '#growth' }] },
      { title: 'Contact', links: [{ label: 'hello@merobusiness.com.np', href: '#' }, { label: 'Kathmandu, Nepal', href: '#' }] },
    ],
    copyright: '© 2025 Mero Business. All rights reserved.',
    madeIn: 'Made in Nepal',
  },

  ne: {
    navLinks: ['विशेषताहरू', 'मूल्य', 'वृद्धि'],
    merchantLogin: 'व्यापारी लगइन',
    customer: 'ग्राहक',
    heroBadge: 'नेपालको लागि बनेको · अफलाइनमा काम गर्छ · सुरु निःशुल्क',
    heroTitle: 'नेपालको सबैभन्दा स्मार्ट',
    heroTitleHighlight: 'POS र रसिद प्लेटफर्म',
    heroSub: '८ लाख साना व्यवसाय। शून्य डिजिटल रसिद। एउटै समाधान। बिल बनाउनु, खाता ट्र्याक गर्नु, र नाफा थाहा पाउनु — सब एउटै एपमा।',
    heroCta: 'निःशुल्क सुरु गर्नुस् — व्यापारी',
    heroCtaSecondary: 'पसलहरू हेर्नुस्',
    heroCards: [
      { icon: 'currency', label: 'आजको बिक्री',  value: 'रु ४,८५०'  },
      { icon: 'receipt',  label: 'कारोबार',       value: '२३ बिक्री' },
      { icon: 'book',     label: 'खाता बाँकी',    value: 'रु १,२००' },
      { icon: 'star',     label: 'पसल रेटिङ',     value: '४.८ / ५'  },
    ],
    statsBadge: 'तथ्याङ्क',
    stats: [
      { value: 800000, suffix: '+',       label: 'नेपालमा डिजिटल POS नभएका साना व्यवसाय' },
      { value: 15,     suffix: 'B+', prefix: 'रु ', label: 'वार्षिक उठाउन नसकिएको खाता/उधारो अनुमान' },
      { value: 2,      suffix: ' मिनेट', label: 'पहिलो उत्पादन थपेर बिक्री गर्न लाग्ने समय' },
      { value: 15000,  suffix: '/महिना', prefix: 'रु ', label: 'प्रतिस्पर्धीहरूको शुल्क — हामी प्रति बिक्री रु २–५ लिन्छौं' },
    ],
    problemBadge: 'समस्या',
    problemTitle: 'नेपालका साना व्यवसाय अँध्यारोमा हिँडिरहेका छन्',
    problems: [
      { stat: '९०%',       bar: 90, desc: 'नेपालका साना व्यापारीहरूले शून्य रसिद दिन्छन् — ग्राहकसँग खरिदको प्रमाण छैन' },
      { stat: 'रु १५B+',   bar: 75, desc: 'कागजी खाता हराएका कारण वार्षिक उठाउन नसकिएको उधारो अनुमान' },
      { stat: '८ लाख+',   bar: 85, desc: 'शून्य आर्थिक दृश्यता भएका साना व्यवसाय — P&L छैन, कर रेकर्ड छैन' },
      { stat: '१४ घण्टा', bar: 60, desc: 'औसत दैनिक लोडसेडिङ — अवस्थित POS प्रणालीहरू बिजुली नभई पूर्ण असफल हुन्छन्' },
    ],
    featuresBadge: 'विशेषताहरू',
    featuresTitle: 'तपाईंको व्यवसायलाई चाहिने सबै कुरा',
    features: [
      { id: 'pos',       label: 'स्मार्ट POS',         title: '१० सेकेन्डमा बिक्री पूरा गर्नुस्', desc: 'उत्पादन थप्नुस्, बारकोड स्क्यान गर्नुस्, मात्रा सेट गर्नुस् — सकियो।', points: ['बारकोड स्क्यानर अन्तर्निर्मित', 'eSewa र Fonepay QR भुक्तानी', 'अफलाइन मोड — लोडसेडिङमा पनि', 'WhatsApp मा रसिद स्वचालित पठाउँछ'], color: '#2563EB' },
      { id: 'khata',     label: 'खाता / उधारो',        title: 'डिजिटल खाता — कागजी बहीखाता हटाउनुस्', desc: 'कसले कति बाँकी छ, स्वचालित ट्र्याक गर्नुस्। WhatsApp रिमाइन्डर पठाउनुस्।', points: ['ग्राहकको फोन नम्बरद्वारा उधारो', 'स्वचालित WhatsApp रिमाइन्डर', 'आंशिक भुक्तानी समर्थन', 'रु १५B+ खाता — समाधान'], color: '#D97706' },
      { id: 'analytics', label: 'नाफा/नोक्सान रिपोर्ट', title: 'हरेक दिन आफ्नो नाफा थाहा पाउनुस्', desc: 'आज ठ्याक्कै कति कमाइयो हेर्नुस्। नगद बनाम डिजिटल। हप्ता-दर-हप्ता तुलना।', points: ['दैनिक, साप्ताहिक, मासिक विश्लेषण', 'नगद बनाम डिजिटल बनाम खाता', '७ दिनको बिक्री चार्ट', 'VAT-तयार रिपोर्ट (आउँदैछ)'], color: '#7C3AED' },
      { id: 'discover',  label: 'पसल खोज',             title: 'ग्राहकहरूले तपाईंको पसल फेला पार्छन्', desc: 'ग्राहकहरूले नजिकैको पसल पत्ता लगाउँछन्, उत्पादनहरू हेर्छन्, अर्डर गर्छन्।', points: ['स्थान-आधारित पसल खोज', 'पूर्ण उत्पादन सूची', 'Click & Collect अर्डर', 'पसल रेटिङ र समीक्षाहरू'], color: '#16A34A' },
    ],
    howBadge: 'कसरी काम गर्छ',
    howTitle: '३ चरणमा डिजिटल बिक्री सुरु गर्नुस्',
    steps: [
      { step: '०१', title: 'आफ्नो पसल दर्ता गर्नुस्', desc: 'पसलको नाम र फोन नम्बर थप्नुस्। २ मिनेट — कुनै कागजात छैन।' },
      { step: '०२', title: 'उत्पादनहरू थप्नुस्',       desc: 'उत्पादन र मूल्य टाइप गर्नुस् वा बारकोड स्क्यान गर्नुस्। सूची तुरुन्तै तयार।' },
      { step: '०३', title: 'बेच्न सुरु गर्नुस्',       desc: 'बिक्री गर्नुस्। ग्राहकले नगद, eSewa, वा Fonepay मार्फत भुक्तानी गर्छ।' },
    ],
    growthBadge: 'वृद्धि',
    growthTitle: 'वर्ष १ राजस्व अनुमान',
    growthSub: 'महिना २ मा ब्रेक-इभेन · डिसेम्बरमा रु १०.८ लाख/महिना',
    milestones: [
      { label: 'ब्रेक-इभेन',   value: 'महिना २',         color: '#16A34A' },
      { label: 'खाता सुरु',    value: 'महिना ९',          color: '#D97706' },
      { label: 'वर्ष १ नाफा',  value: 'रु ५८.८L',        color: '#2563EB' },
      { label: 'लक्ष्य व्यापारी', value: 'डिसेम्बरमा २०९', color: '#7C3AED' },
    ],
    pricingBadge: 'मूल्य',
    pricingTitle: 'कमाएपछि मात्र तिर्नुस्',
    pricingSub: 'कुनै मासिक शुल्क छैन। सेटअप शुल्क छैन। प्रति कारोबार रु २–५ मात्र।',
    plans: [
      { name: 'ठूला POS प्रणाली', price: 'रु १५,०००/महिना', features: ['जटिल सेटअप', 'ढिलो दिनमा पनि मासिक शुल्क', 'नेपाली भुक्तानी छैन', 'लोडसेडिङमा असफल'], isMero: false },
      { name: 'Mero Business',    price: 'रु २–५ / बिक्री',  features: ['५ मिनेटमा तयार', 'कमाएपछि मात्र तिर्नुस्', 'eSewa + Fonepay अन्तर्निर्मित', 'सधैं अफलाइनमा काम गर्छ'], isMero: true },
      { name: 'कागज / Excel',     price: 'निःशुल्क तर महंगो', features: ['रसिदहरू हराउँछन्', 'हातले लेख्दा गल्ती', 'ग्राहक ट्र्याकिङ छैन', 'शून्य आर्थिक दृश्यता'], isMero: false },
    ],
    partnersBadge: 'नेपालको भुक्तानी इकोसिस्टमसँग एकीकृत',
    partners: ['eSewa', 'Fonepay', 'Khalti', 'WhatsApp', 'Sparrow SMS', 'Claude AI'],
    partnerColors: ['#16A34A', '#2563EB', '#7C3AED', '#16A34A', '#D97706', '#374151'],
    loopBadge: 'वृद्धि चक्र',
    loopTitle: 'हरेक रसिद एउटा निःशुल्क विज्ञापन हो',
    loop: [
      { title: 'व्यापारीले Mero Business प्रयोग गर्छ', desc: 'बिक्री गर्छ, तुरुन्त डिजिटल रसिद दिन्छ' },
      { title: 'ग्राहकले WhatsApp मा रसिद पाउँछ',      desc: 'ब्रान्डेड रसिद फोनमा' },
      { title: 'Mero Business ब्रान्ड देख्छ',          desc: '"सबै पसलबाट रसिद पाउनुस् — Mero Business डाउनलोड"' },
      { title: 'ग्राहकले एप डाउनलोड गर्छ',            desc: 'पसल हेर्छ, अर्डर गर्छ, रसिद ट्र्याक गर्छ' },
      { title: 'अन्य पसलमा सोध्छ',                    desc: '"तपाईं Mero Business प्रयोग गर्नुहुन्छ?"' },
      { title: 'नयाँ व्यापारी दर्ता हुन्छ',            desc: 'चक्र पूरा हुन्छ — नेटवर्क बढ्छ' },
    ],
    ctaTitle: 'आफ्नो व्यवसाय डिजिटल बनाउन तयार हुनुहुन्छ?',
    ctaSub: 'निःशुल्क सुरु गर्नुस्। सेटअप शुल्क छैन। मासिक सदस्यता छैन। प्रति बिक्री रु २–५ मात्र।',
    ctaMerchant: 'व्यापारी — निःशुल्क दर्ता',
    ctaCustomer: 'ग्राहक — निःशुल्क सामेल',
    ctaFeatures: ['क्रेडिट कार्ड आवश्यक छैन', 'जुनसुकै Android मा काम गर्छ', 'अफलाइन मोड समावेश', 'जुनसुकै बेला रद्द गर्नुस्'],
    footerTagline: 'नेपालको डिजिटल POS र रसिद प्लेटफर्म',
    footerBuilt: 'नेपालका साना व्यवसायको लागि बनाइएको',
    footerCols: [
      { title: 'उत्पादन', links: [{ label: 'व्यापारी दर्ता', href: '/register' }, { label: 'व्यापारी लगइन', href: '/login' }, { label: 'पसलहरू हेर्नुस्', href: '/shop' }, { label: 'ग्राहक लगइन', href: '/customer/login' }] },
      { title: 'कम्पनी', links: [{ label: 'विशेषताहरू', href: '#features' }, { label: 'मूल्य', href: '#pricing' }, { label: 'वृद्धि', href: '#growth' }] },
      { title: 'सम्पर्क', links: [{ label: 'hello@merobusiness.com.np', href: '#' }, { label: 'काठमाडौं, नेपाल', href: '#' }] },
    ],
    copyright: '© २०२५ Mero Business। सर्वाधिकार सुरक्षित।',
    madeIn: 'नेपालमा बनेको',
  },
};

type Lang = 'en' | 'ne';

/* ── Hooks ── */
function useCounter(target: number, duration = 2000, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setValue(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return value;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

/* ── Phone Mockup Screens ── */
function PhoneScreen0({ lang }: { lang: string }) {
  return (
    <div style={{ padding: '10px 12px 12px', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      <div style={{ background: 'linear-gradient(135deg,#1E40AF,#6D28D9)', borderRadius: 14, padding: '14px 14px 10px', marginBottom: 16 }}>
        <img src="/mero-business-logo-white.svg" alt="" style={{ height: 22 }} />
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 }}>{lang === 'en' ? 'Register in 2 minutes' : '२ मिनेटमा दर्ता'}</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{lang === 'en' ? 'Store Name' : 'पसलको नाम'}</div>
      <div style={{ background: '#fff', border: '1.5px solid #2563EB', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: '#111827', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ color: '#111827' }}>Sharma Grocery</span>
        <span style={{ width: 2, height: 12, background: '#2563EB', animation: 'blink 1s step-end infinite', marginLeft: 2 }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6 }}>{lang === 'en' ? 'Phone Number' : 'फोन नम्बर'}</div>
      <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: '#111827', marginBottom: 14 }}>9812345678</div>
      <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 800, textDecoration: 'none', marginBottom: 14 }}>
        {lang === 'en' ? 'Register Free' : 'निःशुल्क दर्ता'} →
      </a>
      {['No credit card', 'Works offline', 'Free forever'].map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <span style={{ fontSize: 10, color: '#6B7280' }}>{t}</span>
        </div>
      ))}
    </div>
  );
}

function PhoneScreen1({ lang }: { lang: string }) {
  const products = lang === 'en'
    ? [{ n: 'Rice 2kg', p: 'Rs 240' }, { n: 'Dal Moong 1kg', p: 'Rs 180' }, { n: 'Mustard Oil 1L', p: 'Rs 320' }]
    : [{ n: 'चामल २ केजी', p: 'रु २४०' }, { n: 'दाल १ केजी', p: 'रु १८०' }, { n: 'तेल १ लि', p: 'रु ३२०' }];
  return (
    <div style={{ padding: '10px 12px 12px', height: '100%', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>{lang === 'en' ? 'My Products' : 'मेरा उत्पादन'}</div>
        <div style={{ background: '#2563EB', color: '#fff', borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 700 }}>+ {lang === 'en' ? 'Add' : 'थप्नुस्'}</div>
      </div>
      {products.map((p, i) => (
        <div key={i} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', animation: `slideIn 0.3s ease ${i * 0.1 + 0.1}s both` }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{p.n}</div>
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{lang === 'en' ? 'In stock' : 'स्टकमा'}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#16A34A' }}>{p.p}</div>
        </div>
      ))}
      <div style={{ marginTop: 'auto', background: '#EFF6FF', borderRadius: 10, padding: '10px 12px', fontSize: 10, color: '#2563EB', fontWeight: 600 }}>
        {lang === 'en' ? 'Scan barcode to add instantly' : 'बारकोड स्क्यान गरेर तुरुन्त थप्नुस्'}
      </div>
    </div>
  );
}

function PhoneScreen2({ lang }: { lang: string }) {
  const items = lang === 'en'
    ? [{ n: 'Rice 2kg', q: 'x2', p: 'Rs 480' }, { n: 'Mustard Oil 1L', q: 'x1', p: 'Rs 320' }]
    : [{ n: 'चामल २ केजी', q: 'x2', p: 'रु ४८०' }, { n: 'तेल १ लि', q: 'x1', p: 'रु ३२०' }];
  return (
    <div style={{ padding: '10px 12px 12px', height: '100%', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 12 }}>{lang === 'en' ? 'New Sale' : 'नयाँ बिक्री'}</div>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{it.n}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{it.q}</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{it.p}</div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '8px 0', borderTop: '2px solid #E5E7EB' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#111827' }}>{lang === 'en' ? 'Total' : 'जम्मा'}</span>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#1E40AF' }}>{lang === 'en' ? 'Rs 800' : 'रु ८००'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {['eSewa', lang === 'en' ? 'Cash' : 'नगद'].map((m, i) => (
          <div key={i} style={{ flex: 1, background: i === 0 ? '#16A34A' : '#374151', color: '#fff', borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{m}</div>
        ))}
      </div>
      <div style={{ marginTop: 'auto', background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.5s ease 0.3s both' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#15803D' }}>{lang === 'en' ? 'Receipt sent on WhatsApp!' : 'WhatsApp मा रसिद पठाइयो!'}</span>
      </div>
    </div>
  );
}

function PhoneMockup({ step, lang }: { step: number; lang: string }) {
  const screens = [PhoneScreen0, PhoneScreen1, PhoneScreen2];
  const Screen = screens[step];
  return (
    <div style={{ width: 220, height: 440, borderRadius: 32, background: '#0F172A', padding: 10, boxShadow: '0 32px 80px rgba(15,23,42,0.45), 0 0 0 1px rgba(255,255,255,0.08)', position: 'relative', flexShrink: 0 }}>
      <div style={{ width: 60, height: 14, background: '#0F172A', borderRadius: '0 0 10px 10px', margin: '0 auto 2px', position: 'relative', zIndex: 2 }} />
      <div style={{ background: '#fff', borderRadius: 22, height: 'calc(100% - 16px)', overflow: 'hidden', position: 'relative' }}>
        {screens.map((S, i) => (
          <div key={i} style={{ position: 'absolute', inset: 0, transition: 'opacity 0.4s ease, transform 0.4s ease', opacity: step === i ? 1 : 0, transform: step === i ? 'translateX(0)' : i < step ? 'translateX(-20px)' : 'translateX(20px)', pointerEvents: step === i ? 'auto' : 'none' }}>
            <S lang={lang} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ item, inView }: { item: any; inView: boolean }) {
  const count = useCounter(item.value, 2200, inView);
  return (
    <div style={s.statCard}>
      <div style={s.statNumber}>{item.prefix || ''}{count.toLocaleString()}{item.suffix}</div>
      <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg,#2563EB,#7C3AED)', borderRadius: 2, margin: '10px auto 12px' }} />
      <div style={s.statLabel}>{item.label}</div>
    </div>
  );
}


/* ── Per-step detail content (bilingual) ── */
const STEP_DETAIL = {
  en: [
    {
      eyebrow: 'Step 1 — Register',
      title: 'Set up in 2 minutes',
      subtitle: 'No paperwork. No office visit. Just your name and phone number.',
      points: ['Store name + phone number only', 'Account is live in seconds', 'No credit card, no setup fee'],
      cta: 'Register Free — 2 mins',
    },
    {
      eyebrow: 'Step 2 — Products',
      title: 'Add products instantly',
      subtitle: 'Type them in or scan barcodes. Your full catalog goes live immediately.',
      points: ['Built-in barcode scanner', 'Set your own prices and stock', 'Unlimited products, always free'],
      cta: 'Add products in seconds',
    },
    {
      eyebrow: 'Step 3 — Sell',
      title: 'Start selling today',
      subtitle: 'Complete a sale in under 10 seconds. WhatsApp receipt auto-sends.',
      points: ['eSewa, Fonepay & Cash accepted', 'Digital receipt sent automatically', 'Real-time P&L — know your profit daily'],
      cta: 'Make your first sale',
    },
  ],
  ne: [
    {
      eyebrow: 'चरण १ — दर्ता',
      title: '२ मिनेटमा सेटअप',
      subtitle: 'कुनै कागजात छैन। कार्यालय जानु पर्दैन। नाम र फोन नम्बर मात्र।',
      points: ['पसलको नाम + फोन नम्बर मात्र', 'सेकेन्डमा खाता सक्रिय', 'क्रेडिट कार्ड छैन, सेटअप शुल्क छैन'],
      cta: 'निःशुल्क दर्ता — २ मिनेट',
    },
    {
      eyebrow: 'चरण २ — उत्पादन',
      title: 'उत्पादन तुरुन्त थप्नुस्',
      subtitle: 'टाइप गर्नुस् वा बारकोड स्क्यान गर्नुस्। सूची तुरुन्त तयार हुन्छ।',
      points: ['अन्तर्निर्मित बारकोड स्क्यानर', 'आफ्नै मूल्य र स्टक तोक्नुस्', 'असीमित उत्पादन, सधैं निःशुल्क'],
      cta: 'सेकेन्डमा उत्पादन थप्नुस्',
    },
    {
      eyebrow: 'चरण ३ — बिक्री',
      title: 'आज बेच्न सुरु गर्नुस्',
      subtitle: '१० सेकेन्डमा बिक्री पूरा। WhatsApp मा रसिद स्वचालित पठाउँछ।',
      points: ['eSewa, Fonepay र नगद स्वीकार', 'डिजिटल रसिद स्वचालित पठाउँछ', 'रियल-टाइम नाफा — हरेक दिन थाहा'],
      cta: 'पहिलो बिक्री गर्नुस्',
    },
  ],
};

/* ── Viral Loop orbital animation ── */
function ViralLoopViz({ items, lang, lc }: { items: { title: string; desc: string }[]; lang: string; lc: string[] }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % items.length), 2400);
    return () => clearInterval(t);
  }, [items.length]);
  const R = 162, CX = 248, CY = 218;
  const pts = items.map((_, i) => {
    const a = (i / items.length) * 2 * Math.PI - Math.PI / 2;
    return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
  });
  const da = (active / items.length) * 2 * Math.PI - Math.PI / 2;
  const dx = CX + R * Math.cos(da), dy = CY + R * Math.sin(da);
  return (
    <div className="loop-viz-r" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
      {/* Orbital SVG */}
      <div>
        <svg viewBox="0 0 496 436" style={{ width: '100%', overflow: 'visible' }}>
          {/* Outer glow ring */}
          <circle cx={CX} cy={CY} r={R+2} stroke="rgba(255,255,255,0.03)" strokeWidth="40" fill="none"/>
          {/* Orbit path */}
          <circle cx={CX} cy={CY} r={R} stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" strokeDasharray="3 5"/>
          {/* Spokes */}
          {pts.map((p, i) => (
            <line key={i} x1={p.x} y1={p.y} x2={CX} y2={CY}
              stroke={active===i ? lc[i] : 'rgba(255,255,255,0.04)'}
              strokeWidth={active===i ? 1.5 : 0.8}
              style={{ transition: 'all 0.5s' }}/>
          ))}
          {/* Arc connectors */}
          {pts.map((p, i) => {
            const n = pts[(i+1) % pts.length];
            return (
              <line key={`c${i}`} x1={p.x} y1={p.y} x2={n.x} y2={n.y}
                stroke={active===i ? lc[i] : 'rgba(255,255,255,0.06)'}
                strokeWidth={active===i ? 1.5 : 0.8}
                style={{ transition: 'all 0.5s' }}/>
            );
          })}
          {/* Center hub */}
          <circle cx={CX} cy={CY} r={58} fill="rgba(37,99,235,0.08)" stroke="rgba(37,99,235,0.15)" strokeWidth="1"/>
          <circle cx={CX} cy={CY} r={44} fill="#060B18"/>
          <text x={CX} y={CY-8} textAnchor="middle" fill="#60A5FA" fontSize="9" fontWeight="800" letterSpacing="2">MERO</text>
          <text x={CX} y={CY+8} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8" letterSpacing="1">BUSINESS</text>
          {/* Nodes */}
          {pts.map((p, i) => {
            const isA = active===i;
            return (
              <g key={i} style={{ cursor: 'pointer' }} onClick={() => setActive(i)}>
                {isA && (
                  <circle cx={p.x} cy={p.y} r={28} fill={lc[i]} opacity={0.12}>
                    <animate attributeName="r" values="24;34;24" dur="2.4s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.12;0.03;0.12" dur="2.4s" repeatCount="indefinite"/>
                  </circle>
                )}
                <circle cx={p.x} cy={p.y} r={21}
                  fill={isA ? lc[i] : '#060B18'}
                  stroke={isA ? lc[i] : 'rgba(255,255,255,0.12)'}
                  strokeWidth={1.5}
                  style={{ transition: 'fill 0.4s, stroke 0.4s' }}/>
                <text x={p.x} y={p.y+5} textAnchor="middle"
                  fill={isA ? '#fff' : 'rgba(255,255,255,0.3)'}
                  fontSize="12" fontWeight="800"
                  style={{ transition: 'fill 0.4s' }}>{i+1}</text>
              </g>
            );
          })}
          {/* Orbiting signal */}
          <circle r={7} fill={lc[active]} opacity={0.2}
            style={{ transform: `translate(${dx}px,${dy}px)`, transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}/>
          <circle r={4} fill={lc[active]}
            style={{ transform: `translate(${dx}px,${dy}px)`, transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 7px ${lc[active]})` }}/>
        </svg>
      </div>
      {/* Step panel */}
      <div>
        <div style={{ display: 'grid', gridTemplateAreas: '"s"', marginBottom: 28 }}>
          {items.map((item, i) => (
            <div key={i} style={{ gridArea: 's', opacity: active===i?1:0, transform: active===i?'translateY(0)':'translateY(14px)', transition: 'all 0.45s ease', pointerEvents: active===i?'auto':'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: lc[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#fff', flexShrink: 0 }}>{i+1}</div>
                <span style={{ fontSize: 10, color: lc[i], fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
                  {lang==='en' ? `Step ${i+1} of 6` : `चरण ${i+1} / ६`}
                </span>
              </div>
              <h3 style={{ fontSize: 'clamp(20px,2.2vw,28px)', fontWeight: 900, color: '#fff', marginBottom: 12, letterSpacing: -0.5, lineHeight: 1.2 }}>{item.title}</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.78 }}>{item.desc}</p>
            </div>
          ))}
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {items.map((_, i) => (
            <div key={i} onClick={() => setActive(i)}
              style={{ height: 4, borderRadius: 2, width: active===i?26:6, background: active===i?lc[active]:'rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'all 0.3s' }}/>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 }}>
          {lang==='en' ? 'Select any node to explore · Auto-advances every 2.4 s' : 'जुनसुकै नोड छान्नुस् · स्वचालित अगाडि बढ्छ'}
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [lang, setLang]               = useState<Lang | null>(null);
  const [activeFeature, setActiveFeature] = useState('pos');
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [activeStep, setActiveStep]   = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredLossBar, setHoveredLossBar]     = useState<number | null>(null);
  const [hoveredGrowthMonth, setHoveredGrowthMonth] = useState<number | null>(null);
  const howRef        = useRef<HTMLDivElement>(null);
  const howProgRef    = useRef(0);
  const howLockedRef  = useRef(false);
  const statsSection  = useInView(0);
  const problemSection = useInView();
  const loopSection   = useInView(0);

  useEffect(() => {
    const saved = localStorage.getItem('mb_lang') as Lang | null;
    if (saved) setLang(saved);
  }, []);

  function chooseLang(l: Lang) {
    setLang(l);
    localStorage.setItem('mb_lang', l);
  }

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Scroll-driven step progression */
  useEffect(() => {
    const onScroll = () => {
      if (!howRef.current) return;
      const rect  = howRef.current.getBoundingClientRect();
      const total = howRef.current.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      setScrollProgress(progress);
      setActiveStep(Math.min(2, Math.floor(progress * 3)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Language picker ── */
  if (!lang) {
    return (
      <div style={s.langOverlay}>
        <style>{`
          @keyframes fadeIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
          @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
          .lbtn:hover{border-color:#2563EB!important;background:#EFF6FF!important;transform:translateY(-2px)}
        `}</style>
        <div style={s.langModal}>
          <img src="/mero-business-logo.svg" alt="Mero Business" style={{ height: 44, marginBottom: 24 }} />
          <p style={{ color: '#6B7280', marginBottom: 32, fontSize: 14 }}>Nepal's Digital POS & Receipt Platform</p>
          <p style={{ fontWeight: 700, color: '#374151', marginBottom: 20, fontSize: 15 }}>
            Choose your language · भाषा छनौट गर्नुस्
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <button className="lbtn" style={s.langBtn} onClick={() => chooseLang('en')}>
              <span style={{ fontSize: 26 }}>🇬🇧</span>
              <span style={{ fontWeight: 800, fontSize: 17 }}>English</span>
            </button>
            <button className="lbtn" style={s.langBtn} onClick={() => chooseLang('ne')}>
              <span style={{ fontSize: 26 }}>🇳🇵</span>
              <span style={{ fontWeight: 800, fontSize: 17 }}>नेपाली</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const c       = CONTENT[lang];
  const feature = c.features.find(f => f.id === activeFeature)!;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes float       {0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes fadeUp      {from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes gradShift   {0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes marquee     {0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes progressBar {from{width:0}to{width:100%}}
        @keyframes slideIn     {from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn      {from{opacity:0}to{opacity:1}}
        @keyframes blink       {0%,100%{opacity:1}50%{opacity:0}}
        @keyframes scrollDot   {0%{transform:translateY(0);opacity:1}100%{transform:translateY(14px);opacity:0}}
        @keyframes pulseGlow   {0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}50%{box-shadow:0 0 0 8px rgba(37,99,235,0.12)}}
        @keyframes pulseDot    {0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.7)}}
        @keyframes menuSlide   {from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .float    {animation:float 5s ease-in-out infinite}
        .fadeUp   {animation:fadeUp 0.75s ease forwards}
        .card-hl  {transition:transform 0.25s ease,box-shadow 0.25s ease}
        .card-hl:hover{transform:translateY(-5px);box-shadow:0 16px 40px rgba(0,0,0,0.12)!important}
        .ftab     {transition:all 0.2s ease}
        .ftab:hover{background:rgba(255,255,255,0.18)!important}
        .nav-link {transition:color 0.2s}
        .nav-link:hover{color:#2563EB!important}

        /* ── Responsive ── */
        .hamburger{display:none!important}
        .hamburger-inner{display:flex;flex-direction:column;gap:5px;align-items:center;justify-content:center}
        @media (max-width:640px){
          .hide-mobile{display:none!important}
          .hamburger{display:flex!important}
          .nav-inner-r{padding:0 16px!important}
        }
        @media (max-width:768px){
          .hero-title-r{font-size:clamp(28px,8vw,44px)!important;letter-spacing:-1px!important}
          .hero-sub-r{font-size:15px!important}
          .hero-cta-row{flex-direction:column!important;align-items:center!important}
          .hero-cta-row a{width:100%!important;max-width:320px!important;justify-content:center!important}
          .section-r{padding:56px 16px!important}
          .stats-grid-r{grid-template-columns:1fr 1fr!important;border-radius:16px!important}
          .four-grid-r{grid-template-columns:1fr 1fr!important}
          .feature-panel-r{flex-direction:column!important;padding:24px 20px!important}
          .feature-visual-r{flex:unset!important;width:100%!important;align-items:center!important}
          .how-inner{flex-direction:column-reverse!important;gap:32px!important}
          .pricing-grid-r{grid-template-columns:1fr!important}
          .benefits-grid-r{grid-template-columns:1fr!important}
          .loop-grid-r{grid-template-columns:1fr 1fr!important}
          .cta-btns-r{flex-direction:column!important;align-items:center!important}
          .cta-btns-r a{width:100%!important;max-width:320px!important;justify-content:center!important}
          .cta-feats-r{flex-direction:column!important;align-items:center!important;gap:10px!important}
          .footer-inner-r{flex-direction:column!important;gap:32px!important}
          .footer-cols-r{flex-direction:column!important;gap:28px!important;justify-content:flex-start!important}
          .h2-r{font-size:clamp(22px,6vw,32px)!important}
          .ftab-r{padding:8px 14px!important;font-size:13px!important}
        }
        @media (max-width:480px){
          .stats-grid-r{grid-template-columns:1fr 1fr!important}
          .four-grid-r{grid-template-columns:1fr!important}
          .loop-grid-r{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ ...s.nav, background: navScrolled || menuOpen ? 'rgba(255,255,255,0.97)' : 'transparent', boxShadow: navScrolled || menuOpen ? '0 1px 24px rgba(0,0,0,0.08)' : 'none', backdropFilter: navScrolled || menuOpen ? 'blur(12px)' : 'none' }}>
        <div style={s.navInner} className="nav-inner-r">
          <a href="#" onClick={() => setMenuOpen(false)}>
            <img src={navScrolled || menuOpen ? '/mero-business-logo.svg' : '/mero-business-logo-white.svg'} alt="Mero Business" style={{ height: 32, display: 'block' }} />
          </a>
          <div style={s.navLinks} className="hide-mobile">
            {c.navLinks.slice(0,2).map((l, i) => (
              <a key={i} href={`#${['features','pricing'][i]}`} className="nav-link"
                style={{ ...s.navLink, color: navScrolled ? '#374151' : 'rgba(255,255,255,0.85)' }}>{l}</a>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => chooseLang(lang === 'en' ? 'ne' : 'en')}
              style={{ ...s.navBtn, background: navScrolled || menuOpen ? '#F3F4F6' : 'rgba(255,255,255,0.12)', color: navScrolled || menuOpen ? '#374151' : '#fff', border: 'none', cursor: 'pointer' }}>
              {lang === 'en' ? '🇳🇵 NE' : '🇬🇧 EN'}
            </button>
            <a href="/login" className="hide-mobile" style={{ ...s.navBtn, background: '#2563EB', color: '#fff' }}>{c.merchantLogin}</a>
            {/* Hamburger — mobile only via CSS */}
            <button className="hamburger" onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
              <div className="hamburger-inner">
                <span style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: navScrolled || menuOpen ? '#111827' : '#fff', transition: 'all 0.25s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
                <span style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: navScrolled || menuOpen ? '#111827' : '#fff', transition: 'all 0.25s', opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: 22, height: 2, borderRadius: 2, background: navScrolled || menuOpen ? '#111827' : '#fff', transition: 'all 0.25s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
              </div>
            </button>
          </div>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E5E7EB', padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 4, animation: 'menuSlide 0.2s ease' }}>
            {c.navLinks.slice(0,2).map((l, i) => (
              <a key={i} href={`#${['features','pricing'][i]}`} onClick={() => setMenuOpen(false)}
                style={{ padding: '12px 8px', color: '#374151', fontWeight: 600, fontSize: 16, textDecoration: 'none', borderBottom: '1px solid #F3F4F6' }}>{l}</a>
            ))}
            <a href="/customer/login" onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 8px', color: '#374151', fontWeight: 600, fontSize: 16, textDecoration: 'none', borderBottom: '1px solid #F3F4F6' }}>{c.customer}</a>
            <a href="/login" onClick={() => setMenuOpen(false)}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2563EB', color: '#fff', padding: '14px', borderRadius: 12, fontWeight: 800, fontSize: 16, textDecoration: 'none' }}>{c.merchantLogin}</a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section style={s.hero}>
        {/* Animated mesh background */}
        <div style={s.heroBg} />
        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px', zIndex: 0 }} />
        {/* Floating orbs */}
        <div style={{ position: 'absolute', top: '20%', right: '8%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '25%', left: '5%',  width: 200, height: 200, background: 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, transparent 70%)', borderRadius: '50%', animation: 'float 11s ease-in-out infinite 2s', zIndex: 0 }} />

        <div style={s.heroContent}>
          <div className="fadeUp" style={{ opacity: 0 }}>
            <div style={s.heroBadge}>{c.heroBadge}</div>
            <h1 style={s.heroTitle} className="hero-title-r">
              {c.heroTitle}<br />
              <span style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA,#34D399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200%', animation: 'gradShift 4s ease infinite' }}>
                {c.heroTitleHighlight}
              </span>
            </h1>
            <p style={s.heroSub} className="hero-sub-r">{c.heroSub}</p>
          </div>

          <div className="fadeUp hero-cta-row" style={{ opacity: 0, animationDelay: '0.18s', display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 28 }}>
            <a href="/register" style={s.heroCta}>
              {c.heroCta} <span style={{ display: 'inline-flex', marginLeft: 6 }}><Ic.ArrowR /></span>
            </a>
            <a href="/shop" style={s.heroCtaOutline}>{c.heroCtaSecondary}</a>
          </div>

          {/* Trust bar — professional, no emojis */}
          <div className="fadeUp" style={{ opacity: 0, animationDelay: '0.32s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 48, flexWrap: 'wrap', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 20px', maxWidth: 680, margin: '0 auto 48px' }}>
            {[
              { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, label: lang === 'en' ? 'AES-256 Encrypted' : 'AES-256 इन्क्रिप्शन' },
              { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12" y2="20"/></svg>, label: lang === 'en' ? 'Offline-Ready' : 'अफलाइन तयार' },
              { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: lang === 'en' ? 'IRD VAT Compliant' : 'IRD VAT अनुपालन' },
              { svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: lang === 'en' ? 'Live in 2 Minutes' : '२ मिनेटमा सक्रिय' },
            ].map((t, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, padding: '4px 16px', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', whiteSpace: 'nowrap' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', display: 'flex' }}>{t.svg}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>

          {/* Scroll indicator */}
          <div className="fadeUp" style={{ opacity: 0, animationDelay: '0.48s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 42, border: '2px solid rgba(255,255,255,0.2)', borderRadius: 13, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
              <div style={{ width: 4, height: 8, background: 'rgba(255,255,255,0.4)', borderRadius: 2, animation: 'scrollDot 1.6s ease-in-out infinite' }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Scroll' : 'स्क्रोल'}
            </span>
          </div>
        </div>
      </section>

      {/* ── NUMBERS — bold impact ── */}
      <section ref={statsSection.ref} style={{ background: 'linear-gradient(160deg,#060B18 0%,#0F172A 60%,#1E1B4B 100%)', padding: '80px 24px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', animation: 'pulseDot 1.5s ease-in-out infinite' }} />
            <span style={{ color: '#F87171', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'The problem Mero Business solves' : 'Mero Business ले समाधान गर्ने समस्या'}
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,38px)', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 10, letterSpacing: -1, lineHeight: 1.15 }}>
            {lang === 'en' ? "Nepal's small businesses are losing crores — without knowing it." : 'नेपालका साना व्यवसायले करोडौं गुमाइरहेछन् — थाहा नभई।'}
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.6, maxWidth: 580, margin: '0 auto 48px' }}>
            {lang === 'en'
              ? 'Real data from Nepal Rastra Bank, IRD, and FNCCI — the gap Mero Business is built to close.'
              : 'नेपाल राष्ट्र बैंक, IRD र FNCCI को वास्तविक तथ्याङ्क — Mero Business ले पूर्ण गर्ने खाली ठाउँ।'}
          </p>

          {/* Interactive Khata loss chart */}
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Uncollected Khata in Nepal — Growing Every Year' : 'नेपालमा उठाउन नसकिएको उधारो — हर वर्ष बढ्दो'}
              </span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 16px 16px' }}>
              <svg viewBox="0 0 620 190" style={{ width: '100%', display: 'block', overflow: 'visible' }}>
                {/* Grid */}
                {[[20,'1,500 Cr'],[70,'1,000 Cr'],[120,'500 Cr']].map(([y,lbl],i) => (
                  <g key={i}>
                    <line x1="72" y1={y as number} x2="600" y2={y as number} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                    <text x="68" y={(y as number)+4} textAnchor="end" fill="rgba(255,255,255,0.22)" fontSize="8">{lbl as string}</text>
                  </g>
                ))}
                <line x1="72" y1="170" x2="600" y2="170" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                {/* Bars */}
                {[
                  {year:'2018',val:800,cr:'Rs 800 Cr'},{year:'2019',val:950,cr:'Rs 950 Cr'},
                  {year:'2020',val:1100,cr:'Rs 1,100 Cr'},{year:'2021',val:1200,cr:'Rs 1,200 Cr'},
                  {year:'2022',val:1350,cr:'Rs 1,350 Cr'},{year:'2023',val:1500,cr:'Rs 1,500 Cr'},
                ].map((bar,i) => {
                  const bH = (bar.val/1500)*150;
                  const bx = 80+i*90;
                  const isH = hoveredLossBar===i;
                  return (
                    <g key={i} onMouseEnter={()=>setHoveredLossBar(i)} onMouseLeave={()=>setHoveredLossBar(null)} style={{cursor:'pointer'}}>
                      <rect x={bx} y={170-bH} width={52} height={bH} rx={4}
                        fill={isH ? '#F87171' : `rgba(239,68,68,${0.35+i*0.1})`}
                        style={{transition:'fill 0.15s'}}/>
                      {isH && <>
                        <rect x={bx-4} y={170-bH-24} width={60} height={19} rx={3} fill="#EF4444"/>
                        <text x={bx+26} y={170-bH-11} textAnchor="middle" fill="#fff" fontSize="8.5" fontWeight="700">{bar.cr}</text>
                      </>}
                      <text x={bx+26} y={183} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8.5">{bar.year}</text>
                    </g>
                  );
                })}
                {/* Trend */}
                <polyline points="106,90 196,75 286,60 376,50 466,35 556,20"
                  fill="none" stroke="#F87171" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.45"/>
              </svg>
              <p style={{ textAlign: 'center', margin: '4px 0 0', color: 'rgba(255,255,255,0.2)', fontSize: 10, fontStyle: 'italic' }}>
                {lang === 'en' ? 'Hover bars for exact figures · Source: FNCCI, Nepal Rastra Bank' : 'बारमा होभर गर्नुस् · स्रोत: FNCCI, नेपाल राष्ट्र बैंक'}
              </p>
            </div>
          </div>

          {/* Who benefits */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>
                {lang === 'en' ? 'Who benefits from Mero Business' : 'Mero Business ले कसलाई फाइदा गर्छ'}
              </span>
            </div>
            <div className="benefits-grid-r" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
              {[
                {
                  tag: lang === 'en' ? '01 — Merchants' : '०१ — व्यापारी',
                  title: lang === 'en' ? 'Business Owners' : 'व्यवसाय मालिक',
                  color: '#60A5FA',
                  points: lang === 'en'
                    ? ['Sale completed in 10 seconds', 'Khata recovered via WhatsApp reminders', 'Daily P&L — real time, no accountant', 'VAT-ready reports for IRD compliance']
                    : ['१० सेकेन्डमा बिक्री सम्पन्न', 'WhatsApp रिमाइन्डरले उधारो असुल', 'रियल-टाइम दैनिक नाफा हेर्नुस्', 'IRD VAT रिपोर्ट तयार'],
                },
                {
                  tag: lang === 'en' ? '02 — Customers' : '०२ — ग्राहक',
                  title: lang === 'en' ? 'Customers' : 'ग्राहक',
                  color: '#4ADE80',
                  points: lang === 'en'
                    ? ['Digital receipt — permanent, no paper', 'Refund proof without searching drawers', 'Order from local stores near you', 'Full purchase history in one place']
                    : ['डिजिटल रसिद — स्थायी, कागज छैन', 'दराज नखोजी फिर्ताको प्रमाण', 'नजिकका पसलबाट अर्डर', 'सबै खरिद एकै ठाउँमा'],
                },
                {
                  tag: lang === 'en' ? '03 — Government' : '०३ — सरकार',
                  title: lang === 'en' ? "Nepal's Economy" : 'नेपालको अर्थतन्त्र',
                  color: '#A78BFA',
                  points: lang === 'en'
                    ? ['8 Lakh businesses enter the tax net', 'IRD gains digital VAT visibility', 'Formal economy expands via Khata data', 'GDP contribution from informal sector tracked']
                    : ['८ लाख व्यवसाय कर दायरामा', 'IRD ले डिजिटल VAT हेर्न सक्छ', 'खाता डेटाले अर्थतन्त्र विस्तार', 'अनौपचारिक क्षेत्र पहिलो पटक नक्सांकन'],
                },
              ].map((col, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderTop: `3px solid ${col.color}`, borderRadius: '0 0 16px 16px', padding: '24px 20px', border: `1px solid rgba(255,255,255,0.06)`, borderTopColor: col.color, borderTopWidth: 3 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: col.color, opacity: 0.7, marginBottom: 10, textTransform: 'uppercase' }}>{col.tag}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 18 }}>{col.title}</div>
                  {col.points.map((pt, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={col.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{pt}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, letterSpacing: 0.3 }}>
            {lang === 'en'
              ? 'Nepal Rastra Bank 2023 · IRD Nepal · Federation of Nepalese Chambers of Commerce (FNCCI)'
              : 'नेपाल राष्ट्र बैंक २०२३ · IRD नेपाल · नेपाल उद्योग वाणिज्य महासंघ (FNCCI)'}
          </p>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section ref={problemSection.ref} style={{ ...s.section, background: '#0F172A' }} className="section-r">
        <div style={s.container}>
          <div style={{ ...s.badge, background: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}>{c.problemBadge}</div>
          <h2 style={{ ...s.h2, color: '#fff' }} className="h2-r">{c.problemTitle}</h2>
          <div style={s.fourGrid} className="four-grid-r">
            {c.problems.map((item, i) => (
              <div key={i} className="card-hl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #EF4444', borderRadius: 16, padding: '28px 22px', boxShadow: '0 2px 16px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#F87171', marginBottom: 12, lineHeight: 1, letterSpacing: -1 }}>{item.stat}</div>
                {/* Animated bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: problemSection.inView ? `${item.bar}%` : '0%', background: 'linear-gradient(90deg,#EF4444,#F97316)', borderRadius: 4, transition: `width ${0.8 + i * 0.15}s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s` }} />
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ ...s.section, background: 'linear-gradient(160deg,#1E3A8A 0%,#1E40AF 55%,#312E81 100%)' }}>
        <div style={s.container}>
          <div style={{ ...s.badge, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>{c.featuresBadge}</div>
          <h2 style={{ ...s.h2, color: '#fff' }}>{c.featuresTitle}</h2>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {c.features.map(f => {
              const FIcon = FEATURE_ICON[f.id];
              const active = activeFeature === f.id;
              return (
                <button key={f.id} className="ftab"
                  onClick={() => setActiveFeature(f.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 30, border: `1.5px solid ${active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)'}`, background: active ? 'rgba(255,255,255,0.18)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  <FIcon />{f.label}
                </button>
              );
            })}
          </div>

          {/* Feature panel */}
          <div className="feature-panel-r" style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: '36px 40px', display: 'flex', gap: 40, alignItems: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ width: 36, height: 3, borderRadius: 3, background: feature.color, marginBottom: 18 }} />
              <h3 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: -0.5 }}>{feature.title}</h3>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginBottom: 26, lineHeight: 1.75 }}>{feature.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {feature.points.map((p, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 13, color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                    <span style={{ width: 22, height: 22, borderRadius: 6, background: feature.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: 1 }}>
                      <Ic.Check />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ flex: '0 0 160px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: '28px 20px', border: `1px solid ${feature.color}33` }}>
              <FeatureVisual id={feature.id} color={feature.color} />
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS — Scroll-driven sticky ── */}
      {/* 250vh container = ~83vh scroll per step (half-page feel) */}
      <div ref={howRef} style={{ height: '180vh', position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden', background: 'linear-gradient(160deg,#EFF6FF 0%,#F5F3FF 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Full-width scroll progress bar at top */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#E2E8F0', zIndex: 10 }}>
            <div style={{ height: '100%', width: `${scrollProgress * 100}%`, background: 'linear-gradient(90deg,#2563EB,#7C3AED)', transition: 'width 0.05s linear' }} />
          </div>

          {/* Ambient orbs */}
          <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(37,99,235,0.07) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(124,58,237,0.07) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 24px' }}>

            {/* Section header — compact */}
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={s.badge}>{c.howBadge}</div>
              <h2 style={{ ...s.h2, marginBottom: 0 }} className="h2-r">{c.howTitle}</h2>
            </div>

            <div className="how-inner" style={{ display: 'flex', gap: 64, alignItems: 'center', justifyContent: 'center' }}>

              {/* ── Left: cross-fading step content ── */}
              <div style={{ flex: '1 1 300px', maxWidth: 460 }}>

                {/* Step indicator pills */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 32, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ height: 4, borderRadius: 4, flex: activeStep === i ? 5 : 1, background: i < activeStep ? '#7C3AED' : i === activeStep ? 'transparent' : '#E2E8F0', border: i === activeStep ? '1px solid #7C3AED' : 'none', transition: 'flex 0.6s cubic-bezier(0.34,1.56,0.64,1), background 0.4s ease', overflow: 'hidden', position: 'relative' }}>
                      {i === activeStep && (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#2563EB,#7C3AED)', width: `${((scrollProgress * 3) - activeStep) * 100}%`, transition: 'width 0.05s linear' }} />
                      )}
                    </div>
                  ))}
                  <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700, marginLeft: 6, whiteSpace: 'nowrap' }}>
                    {activeStep + 1} / 3
                  </span>
                </div>

                {/* All steps stacked in same grid cell — cross-fade */}
                <div style={{ display: 'grid', gridTemplateAreas: '"stack"' }}>
                  {STEP_DETAIL[lang].map((detail, i) => (
                    <div key={i} style={{ gridArea: 'stack', opacity: activeStep === i ? 1 : 0, transform: activeStep === i ? 'translateY(0px)' : activeStep < i ? 'translateY(20px)' : 'translateY(-20px)', transition: 'opacity 0.55s ease, transform 0.55s ease', pointerEvents: activeStep === i ? 'auto' : 'none' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                        {detail.eyebrow}
                      </div>
                      <h3 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#111827', marginBottom: 14, letterSpacing: -1.5, lineHeight: 1.08 }}>
                        {detail.title}
                      </h3>
                      <p style={{ fontSize: 17, color: '#64748B', marginBottom: 28, lineHeight: 1.7 }}>
                        {detail.subtitle}
                      </p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px' }}>
                        {detail.points.map((pt, j) => (
                          <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, opacity: activeStep === i ? 1 : 0, transform: activeStep === i ? 'translateX(0)' : 'translateX(-12px)', transition: `opacity 0.45s ease ${j * 0.1 + 0.25}s, transform 0.45s ease ${j * 0.1 + 0.25}s` }}>
                            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>
                              <Ic.Check />
                            </span>
                            <span style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>{pt}</span>
                          </li>
                        ))}
                      </ul>
                      <a href="/register"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'linear-gradient(135deg,#1E40AF,#6D28D9)', color: '#fff', padding: '15px 26px', borderRadius: 14, fontWeight: 800, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 24px rgba(37,99,235,0.35)', transition: 'transform 0.2s,box-shadow 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(37,99,235,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 24px rgba(37,99,235,0.35)'; }}>
                        {detail.cta} <Ic.ArrowR />
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: phone mockup ── */}
              <div style={{ flex: '0 0 auto', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', inset: -60, background: 'radial-gradient(circle,rgba(37,99,235,0.13) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', animation: 'float 6s ease-in-out infinite' }}>
                  <PhoneMockup step={activeStep} lang={lang} />
                </div>
              </div>

            </div>
          </div>

          {/* Scroll hint — fades out after user starts scrolling */}
          <div style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: scrollProgress < 0.04 ? 0.8 : 0, transition: 'opacity 0.4s ease', pointerEvents: 'none' }}>
            <div style={{ width: 26, height: 42, border: '2px solid #CBD5E1', borderRadius: 13, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
              <div style={{ width: 4, height: 8, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius: 2, animation: 'scrollDot 1.6s ease-in-out infinite' }} />
            </div>
            <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              {lang === 'en' ? 'Scroll' : 'स्क्रोल'}
            </span>
          </div>

        </div>
      </div>


      {/* ── PRICING ── */}
      <section id="pricing" style={{ ...s.section, background: '#fff' }}>
        <div style={s.container}>
          <div style={s.badge}>{c.pricingBadge}</div>
          <h2 style={s.h2}>{c.pricingTitle}</h2>
          <p style={{ color: '#6B7280', textAlign: 'center', marginBottom: 40, fontSize: 15 }}>{c.pricingSub}</p>
          <div className="pricing-grid-r" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20, maxWidth: 860, margin: '0 auto' }}>
            {c.plans.map((plan, i) => (
              <div key={i} className="card-hl" style={{ ...s.card, position: 'relative', ...(plan.isMero ? { background: 'linear-gradient(145deg,#1E40AF,#6D28D9)', border: 'none', boxShadow: '0 12px 40px rgba(37,99,235,0.3)' } : {}) }}>
                {plan.isMero && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg,#D97706,#F59E0B)', color: '#fff', padding: '4px 18px', borderRadius: 20, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
                    {lang === 'en' ? 'BEST CHOICE' : 'सर्वोत्तम विकल्प'}
                  </div>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 800, color: plan.isMero ? '#fff' : '#111827', marginBottom: 8 }}>{plan.name}</h3>
                <div style={{ fontSize: 28, fontWeight: 900, color: plan.isMero ? '#93C5FD' : '#374151', marginBottom: 20, letterSpacing: -1 }}>{plan.price}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: 14, color: plan.isMero ? 'rgba(255,255,255,0.8)' : '#6B7280' }}>
                      <span style={{ width: 20, height: 20, borderRadius: 5, background: plan.isMero ? 'rgba(255,255,255,0.2)' : (j < 2 ? '#FEE2E2' : '#F3F4F6'), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: plan.isMero ? '#fff' : '#EF4444' }}>
                        {plan.isMero ? <Ic.Check /> : <Ic.X />}
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.isMero && (
                  <a href="/register" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#1E40AF', textDecoration: 'none', textAlign: 'center', padding: '13px', borderRadius: 12, fontWeight: 800, fontSize: 15 }}>
                    {lang === 'en' ? 'Start Free Now' : 'अहिले निःशुल्क सुरु'} <Ic.ArrowR />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PARTNERS — Marquee ── */}
      <section style={{ ...s.section, background: '#F8FAFC', paddingTop: 40, paddingBottom: 40, overflow: 'hidden' }}>
        <div style={s.container}>
          <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 11, marginBottom: 24, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{c.partnersBadge}</p>
        </div>
        <div style={{ overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)' }}>
          <div style={{ display: 'flex', gap: 16, animation: 'marquee 18s linear infinite', width: 'max-content' }}>
            {[...c.partners, ...c.partners].map((name, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 30, padding: '10px 22px', border: '1.5px solid #E5E7EB', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.partnerColors[i % c.partnerColors.length] }} />
                <span style={{ fontWeight: 700, color: '#374151', fontSize: 14 }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GROWTH ── */}
      <section id="growth" style={{ background: '#060B18', padding: '88px 24px 72px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle,rgba(37,99,235,0.07) 0%,transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(124,58,237,0.06) 0%,transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ display: 'inline-block', background: 'rgba(37,99,235,0.15)', color: '#60A5FA', padding: '5px 14px', borderRadius: 30, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', border: '1px solid rgba(37,99,235,0.25)' }}>
              {lang === 'en' ? 'Business Growth' : 'व्यवसाय वृद्धि'}
            </span>
          </div>
          <h2 style={{ fontSize: 'clamp(22px,3.5vw,38px)', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 10, letterSpacing: -1, lineHeight: 1.15 }}>
            {lang === 'en' ? 'Two realities. You choose which one.' : 'दुई वास्तविकता। तपाईं छनौट गर्नुस्।'}
          </h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 48px' }}>
            {lang === 'en' ? 'The difference between a business that survives and one that scales.' : 'टिक्ने व्यवसाय र बढ्ने व्यवसायको फरक।'}
          </p>

          {/* Before / After comparison */}
          <div className="benefits-grid-r" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 56 }}>
            {/* Before */}
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#F87171', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
                {lang === 'en' ? 'Without Mero Business' : 'Mero Business बिना'}
              </div>
              {[
                [lang === 'en' ? 'Sales tracking' : 'बिक्री अभिलेख', lang === 'en' ? 'Paper notebook — lost or damaged' : 'कागजी बहीखाता — हरायो या बिग्रियो'],
                [lang === 'en' ? 'Khata recovery' : 'खाता असुल', lang === 'en' ? '~42% — rest untracked' : '~४२% — बाँकी हराउँछ'],
                [lang === 'en' ? 'Receipt issuance' : 'रसिद वितरण', lang === 'en' ? '0% digital' : '०% डिजिटल'],
                [lang === 'en' ? 'Tax visibility' : 'कर दृश्यता', lang === 'en' ? 'Invisible to IRD' : 'IRD लाई देखिँदैन'],
                [lang === 'en' ? 'Daily P&L' : 'दैनिक नाफा/नोक्सान', lang === 'en' ? 'Unknown — guesswork' : 'थाहा छैन — अनुमान'],
                [lang === 'en' ? 'Time per sale' : 'प्रति बिक्री समय', lang === 'en' ? '3–4 minutes manual' : '३–४ मिनेट हात्तले'],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid rgba(239,68,68,0.07)', gap: 12 }}>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12.5, color: '#F87171', fontWeight: 600, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* After */}
            <div style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.22)', borderRadius: 20, padding: '32px 28px' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#4ADE80', textTransform: 'uppercase', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid rgba(22,163,74,0.15)' }}>
                {lang === 'en' ? 'With Mero Business' : 'Mero Business सहित'}
              </div>
              {[
                [lang === 'en' ? 'Sales tracking' : 'बिक्री अभिलेख', lang === 'en' ? 'Real-time digital ledger' : 'रियल-टाइम डिजिटल बहीखाता'],
                [lang === 'en' ? 'Khata recovery' : 'खाता असुल', lang === 'en' ? '89% — WhatsApp reminders' : '८९% — WhatsApp रिमाइन्डर'],
                [lang === 'en' ? 'Receipt issuance' : 'रसिद वितरण', lang === 'en' ? '100% auto-sent' : '१००% स्वचालित'],
                [lang === 'en' ? 'Tax visibility' : 'कर दृश्यता', lang === 'en' ? 'IRD VAT-ready reports' : 'IRD VAT-तयार रिपोर्ट'],
                [lang === 'en' ? 'Daily P&L' : 'दैनिक नाफा/नोक्सान', lang === 'en' ? 'Live dashboard, every second' : 'लाइभ ड्यासबोर्ड, सेकेन्डमा'],
                [lang === 'en' ? 'Time per sale' : 'प्रति बिक्री समय', lang === 'en' ? '8 seconds' : '८ सेकेन्ड'],
              ].map(([label, val], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid rgba(22,163,74,0.07)', gap: 12 }}>
                  <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 12.5, color: '#4ADE80', fontWeight: 600, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3 key impact metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="benefits-grid-r">
            {[
              { title: lang === 'en' ? 'Khata Recovery Rate' : 'खाता असुल दर', before: '~42%', after: '89%', pct: 89, color: '#F87171', delta: '+47 pp' },
              { title: lang === 'en' ? 'Digital Receipt Rate' : 'डिजिटल रसिद दर', before: '0%', after: '100%', pct: 100, color: '#60A5FA', delta: '+100%' },
              { title: lang === 'en' ? 'Billing Time' : 'बिलिङ समय', before: lang === 'en' ? '3–4 min' : '३–४ मिनेट', after: lang === 'en' ? '8 seconds' : '८ सेकेन्ड', pct: 96, color: '#4ADE80', delta: lang === 'en' ? '−96% faster' : '−९६% छिटो' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '24px 20px' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14, fontWeight: 600, letterSpacing: 0.3 }}>{m.title}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1 }}>{m.after}</span>
                  <span style={{ fontSize: 11, color: m.color, fontWeight: 700, background: `${m.color}18`, padding: '2px 8px', borderRadius: 6 }}>{m.delta}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', marginBottom: 14 }}>{lang === 'en' ? 'Previously' : 'पहिले'}: {m.before}</div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${m.pct}%`, background: m.color, borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>
            {lang === 'en' ? 'Metrics from Mero Business beta cohort · Not a guarantee of results' : 'Mero Business बिटा कोहोर्टको तथ्याङ्क · परिणामको ग्यारेन्टी होइन'}
          </p>
        </div>
      </section>

      {/* ── VIRAL LOOP ── */}
      <section ref={loopSection.ref} style={{ background: 'linear-gradient(160deg,#060B18 0%,#0D1224 60%,#0F172A 100%)', padding: '88px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle,rgba(37,99,235,0.06) 0%,transparent 65%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={s.container}>
          <div style={{ ...s.badge, background: 'rgba(37,99,235,0.15)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.25)', position: 'relative', zIndex: 1 }}>{c.loopBadge}</div>
          <h2 style={{ ...s.h2, color: '#fff', marginBottom: 8, position: 'relative', zIndex: 1 }}>{c.loopTitle}</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.6, maxWidth: 500, margin: '0 auto 56px', position: 'relative', zIndex: 1 }}>
            {lang === 'en' ? 'One sale starts a chain. Zero marketing budget required.' : 'एउटा बिक्रीले शृंखला सुरु गर्छ। मार्केटिङमा खर्च शून्य।'}
          </p>
          <ViralLoopViz items={c.loop} lang={lang} lc={['#2563EB','#7C3AED','#D97706','#16A34A','#0891B2','#DC2626']} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'linear-gradient(135deg,#0F172A 0%,#1E3A8A 50%,#312E81 100%)', padding: '88px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,44px)', fontWeight: 900, color: '#fff', marginBottom: 18, letterSpacing: -1.5, lineHeight: 1.1 }}>{c.ctaTitle}</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 36, lineHeight: 1.7 }}>{c.ctaSub}</p>
          <div className="cta-btns-r" style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 30 }}>
            <a href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1E40AF', padding: '16px 30px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
              {c.ctaMerchant} <Ic.ArrowR />
            </a>
            <a href="/customer/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 30px', borderRadius: 14, fontWeight: 700, fontSize: 16, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
              {c.ctaCustomer}
            </a>
          </div>
          <div className="cta-feats-r" style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {c.ctaFeatures.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                <span style={{ color: '#34D399' }}><Ic.Check /></span> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0F172A', padding: '56px 24px 0' }}>
        <div className="footer-inner-r" style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 48, flexWrap: 'wrap', paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ minWidth: 200 }}>
            <img src="/mero-business-logo-white.svg" alt="Mero Business" style={{ height: 32, marginBottom: 14 }} />
            <p style={{ color: '#64748B', fontSize: 13, marginBottom: 6, lineHeight: 1.6 }}>{c.footerTagline}</p>
            <p style={{ color: '#475569', fontSize: 12 }}>{c.footerBuilt}</p>
          </div>
          <div className="footer-cols-r" style={{ display: 'flex', gap: 48, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {c.footerCols.map((col, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: '#94A3B8', fontWeight: 700, fontSize: 12, marginBottom: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{col.title}</div>
                {col.links.map((link, j) => (
                  <a key={j} href={link.href} style={{ color: '#64748B', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}>
                    {link.label}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 0', display: 'flex', justifyContent: 'space-between', color: '#334155', fontSize: 12, flexWrap: 'wrap', gap: 8 }}>
          <span>{c.copyright}</span>
          <span>{c.madeIn}</span>
        </div>
      </footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", color: '#111827', overflowX: 'clip' },
  langOverlay: { minHeight: '100vh', background: 'linear-gradient(135deg,#0F172A,#1E3A8A,#312E81)', backgroundSize: '200% 200%', animation: 'gradShift 8s ease infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  langModal: { background: '#fff', borderRadius: 28, padding: '48px 40px', textAlign: 'center', maxWidth: 440, width: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: 'fadeIn 0.4s ease' },
  langBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: 18, padding: '22px 30px', cursor: 'pointer', flex: 1, transition: 'all 0.2s', minWidth: 130 },
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, transition: 'all 0.3s' },
  navInner: { maxWidth: 1100, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', gap: 16 },
  navLinks: { display: 'flex', gap: 2, flex: 1 },
  navLink: { padding: '6px 12px', borderRadius: 8, textDecoration: 'none', fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap' },
  navBtn: { padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' },
  hero: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '90px 24px 56px' },
  heroBg: { position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#0F172A 0%,#1E3A8A 45%,#312E81 100%)', backgroundSize: '200% 200%', animation: 'gradShift 10s ease infinite' },
  heroContent: { position: 'relative', zIndex: 1, maxWidth: 900, width: '100%', textAlign: 'center' },
  heroBadge: { display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.85)', padding: '7px 20px', borderRadius: 30, fontSize: 12.5, fontWeight: 600, marginBottom: 26, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', letterSpacing: 0.3 },
  heroTitle: { fontSize: 'clamp(34px,6vw,72px)', fontWeight: 900, color: '#fff', margin: '0 0 22px', lineHeight: 1.08, letterSpacing: -2 },
  heroSub: { fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 36px' },
  heroCta: { display: 'inline-flex', alignItems: 'center', background: '#fff', color: '#1E40AF', padding: '16px 28px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 28px rgba(0,0,0,0.2)', gap: 6 },
  heroCtaOutline: { display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 28px', borderRadius: 14, fontWeight: 700, fontSize: 16, textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' },
  section: { padding: '80px 24px' },
  container: { maxWidth: 1100, margin: '0 auto' },
  badge: { display: 'inline-block', background: '#EFF6FF', color: '#2563EB', padding: '5px 14px', borderRadius: 30, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 },
  h2: { fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900, color: '#111827', marginBottom: 16, textAlign: 'center', letterSpacing: -1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 },
  statCard: { textAlign: 'center', padding: '32px 16px', borderRadius: 20, background: '#F8FAFC', border: '1.5px solid #E2E8F0' },
  statNumber: { fontSize: 38, fontWeight: 900, color: '#1E40AF', marginBottom: 4, letterSpacing: -1.5 },
  statLabel: { fontSize: 13, color: '#64748B', lineHeight: 1.55 },
  fourGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 40 },
  card: { background: '#fff', borderRadius: 18, padding: '24px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1.5px solid #E5E7EB', transition: 'all 0.25s', cursor: 'default' },
};
