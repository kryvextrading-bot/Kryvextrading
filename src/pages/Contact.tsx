import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Support',
    value: 'support@swan-ira.com',
    description: 'Get help with your account or trading questions'
  },
  {
    icon: Phone,
    title: 'Phone Support',
    value: '+1 (800) 555-0123',
    description: 'Speak with our IRA specialists directly'
  },
  {
    icon: MapPin,
    title: 'Office Address',
    value: '123 Financial District, New York, NY 10001',
    description: 'Visit our headquarters in Manhattan'
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: '24/7 Available',
    description: 'Round-the-clock customer support'
  }
];

const faqs = [
  {
    question: 'How do I open a crypto IRA account?',
    answer: 'Opening a crypto IRA account is simple. Click "Get Started" on our homepage, complete the registration form, and our team will guide you through the verification process.'
  },
  {
    question: 'What cryptocurrencies can I invest in?',
    answer: 'We offer a wide range of cryptocurrencies including Bitcoin, Ethereum, and many other major digital assets. Our platform is constantly adding new options.'
  },
  {
    question: 'Is my investment secure?',
    answer: 'Yes, we use institutional-grade security measures including cold storage, insurance coverage, and regulatory compliance to protect your assets.'
  },
  {
    question: 'What are the fees?',
    answer: 'We offer competitive, transparent pricing. There are no hidden fees, and you can view our complete fee schedule in your account dashboard.'
  }
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contact form submission
    alert('Thank you for your message. We\'ll get back to you soon!');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Have questions about your crypto IRA? Our team is here to help you every step of the way.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info) => {
              const Icon = info.icon;
              return (
                <Card key={info.title} className="p-6 bg-gradient-card hover:shadow-card transition-all duration-300 text-center">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                  <p className="text-primary font-medium mb-2">{info.value}</p>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form and FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card className="p-8 bg-gradient-card">
              <div className="flex items-center space-x-3 mb-6">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-bold">Send us a Message</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="account">Account Questions</SelectItem>
                      <SelectItem value="trading">Trading Support</SelectItem>
                      <SelectItem value="technical">Technical Issues</SelectItem>
                      <SelectItem value="billing">Billing & Fees</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" variant="gradient" className="w-full" size="lg">
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </form>
            </Card>

            {/* FAQ Section */}
            <div>
              <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <Card key={index} className="p-6 bg-gradient-card">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Location */}
      <section className="py-20 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Visit Our Office</h2>
            <p className="text-xl text-muted-foreground">
              Located in the heart of New York's Financial District
            </p>
          </div>
          
          <Card className="p-8 bg-gradient-card max-w-2xl mx-auto">
            <div className="text-center space-y-4">
              <MapPin className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Swan IRA Headquarters</h3>
              <p className="text-muted-foreground">
                123 Financial District<br />
                New York, NY 10001<br />
                United States
              </p>
              <div className="pt-4">
                <Button variant="outline">
                  <MapPin className="mr-2 h-4 w-4" />
                  Get Directions
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
} 