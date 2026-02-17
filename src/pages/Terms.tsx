import { Shield, FileText, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Please read these terms carefully before using our platform.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="p-8 bg-gradient-card">
            <div className="prose prose-invert max-w-none">
              <div className="flex items-center space-x-3 mb-8">
                <FileText className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-bold">Terms of Service</h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                <strong>Last updated:</strong> January 15, 2025
              </p>

              <div className="space-y-8">
                <section>
                  <h3 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h3>
                  <p className="text-muted-foreground mb-4">
                    By accessing and using Kryvex Trading's platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">2. Description of Service</h3>
                  <p className="text-muted-foreground mb-4">
                    Kryvex Trading provides cryptocurrency trading services, including but not limited to account management, trading capabilities, and investment advisory services. Our platform allows users to invest in cryptocurrencies with institutional-grade security and professional trading tools.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">3. Eligibility</h3>
                  <p className="text-muted-foreground mb-4">
                    To use our services, you must be at least 18 years old and a legal resident of the United States. You must also meet all applicable IRA eligibility requirements as defined by the Internal Revenue Service (IRS).
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">4. Account Registration</h3>
                  <p className="text-muted-foreground mb-4">
                    You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">5. Investment Risks</h3>
                  <p className="text-muted-foreground mb-4">
                    Cryptocurrency investments carry significant risks, including but not limited to market volatility, regulatory changes, and technological risks. Past performance does not guarantee future results. You should carefully consider your investment objectives and risks before investing.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">6. Fees and Charges</h3>
                  <p className="text-muted-foreground mb-4">
                    Kryvex Trading charges various fees for our services, including account maintenance fees, trading fees, and other applicable charges. All fees are clearly disclosed in our fee schedule and may be updated from time to time with appropriate notice.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">7. Security</h3>
                  <p className="text-muted-foreground mb-4">
                    We implement industry-standard security measures to protect your account and assets. However, no system is completely secure, and we cannot guarantee the absolute security of your information or assets.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">8. Compliance</h3>
                  <p className="text-muted-foreground mb-4">
                    Users must comply with all applicable laws and regulations, including but not limited to tax laws, securities laws, and anti-money laundering regulations. Kryvex Trading reserves the right to report suspicious activities to appropriate authorities.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">9. Limitation of Liability</h3>
                  <p className="text-muted-foreground mb-4">
                    Kryvex Trading shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use, arising out of or relating to your use of our services.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">10. Termination</h3>
                  <p className="text-muted-foreground mb-4">
                    Either party may terminate this agreement at any time with written notice. Upon termination, you will have the opportunity to transfer your assets to another qualified custodian.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">11. Changes to Terms</h3>
                  <p className="text-muted-foreground mb-4">
                    We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through our platform. Continued use of our services after changes constitutes acceptance of the new terms.
                  </p>
                </section>

                <section>
                  <h3 className="text-xl font-semibold mb-4">12. Contact Information</h3>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      <strong>Kryvex Trading</strong><br />
                      Email: legal@kryvex.com<br />
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

      {/* Important Notice */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="p-8 bg-gradient-card">
            <div className="text-center space-y-4">
              <Shield className="h-12 w-12 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Important Notice</h3>
              <p className="text-muted-foreground">
                These terms constitute a legally binding agreement between you and Kryvex Trading. 
                By using our platform, you acknowledge that you have read, understood, and agree to be bound by these terms.
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Secure • Compliant • Regulated</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
} 