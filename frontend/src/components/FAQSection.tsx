import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is Artificial Intelligentsia?",
    answer: "Artificial Intelligentsia is a comprehensive business intelligence platform that leverages AI to deliver competitive analysis, SEO monitoring, and automated market intelligence. We are a distinct business software platform focused exclusively on AI-powered business intelligence for commercial enterprises."
  },
  {
    question: "How does it differ from Ahrefs, SEMrush, or Moz?",
    answer: "Traditional SEO tools provide raw data requiring manual interpretation. Artificial Intelligentsia uses AI to automatically analyze competitive data, generate strategic insights, and provide real-time market intelligence. We offer comprehensive business intelligence for 17-62% less than competitors charge for basic SEO metrics."
  },
  {
    question: "What's included in the 14-day free trial?",
    answer: "Full access to all features: AI-powered competitive analysis, automated report generation, real-time market intelligence, competitor tracking, technical SEO auditing, and strategic recommendations. No credit card required, cancel anytime."
  },
  {
    question: "Why is this better value than expensive SEO tools?",
    answer: "Traditional tools like Ahrefs ($129), SEMrush ($119), and Moz ($99) only provide SEO data requiring manual analysis. We provide complete AI-powered business intelligence with automated insights for $49-99/month - delivering 10x more value with strategic recommendations."
  },
  {
    question: "How accurate is the AI analysis?",
    answer: "Our AI combines real-time data from 9 specialized DataForSEO endpoints, live web intelligence from Perplexity, and comprehensive content analysis. All recommendations include confidence scores based on current market data, not historical estimates like traditional tools."
  },
  {
    question: "Is this suitable for agencies and enterprises?",
    answer: "Absolutely! Agencies reduce research time by 80% and provide superior client reporting. Enterprises get strategic market intelligence for decision-making. Both benefit from AI-powered analysis that traditional SEO tools cannot provide."
  }
];

const FAQSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Common Questions About AI Intelligentsia
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know about our AI-powered business intelligence platform
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {faqData.map((faq, index) => (
            <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12">
          <Card className="inline-block p-6 bg-gradient-to-r from-gray-50 to-blue-50 border border-blue-200">
            <p className="text-gray-700 mb-4">
              <strong>Still have questions?</strong> Our team is here to help you understand how AI Intelligentsia can transform your business intelligence.
            </p>
            <div className="flex gap-4 justify-center">
              <span className="text-blue-600 font-semibold">📧 Contact our experts</span>
              <span className="text-blue-600 font-semibold">💬 Live chat support</span>
              <span className="text-blue-600 font-semibold">📞 Schedule a demo</span>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;