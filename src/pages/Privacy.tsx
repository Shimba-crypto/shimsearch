import { usePageTitle } from "../lib/usePageTitle";

export default function Privacy() {
  usePageTitle("Privacy");
  return (
    <div className="max-w-2xl mx-auto px-6 py-10 text-sm text-[#3c4043] space-y-6">
      <h1 className="text-2xl font-medium text-[#202124]">Privacy Policy</h1>
      <p className="text-[13px] text-[#70757a]">Last updated: August 2026</p>

      <Section title="1. What we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Account data</b> — name, email, and password hash when you register or sign in with Auther.</li>
          <li><b>Search activity</b> — for each search we record the IP address, date, tier and a counter (used to enforce the 1,000/day quota). We do not store search queries.</li>
          <li><b>Reward records</b> — user ID, email, date and credited NexasCoin amounts.</li>
          <li><b>Billing records</b> — subscription tier and payment history.</li>
        </ul>
      </Section>
      <Section title="2. How we use it">
        <p>Account data runs the service. Search activity enforces quotas and rate limits. Reward records pay out NexasCoin via the NexasPay ledger. Nothing is sold or shared with advertisers.</p>
      </Section>
      <Section title="3. Data contributed by you (ShimbaData Collector)">
        <p>If you submit data through the ShimbaData Collector (browser extension or CLI), we record your submission, your email, timestamp and source ("extension"/"cli"). Submissions are reviewed before they become public. See the <a className="text-[#1a0dab] hover:underline" href="https://shimbadata.onrender.com/privacy" target="_blank" rel="noreferrer">ShimbaData Privacy Policy</a> for details. The extension never reads page content unless you explicitly click "Detect from this page".</p>
      </Section>
      <Section title="4. Cookies & tokens">
        <p>We use a session cookie (<code className="bg-gray-100 px-1 rounded">nsp_token</code>) when you sign in. Third-party sign-in (Auther) and payment (NexasPay) providers handle their own data under their own policies.</p>
      </Section>
      <Section title="5. Retention & deletion">
        <p>Tokens expire within 24–30 days. Usage counters reset daily. To delete your account and associated records, email <a className="text-[#1a0dab] hover:underline" href="mailto:support@shimsearch.com">support@shimsearch.com</a> and we will remove your account, tokens, reward and billing records within 14 days.</p>
      </Section>
      <Section title="6. Security">
        <p>Passwords are bcrypt-hashed. Admin endpoints require authentication. Data is stored on Render's infrastructure; note that some JSON stores may reset on redeploy.</p>
      </Section>
      <Section title="7. Contact">
        <p>Questions about this policy: <a className="text-[#1a0dab] hover:underline" href="mailto:support@shimsearch.com">support@shimsearch.com</a></p>
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
