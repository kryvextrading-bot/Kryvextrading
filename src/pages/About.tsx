import { Shield, TrendingUp, Users, Globe, Award, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Active Users', value: '50,000+' },
  { label: 'Assets Under Management', value: '$2.4B+' },
  { label: 'Years of Experience', value: '8+' },
  { label: 'Security Rating', value: 'A+' }
];

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'Your assets are protected by institutional-grade security measures and insurance coverage.'
  },
  {
    icon: TrendingUp,
    title: 'Innovation',
    description: 'We leverage cutting-edge technology to provide the best crypto investment experience.'
  },
  {
    icon: Users,
    title: 'Customer Focus',
    description: 'Our dedicated team is here to support you every step of your investment journey.'
  },
  {
    icon: Globe,
    title: 'Global Access',
    description: 'Trade cryptocurrencies from anywhere in the world with our mobile-first platform.'
  }
];

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    bio: 'Former Wall Street executive with 15+ years in financial services.'
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    bio: 'Blockchain expert with experience at major tech companies.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Compliance',
    bio: 'Regulatory specialist ensuring full compliance with IRA requirements.'
  }
];

export default function About() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              About Swan IRA
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              We're revolutionizing retirement investing by making cryptocurrency accessible through tax-advantaged IRA accounts.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Swan IRA was founded with a simple mission: to democratize access to cryptocurrency investments 
                through tax-advantaged retirement accounts. We believe that everyone should have the opportunity 
                to participate in the digital economy while securing their financial future.
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform combines institutional-grade security with user-friendly technology, making it easy 
                for investors to build and manage their crypto IRA portfolios with confidence.
              </p>
              <Button asChild variant="gradient" size="lg">
                <Link to="/register">
                  Get Started Today
                </Link>
              </Button>
            </div>
            
            <Card className="p-8 bg-gradient-card">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Award className="h-8 w-8 text-primary" />
                  <h3 className="text-xl font-semibold">Industry Recognition</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Best Crypto IRA Platform 2024</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Highest Security Rating</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Customer Satisfaction Award</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              These core values guide everything we do at Swan IRA.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="p-6 bg-gradient-card hover:shadow-card transition-all duration-300 text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Leadership Team</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Meet the experienced professionals behind Swan IRA.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member) => (
              <Card key={member.name} className="p-6 bg-gradient-card hover:shadow-card transition-all duration-300 text-center">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary-foreground font-bold text-xl">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-3">{member.role}</p>
                <p className="text-muted-foreground text-sm">{member.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Crypto IRA Journey?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of investors who trust Swan IRA for their cryptocurrency retirement planning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="gradient" size="lg">
              <Link to="/register">
                Open Your IRA Today
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
} 