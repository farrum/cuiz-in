
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Partner {
  name: string;
  logo: string;
  description: string;
  url: string;
}

const PartnershipSection: React.FC = () => {
  // This would ideally be fetched from your database
  const featuredPartners: Partner[] = [
    {
      name: "Education Weekly",
      logo: "/placeholder.svg",
      description: "Leading digital publication covering educational trends and resources",
      url: "https://example.com/education-weekly"
    },
    {
      name: "Quiz Masters Association",
      logo: "/placeholder.svg",
      description: "Community of quiz enthusiasts sharing knowledge across various fields",
      url: "https://example.com/quiz-masters"
    },
    {
      name: "Learning Hub Institute",
      logo: "/placeholder.svg", 
      description: "Educational platform offering courses and resources for lifelong learners",
      url: "https://example.com/learning-hub"
    }
  ];

  return (
    <section className="py-12 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We collaborate with leading educational platforms and content creators to bring
            you the highest quality quiz experiences and learning opportunities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {featuredPartners.map((partner, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-center mb-4">
                  <img
                    src={partner.logo}
                    alt={`Official logo of ${partner.name}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">{partner.name}</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {partner.description}
                </p>
                <div className="text-center">
                  <a 
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Visit Website 
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold mb-3">Become a Partner</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Interested in partnering with us? We're always looking for high-quality content collaborations
            that bring value to our users and partners.
          </p>
          <Button asChild>
            <Link to="/referral-program#partnerships">Learn About Our Partnership Program</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PartnershipSection;
