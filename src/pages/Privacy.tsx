import { Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              How we collect, use, and protect your personal information.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8 bg-gradient-card">
            <div className="prose prose-invert max-w-none">
              <div className="flex items-center space-x-3 mb-8">
                <Lock className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-bold">Privacy Policy</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                <strong>Last updated:</strong> January 15, 2025
              </p>

              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-semibold mb-4">1. Information We Collect</h3>
                  <p className="text-muted-foreground mb-4">
                    We collect information you provide directly to us, such as when you create an account, complete forms, or contact us. This may include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Personal identification information (name, email address, phone number)</li>
                    <li>Financial information for account verification</li>
                    <li>Government-issued identification documents</li>
                    <li>Investment preferences and risk tolerance</li>
                    <li>Communication records and support interactions</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">2. How We Use Your Information</h3>
                  <p className="text-muted-foreground mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Provide and maintain our services</li>
                    <li>Process transactions and manage your account</li>
                    <li>Comply with legal and regulatory requirements</li>
                    <li>Prevent fraud and ensure security</li>
                    <li>Communicate with you about your account and our services</li>
                    <li>Improve our platform and develop new features</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">3. Information Sharing</h3>
                  <p className="text-muted-foreground mb-4">
                    We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>With your explicit consent</li>
                    <li>To comply with legal obligations or regulatory requirements</li>
                    <li>To protect our rights, property, or safety</li>
                    <li>With service providers who assist in our operations</li>
                    <li>In connection with a business transfer or merger</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">4. Data Security</h3>
                  <p className="text-muted-foreground mb-4">
                    We implement comprehensive security measures to protect your personal information, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>Encryption of data in transit and at rest</li>
                    <li>Multi-factor authentication</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Access controls and employee training</li>
                    <li>Compliance with industry security standards</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">5. Data Retention</h3>
                  <p className="text-muted-foreground mb-4">
                    We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. This may include retention periods required by financial regulations.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">6. Your Rights</h3>
                  <p className="text-muted-foreground mb-4">
                    You have certain rights regarding your personal information, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                    <li>The right to access and review your personal information</li>
                    <li>The right to correct inaccurate information</li>
                    <li>The right to delete your information (subject to legal requirements)</li>
                    <li>The right to restrict processing of your information</li>
                    <li>The right to data portability</li>
                    <li>The right to object to processing</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">7. Cookies and Tracking</h3>
                  <p className="text-muted-foreground mb-4">
                    We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can control cookie settings through your browser preferences.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">8. Third-Party Services</h3>
                  <p className="text-muted-foreground mb-4">
                    Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">9. Children's Privacy</h3>
                  <p className="text-muted-foreground mb-4">
                    Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will take steps to delete it.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">10. International Transfers</h3>
                  <p className="text-muted-foreground mb-4">
                    Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">11. Changes to This Policy</h3>
                  <p className="text-muted-foreground mb-4">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our platform and updating the "Last updated" date.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">12. Contact Us</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                  </p>
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      <strong>Swan IRA Privacy Team</strong><br />
                      Email: privacy@swan-ira.com<br />
                      Phone: +1 (800) 555-0123<br />
                      Address: 123 Financial District, New York, NY 10001
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Privacy Commitment */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="p-8 bg-gradient-card">
            <div className="text-center space-y-4">
              <Eye className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Our Privacy Commitment</h3>
              <p className="text-muted-foreground">
                At Swan IRA, we are committed to protecting your privacy and maintaining the confidentiality of your personal information. 
                We follow industry best practices and comply with all applicable privacy laws and regulations.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Secure • Transparent • Compliant</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
} 