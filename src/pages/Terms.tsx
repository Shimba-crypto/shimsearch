import { Link } from "react-router-dom";
import { usePageTitle } from "../lib/usePageTitle";

export default function Terms() {
  usePageTitle("Terms");
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-[#3c4043] space-y-6">
      <h1 className="text-2xl font-medium text-[#202124]">Terms of Service</h1>
      <p className="text-[13px] text-[#70757a]">Last updated: August 2026</p>

      <Section title="1. Using ShimSearch">
        <p>ShimSearch provides search over Zambian education data: ECZ past papers, schools, health facilities and laws. The free tier allows 1,000 searches per day. You may use the service for personal or academic purposes.</p>
      </Section>
      <Section title="2. Accounts">
        <p>Accounts are free. You are responsible for keeping your login credentials secure and for all activity under your account. Tokens (<code className="bg-gray-100 px-1 rounded">sst_…</code>) expire after 24 hours.</p>
      </Section>
      <Section title="3. NexasCoin rewards">
        <p>Logged-in users earn 0.001 NexasCoin per search, up to 100 rewarded searches per day. Rewards are paid only to accounts that have a Nexas wallet registered under the same email at <a className="text-[#1a0dab] hover:underline" href="https://nexas-pay.onrender.com" target="_blank" rel="noreferrer">nexas-pay.onrender.com</a>. Rewards may be withheld if fraud or automation is detected. NexasCoin is an ecosystem token, not a currency, and has no guaranteed value.</p>
      </Section>
      <Section title="4. Fair use">
        <p>Automated bulk queries, quota evasion, and attempts to disrupt the service are prohibited. We may suspend accounts that abuse the service.</p>
      </Section>
      <Section title="5. Data & content">
        <p>Search results come from public ecosystem data. Content contributed by users through the ShimbaData Collector is moderated before publication. See the <Link className="text-[#1a0dab] hover:underline" to="/privacy">Privacy Policy</Link>.</p>
      </Section>
      <Section title="6. Disclaimers">
        <p>The service is provided "as is" without warranties. Exam papers, school and health information may be outdated or incomplete — always confirm with official sources.</p>
      </Section>
      <Section title="7. Changes">
        <p>We may update these terms. Continued use after changes constitutes acceptance. Questions: <a className="text-[#1a0dab] hover:underline" href="mailto:support@shimsearch.com">support@shimsearch.com</a></p>
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section>
      <h2 className="text-[15px] font-medium text-[#202124] mb-1">{title}</h2>
      <div className="leading-relaxed">{children}</div>
    </section>
  );
}
