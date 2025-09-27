import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface ComparisonTool {
  name: string;
  price: string;
  features: string[];
  limitations: string[];
}

interface OurSolution {
  name: string;
  price: string;
  features: string[];
  advantages: string[];
  savings?: string;
  valueProposition?: string;
}

interface ComparisonRow {
  competitor: ComparisonTool;
  ourSolution: OurSolution;
}

const comparisonData: ComparisonRow[] = [
  {
    competitor: {
      name: "Ahrefs Pro",
      price: "$129/month",
      features: ["Keyword research", "Backlink analysis", "Rank tracking", "Site auditing"],
      limitations: ["Manual analysis required", "No AI insights", "Limited automation"]
    },
    ourSolution: {
      name: "AI Intelligentsia Starter",
      price: "$49/month", 
      features: ["Everything Ahrefs offers", "AI-powered competitive intelligence", "Real-time market research", "Automated strategic insights", "Complete business intelligence"],
      advantages: ["62% cost savings", "AI automation", "Strategic recommendations"],
      savings: "62% Less!",
      valueProposition: "More features for less cost"
    }
  },
  {
    competitor: {
      name: "SEMrush Pro",
      price: "$119/month",
      features: ["Keyword tracking", "Domain analysis", "Content optimization", "Social media tracking"],
      limitations: ["Static reporting", "Limited competitive intelligence", "Manual interpretation required"]
    },
    ourSolution: {
      name: "AI Intelligentsia Growth",
      price: "$99/month",
      features: ["Everything SEMrush offers", "AI-synthesized competitor strategies", "Automated market intelligence", "Real-time competitive monitoring", "3 websites vs 1"],
      advantages: ["17% cost savings", "Enhanced automation", "Multiple website tracking"],
      savings: "17% Less!",
      valueProposition: "Better value with AI enhancement"
    }
  },
  {
    competitor: {
      name: "Moz Pro",
      price: "$99/month",
      features: ["Rank tracking", "Site crawling", "Keyword research", "Link building"],
      limitations: ["Basic reporting", "Limited AI features", "Outdated interface"]
    },
    ourSolution: {
      name: "AI Intelligentsia Growth",
      price: "$99/month",
      features: ["All Moz capabilities", "AI-powered competitive analysis", "Business intelligence insights", "Automated report generation", "Strategic growth recommendations"],
      advantages: ["Same price", "10x more value", "Modern AI-powered interface"],
      savings: "10x More Value!",
      valueProposition: "Revolutionary upgrade at same cost"
    }
  },
  {
    competitor: {
      name: "SurferSEO Pro",
      price: "$89/month",
      features: ["Content editor", "SERP analyzer", "Keyword research", "Content audit"],
      limitations: ["Content focus only", "Limited business intelligence", "No competitive analysis"]
    },
    ourSolution: {
      name: "AI Intelligentsia",
      price: "$49-99/month",
      features: ["Advanced content analysis", "AI-powered content strategy", "Competitive content intelligence", "Complete business intelligence", "Beyond content optimization"],
      advantages: ["Better value range", "Comprehensive solution", "AI-driven insights"],
      valueProposition: "Complete business intelligence solution"
    }
  }
];

