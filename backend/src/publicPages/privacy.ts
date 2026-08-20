export const PRIVACY_POLICY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>ValX Privacy Policy</title>
<style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #222; line-height: 1.6; }
  h1 { font-size: 26px; }
  h2 { font-size: 18px; margin-top: 32px; }
  p, li { font-size: 15px; }
  .updated { color: #777; font-size: 13px; margin-bottom: 32px; }
</style>
</head>
<body>
  <h1>ValX Privacy Policy</h1>
  <p class="updated">Last updated: August 10, 2026</p>

  <p>ValX ("we", "our", "the app") is a business-to-business procurement and bidding app that connects buyers and suppliers. This policy explains what information we collect, how we use it, and the choices you have — including for people testing the app through Apple TestFlight.</p>

  <h2>Information We Collect</h2>
  <ul>
    <li><strong>Phone number</strong> — used to sign you in via a one-time SMS code (OTP). We don't use passwords.</li>
    <li><strong>Name and company details</strong> — the name, company name, and GST number you enter when setting up a profile.</li>
    <li><strong>Contacts (optional)</strong> — if you choose to add a supplier or team member from your phone's contact list, we read the name and phone number of the contact(s) you select. We don't access or upload your full address book.</li>
    <li><strong>Business content you create</strong> — bids, groups, supplier lists, chat messages, and related activity within the app.</li>
    <li><strong>Push notification token</strong> — a device identifier used to deliver notifications about your bids and messages.</li>
    <li><strong>Basic technical data</strong> — standard server logs (such as IP address and request timing) used for debugging and keeping the service reliable.</li>
  </ul>

  <h2>How We Use This Information</h2>
  <p>We use your information to operate the app's core features: authenticating you, connecting buyers with suppliers, running the bidding process, delivering chat messages and notifications, and enforcing the access permissions you and your team set up. We do not sell your data or use it for advertising.</p>

  <h2>Third-Party Services</h2>
  <p>We rely on a small number of service providers to run ValX:</p>
  <ul>
    <li><strong>2Factor.in</strong> — delivers the SMS one-time codes used to sign in.</li>
    <li><strong>Firebase (Google)</strong> — stores in-app chat messages.</li>
    <li><strong>Expo</strong> — delivers push notifications to your device.</li>
    <li><strong>Railway</strong> — hosts our backend server and database.</li>
  </ul>
  <p>These providers process data only as needed to provide their service to us and are not permitted to use it for their own purposes.</p>

  <h2>Data Retention and Deletion</h2>
  <p>You control your data directly in the app:</p>
  <ul>
    <li>A company profile owner can <strong>deactivate</strong> their profile at any time from Profile settings. This is reversible — reactivating restores your data.</li>
    <li>A team member (someone added to another company's profile) can <strong>permanently delete their account</strong> from Profile settings. This immediately and irreversibly removes their access from every profile they're a member of and deletes their account record.</li>
  </ul>
  <p>You can also request deletion of your data at any time by contacting us using the details below.</p>

  <h2>TestFlight Beta Testing</h2>
  <p>If you're using ValX through Apple TestFlight, the same data practices described in this policy apply. Beta builds may include additional diagnostic logging used solely to identify and fix issues before release, and are not shared with third parties beyond the providers listed above.</p>

  <h2>Children's Privacy</h2>
  <p>ValX is a business tool intended for use by adults conducting commercial procurement activity. It is not directed at children, and we do not knowingly collect information from children.</p>

  <h2>Changes to This Policy</h2>
  <p>We may update this policy as the app evolves. We'll update the "Last updated" date above when we do.</p>

  <h2>Contact Us</h2>
  <p>Questions about this policy or your data can be sent to <a href="mailto:valxprocure@gmail.com">valxprocure@gmail.com</a>.</p>
</body>
</html>
`;
