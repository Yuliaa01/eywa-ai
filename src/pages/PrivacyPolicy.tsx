import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FEFF] via-white to-[#F8FEFF]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate('/onboarding', { state: { step: 3 } })}
          className="flex items-center gap-2 text-[#5A6B7F] hover:text-[#12AFCB] transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <div className="space-y-8">
          <div className="text-center space-y-4 mb-12">
            <h1 className="font-rounded text-[2.5rem] font-bold bg-gradient-to-r from-[#0E1012] to-[#12AFCB] bg-clip-text text-transparent">
              Privacy Policy & Terms
            </h1>
            <p className="text-[1.0625rem] text-[#5A6B7F]">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-[#12AFCB]/10 p-8 shadow-[0_4px_20px_rgba(18,175,203,0.06)] space-y-8">
            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Introduction</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                Welcome to inLive. We are committed to protecting your privacy and ensuring the security of your personal health information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our longevity and health optimization platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Information We Collect</h2>
              <div className="space-y-3">
                <h3 className="text-[1.125rem] font-semibold text-[#0E1012]">Health Data</h3>
                <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                  <li>Laboratory test results and biomarkers</li>
                  <li>Electronic health records (EHR) and medical history</li>
                  <li>Wearable device data (fitness trackers, smartwatches)</li>
                  <li>Vital signs and health metrics</li>
                  <li>Genetic and genomic data (with explicit consent)</li>
                  <li>Nutrition and dietary information</li>
                  <li>Exercise and activity logs</li>
                </ul>
              </div>
              <div className="space-y-3 mt-4">
                <h3 className="text-[1.125rem] font-semibold text-[#0E1012]">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                  <li>Name, date of birth, and contact information</li>
                  <li>Account credentials and authentication data</li>
                  <li>Profile preferences and settings</li>
                  <li>Location data (when explicitly permitted)</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                <li>Provide personalized health insights and recommendations</li>
                <li>Generate AI-powered longevity strategies and action plans</li>
                <li>Track your health progress and biomarker trends</li>
                <li>Connect you with relevant healthcare providers and specialists</li>
                <li>Send health reminders and notifications (with your consent)</li>
                <li>Improve our AI models and platform functionality</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Data Security & Protection</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                We implement industry-standard security measures to protect your health data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                <li>End-to-end encryption for data in transit and at rest</li>
                <li>HIPAA-compliant data storage and handling procedures</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication for account access</li>
                <li>Strict access controls and role-based permissions</li>
                <li>Automated backups and disaster recovery systems</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Data Sharing & Third Parties</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                We do not sell your personal health information. We may share your data only in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                <li>With healthcare providers you explicitly authorize</li>
                <li>With laboratory partners for test processing (with consent)</li>
                <li>With AI service providers under strict data processing agreements</li>
                <li>When required by law or legal process</li>
                <li>To protect the safety and security of our users</li>
              </ul>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed mt-3">
                All third-party partners are required to maintain the same level of data protection and security standards.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Your Rights & Choices</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                You have complete control over your health data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                <li>Access and download your complete health data at any time</li>
                <li>Modify or correct any inaccurate information</li>
                <li>Delete your account and all associated data</li>
                <li>Revoke consent for specific data collection or processing</li>
                <li>Opt-out of communications and notifications</li>
                <li>Request data portability to another platform</li>
                <li>File complaints with data protection authorities</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Cookies & Tracking</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                We use essential cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                <li>Maintain your session and authentication</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze platform usage and performance</li>
                <li>Improve user experience and functionality</li>
              </ul>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed mt-3">
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Children's Privacy</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">International Data Transfers</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                Your data may be processed and stored in countries outside your jurisdiction. We ensure that all international data transfers comply with applicable data protection laws and maintain equivalent levels of protection through appropriate safeguards.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Changes to This Policy</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes through the platform or via email. Your continued use of inLive after such modifications constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Contact Us</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:
              </p>
              <div className="bg-white/40 rounded-2xl p-6 mt-4">
                <p className="text-[1rem] text-[#0E1012] font-medium">Email: privacy@eywa-ai.com</p>
                <p className="text-[1rem] text-[#0E1012] font-medium mt-2">Data Protection Officer: dpo@eywa-ai.com</p>
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-[#12AFCB]/10">
              <h2 className="text-[1.5rem] font-semibold text-[#0E1012]">Terms of Service</h2>
              <p className="text-[1rem] text-[#5A6B7F] leading-relaxed">
                By using Eywa AI, you agree to these terms:
              </p>
              <ul className="list-disc list-inside space-y-2 text-[1rem] text-[#5A6B7F] leading-relaxed ml-4">
                <li>You are at least 18 years of age</li>
                <li>You provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You will not misuse the platform or violate applicable laws</li>
                <li>Health insights are for informational purposes only, not medical advice</li>
                <li>You should consult healthcare professionals for medical decisions</li>
                <li>We reserve the right to modify or terminate services</li>
                <li>Disputes will be resolved through binding arbitration</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