const ComparisonSection = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose AI Intelligentsia Over Expensive SEO Tools?
          </h2>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Traditional SEO tools like Ahrefs, SEMrush, Moz, and SurferSEO charge premium prices for basic search metrics. 
            AI Intelligentsia provides comprehensive AI-powered business intelligence for better value.
          </p>
        </div>

        {/* Comparison Cards Grid */}
        <div className="grid gap-8 mb-16">
          {comparisonData.map((comparison, index) => (
            <Card key={index} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                {/* Competitor Side */}
                <div className="p-6 bg-red-50/30">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl text-red-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      {comparison.competitor.name}
                    </CardTitle>
                    <CardDescription className="text-2xl font-bold text-red-600">
                      {comparison.competitor.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Features:</h4>
                        <ul className="space-y-1">
                          {comparison.competitor.features.map((feature, i) => (
                            <li key={i} className="text-gray-600 flex items-center gap-2">
                              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">Limitations:</h4>
                        <ul className="space-y-1">
                          {comparison.competitor.limitations.map((limitation, i) => (
                            <li key={i} className="text-red-500 flex items-center gap-2 italic">
                              <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                              {limitation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Our Solution Side */}
                <div className="p-6 bg-blue-50/30">
                  <CardHeader className="p-0 mb-4">
                    <CardTitle className="text-xl text-blue-700 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                      {comparison.ourSolution.name}
                    </CardTitle>
                    <CardDescription className="text-2xl font-bold text-blue-600 flex items-center gap-3">
                      {comparison.ourSolution.price}
                      {comparison.ourSolution.savings && (
                        <Badge variant="success" className="text-xs">
                          {comparison.ourSolution.savings}
                        </Badge>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Enhanced Features:</h4>
                        <ul className="space-y-1">
                          {comparison.ourSolution.features.map((feature, i) => (
                            <li key={i} className="text-green-600 flex items-center gap-2 font-medium">
                              <span className="text-green-500">✅</span>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-600 mb-2">Key Advantages:</h4>
                        <div className="flex flex-wrap gap-2">
                          {comparison.ourSolution.advantages.map((advantage, i) => (
                            <Badge key={i} variant="default" className="bg-blue-100 text-blue-800">
                              {advantage}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {comparison.ourSolution.valueProposition && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg border-l-4 border-blue-500">
                          <p className="text-blue-800 font-semibold">
                            💡 {comparison.ourSolution.valueProposition}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary Table */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">Quick Comparison Overview</CardTitle>
            <CardDescription>See how AI Intelligentsia stacks up against the competition</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Tool</TableHead>
                  <TableHead className="font-bold">Price</TableHead>
                  <TableHead className="font-bold">AI Features</TableHead>
                  <TableHead className="font-bold">Business Intelligence</TableHead>
                  <TableHead className="font-bold">Automation</TableHead>
                  <TableHead className="font-bold">Value Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Ahrefs Pro</TableCell>
                  <TableCell className="text-red-600 font-semibold">$129/month</TableCell>
                  <TableCell><Badge variant="destructive">None</Badge></TableCell>
                  <TableCell><Badge variant="secondary">Limited</Badge></TableCell>
                  <TableCell><Badge variant="secondary">Manual</Badge></TableCell>
                  <TableCell>⭐⭐⭐</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SEMrush Pro</TableCell>
                  <TableCell className="text-red-600 font-semibold">$119/month</TableCell>
                  <TableCell><Badge variant="destructive">Basic</Badge></TableCell>
                  <TableCell><Badge variant="secondary">Limited</Badge></TableCell>
                  <TableCell><Badge variant="warning">Partial</Badge></TableCell>
                  <TableCell>⭐⭐⭐</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Moz Pro</TableCell>
                  <TableCell className="text-red-600 font-semibold">$99/month</TableCell>
                  <TableCell><Badge variant="destructive">None</Badge></TableCell>
                  <TableCell><Badge variant="secondary">Basic</Badge></TableCell>
                  <TableCell><Badge variant="secondary">Manual</Badge></TableCell>
                  <TableCell>⭐⭐</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">SurferSEO Pro</TableCell>
                  <TableCell className="text-orange-600 font-semibold">$89/month</TableCell>
                  <TableCell><Badge variant="warning">Content Only</Badge></TableCell>
                  <TableCell><Badge variant="destructive">None</Badge></TableCell>
                  <TableCell><Badge variant="warning">Content Only</Badge></TableCell>
                  <TableCell>⭐⭐</TableCell>
                </TableRow>
                <TableRow className="bg-blue-50">
                  <TableCell className="font-bold text-blue-700">AI Intelligentsia</TableCell>
                  <TableCell className="text-green-600 font-bold">$49-99/month</TableCell>
                  <TableCell><Badge variant="success">Advanced AI</Badge></TableCell>
                  <TableCell><Badge variant="success">Complete Suite</Badge></TableCell>
                  <TableCell><Badge variant="success">Full Automation</Badge></TableCell>
                  <TableCell>⭐⭐⭐⭐⭐</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="inline-block p-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Upgrade Your SEO Strategy?</h3>
            <p className="text-blue-100 mb-6">
              Join thousands of marketers who've switched to AI-powered intelligence
            </p>
            <div className="flex gap-4 justify-center">
              <Badge variant="secondary" className="bg-white/20 text-white">
                14-day free trial
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                No credit card required
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Cancel anytime
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;