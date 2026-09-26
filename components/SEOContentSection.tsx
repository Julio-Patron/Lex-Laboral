import React from 'react';

interface SEOContentSectionProps {
  title: string;
  intro: string;
  highlights: Array<{
    title: string;
    body: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const SEOContentSection: React.FC<SEOContentSectionProps> = ({
  title,
  intro,
  highlights,
  faqs,
}) => {
  return (
    <section className="mt-12 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 md:p-10">
      <div className="max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm md:text-base text-slate-600 leading-7">
          {intro}
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-6"
          >
            <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600 leading-6">{item.body}</p>
          </article>
        ))}
      </div>

      {faqs && faqs.length > 0 && (
        <div className="mt-12 pt-8 border-t border-slate-100">
          <h2 className="text-xl font-serif font-bold text-slate-900 mb-6">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="group rounded-2xl border border-slate-200 bg-white open:bg-slate-50/50"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-sm font-bold text-slate-900 marker:content-none select-none">
                  <span>{faq.question}</span>
                  <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform group-open:rotate-180">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed">
                  <p>{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
