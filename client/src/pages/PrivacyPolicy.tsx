import React from "react";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Privacy Policy</h1>
        
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Last Updated: May 5, 2025</h2>
          
          <p>
            Welcome to BitMon. We respect your privacy and are committed to protecting your personal data. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
          
          <div className="space-y-2">
            <h3 className="text-xl font-medium">1.1 Personal Information</h3>
            <p>
              We may collect personal information that you voluntarily provide when using our service, including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name and contact information (email address, wallet address)</li>
              <li>Account credentials</li>
              <li>Transaction data</li>
              <li>Communication preferences</li>
              <li>Any other information you choose to provide</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-medium">1.2 Automatically Collected Information</h3>
            <p>
              When you access our service, we may automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Device information (browser type, operating system, IP address)</li>
              <li>Usage information (pages visited, time spent on the platform)</li>
              <li>Blockchain transaction data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
          
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Provide, maintain, and improve our services</li>
            <li>Process and complete transactions</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Prevent fraudulent activities and ensure platform security</li>
            <li>Comply with legal obligations</li>
            <li>Personalize your experience</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">3. Information Sharing and Disclosure</h2>
          
          <p>We may share your information with:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Service providers who perform services on our behalf</li>
            <li>Professional advisors (legal, accounting, security)</li>
            <li>Business partners with your consent</li>
            <li>Legal authorities when required by law</li>
            <li>In connection with a business transaction (merger, acquisition, sale)</li>
          </ul>
          
          <p>
            We do not sell or rent your personal information to third parties for marketing purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">4. Data Security</h2>
          
          <p>
            We implement appropriate technical and organizational measures to protect your personal data from unauthorized access, 
            accidental loss, or destruction. While we strive to use commercially acceptable means to protect your information, 
            we cannot guarantee its absolute security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">5. Blockchain Data</h2>
          
          <p>
            Due to the nature of blockchain technology, certain transaction information is public by default. 
            This includes wallet addresses and transaction details. Please be aware that any information submitted 
            to the blockchain cannot be deleted or modified.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">6. Your Rights and Choices</h2>
          
          <p>Depending on your location, you may have rights to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal information we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (where applicable)</li>
            <li>Object to processing of your data</li>
            <li>Request restriction of processing</li>
            <li>Data portability</li>
            <li>Withdraw consent</li>
          </ul>
          
          <p>
            To exercise these rights, please contact us at privacy@bitmon.com.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">7. Children's Privacy</h2>
          
          <p>
            Our service is not intended for individuals under the age of 18. We do not knowingly collect personal 
            information from children. If you believe we have collected information from a child, 
            please contact us immediately.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">8. Changes to This Privacy Policy</h2>
          
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review 
            this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">9. Contact Us</h2>
          
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="font-medium">
            Email: privacy@bitmon.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
