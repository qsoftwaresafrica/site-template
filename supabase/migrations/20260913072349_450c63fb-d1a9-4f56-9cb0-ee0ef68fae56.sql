CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  mime text NOT NULL,
  bytes bytea NOT NULL,
  byte_size integer NOT NULL DEFAULT 0,
  width integer,
  height integer,
  alt text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role text NOT NULL DEFAULT 'editor',
  photo_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_sessions (
  token text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.site_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'briefcase',
  image_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  order_index integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  cover_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  cover_url text,
  tags text[] NOT NULL DEFAULT '{}',
  author text NOT NULL DEFAULT 'Editorial Team',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid REFERENCES public.media(id) ON DELETE CASCADE,
  image_url text,
  caption text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'General',
  width integer,
  height integer,
  posted_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  photo_id uuid REFERENCES public.media(id) ON DELETE SET NULL,
  photo_url text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  handled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.socials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE,
  url text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.media, public.site_users, public.site_sessions, public.services, public.articles, public.gallery_photos, public.team_members, public.inquiries, public.socials, public.settings TO service_role;

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.socials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_articles_status ON public.articles(status, published_at DESC);
CREATE INDEX idx_services_order ON public.services(order_index);
CREATE INDEX idx_gallery_posted ON public.gallery_photos(posted_on DESC);
CREATE INDEX idx_sessions_expires ON public.site_sessions(expires_at);

INSERT INTO public.site_users (name, email, phone, role, password_hash)
VALUES ('Super Admin', 'admin@partner.site', '+255 655 865 905', 'super', '$2b$10$SxIgsJkNAN3.VhtIxSF/2udqgx0Mv.WyNZDKz0BhKDxyZpMsFyNXW');

INSERT INTO public.services (slug, title, summary, body, icon, order_index, highlights) VALUES
('company-registration', 'Company Registration', 'End-to-end incorporation of local and foreign-owned companies, from name search to certificate collection.', '<p>We handle the full incorporation journey so you can focus on trading. Our team files your name search, prepares the memorandum and articles, submits to the registrar and collects your certificate of incorporation.</p><p>We also register your TIN, business licence and statutory files so the company is operational from day one.</p>', 'building-2', 1, '["Name search and reservation","Memorandum and articles drafting","Registrar filing and follow up","TIN and statutory registration"]'),
('business-licences', 'Business Licences', 'Sector licences, permits and renewals handled by consultants who know every counter.', '<p>Every sector carries its own licensing regime. We map the licences your business actually needs, prepare the applications, and manage renewals before they lapse.</p>', 'badge-check', 2, '["Licence gap assessment","Application preparation","Municipal and sector permits","Renewal calendar management"]'),
('business-project-plans', 'Business & Project Plans', 'Bankable business plans, feasibility studies and financial models for funding and permits.', '<p>We write investor-ready business plans backed by real market data and defensible financial models, suitable for banks, investors and regulatory submissions.</p>', 'line-chart', 3, '["Market and competitor research","Three to five year financial models","Feasibility studies","Investor pitch materials"]'),
('names-migration-labour', 'Names Registration, Migration & Labour', 'Business names, work permits, residence permits and labour compliance in one desk.', '<p>From registering a business name to securing class A, B and C permits for expatriate staff, we keep your people and your paperwork compliant.</p>', 'users-round', 4, '["Business name registration","Work and residence permits","Labour compliance audits","Immigration advisory"]');

INSERT INTO public.articles (slug, title, excerpt, body, status, author, tags, published_at) VALUES
('5-signs-your-registration-is-ready', '5 Signs Your Company Registration Is Ready To File', 'Before you submit, run through these five checks. They are the difference between a certificate in days and a rejection in weeks.', '<p>Filing a company registration is not difficult. Filing one that passes on the first attempt is.</p><h2>1. Your proposed name survives a real search</h2><p>Most rejections start here. A name that merely sounds available is not available. Run a formal search and hold a reservation before printing anything.</p><h2>2. Your objects clause matches what you will actually do</h2><p>Regulators compare your stated objects against the licences you later request. A mismatch means a second filing.</p><h2>3. Every director document is current</h2><p>Expired passports, unsigned consent forms and mismatched addresses are the most common causes of delay.</p><h2>4. Your share structure is decided, not improvised</h2><p>Changing share allocations after incorporation is a separate, paid process. Decide now.</p><h2>5. You know your first three compliance dates</h2><p>Tax registration, licence application and first return. Put them in the calendar before the certificate arrives.</p>', 'published', 'Editorial Team', ARRAY['registration','compliance'], now() - interval '3 days'),
('work-permits-what-changed', 'Work Permits: What Changed And What It Means For Employers', 'Processing windows, documentation standards and the practical steps employers should take this quarter.', '<p>Permit processing has tightened. Employers who prepare documentation in advance are seeing approvals in weeks; those who do not are seeing months.</p><h2>Prepare the succession plan first</h2><p>Authorities increasingly ask how the expatriate role transfers to local staff. Have a written answer.</p><h2>Align the job title everywhere</h2><p>The contract, the permit application and the payroll record must use the same title. Any variance triggers a query.</p><h2>Budget for renewals early</h2><p>Start renewals ninety days out. Anything later is a risk to continuity of employment.</p>', 'published', 'Editorial Team', ARRAY['labour','permits'], now() - interval '11 days'),
('choosing-the-right-business-structure', 'Choosing The Right Business Structure For Foreign Investors', 'Branch, subsidiary or representative office? The decision shapes your tax, liability and licensing for years.', '<p>Foreign investors usually choose between three structures, and the right one depends far more on intended activity than on cost.</p><h2>Subsidiary</h2><p>A separate legal person. Best where you will trade locally, hire staff and hold contracts in your own name.</p><h2>Branch</h2><p>An extension of the parent. Simpler to open, but the parent carries the liability.</p><h2>Representative office</h2><p>Marketing and liaison only. It cannot invoice, so it suits market entry research, not trading.</p>', 'published', 'Editorial Team', ARRAY['investment','strategy'], now() - interval '24 days');

INSERT INTO public.team_members (name, role, bio, photo_url, order_index) VALUES
('Amina Kessy', 'Managing Consultant', 'Fifteen years guiding local and foreign investors through incorporation and licensing.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=600&fit=crop', 1),
('Joseph Mwakalinga', 'Head of Compliance', 'Specialist in sector licensing, statutory returns and regulatory audits.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop', 2),
('Grace Mollel', 'Immigration & Labour Lead', 'Handles work permits, residence permits and employer labour compliance.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=600&fit=crop', 3),
('Daniel Shirima', 'Business Planning Analyst', 'Builds financial models and feasibility studies for funding submissions.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=600&fit=crop', 4);

INSERT INTO public.gallery_photos (image_url, caption, category, width, height, posted_on) VALUES
('https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200', 'Client advisory session', 'Office', 1200, 800, current_date - 5),
('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900', 'Team strategy review', 'Team', 900, 1200, current_date - 5),
('https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200', 'Consultation room', 'Office', 1200, 800, current_date - 19),
('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1000', 'Onboarding workshop', 'Events', 1000, 1000, current_date - 19),
('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=900', 'Registration desk', 'Office', 900, 1200, current_date - 40),
('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200', 'Document preparation', 'Operations', 1200, 800, current_date - 40),
('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1100', 'Partner signing', 'Events', 1100, 733, current_date - 62),
('https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=900', 'Advisory call', 'Team', 900, 1200, current_date - 62);

INSERT INTO public.socials (platform, url, enabled, order_index) VALUES
('facebook', 'https://facebook.com', true, 1),
('twitter', 'https://x.com', true, 2),
('linkedin', 'https://linkedin.com', true, 3),
('instagram', '', false, 4),
('youtube', '', false, 5),
('whatsapp', '', false, 6);

INSERT INTO public.settings (key, value) VALUES
('hero', '{"mode":"slideshow","autoplayMs":6000,"animateText":true,"overlay":0.55,"solidToken":"primary","slides":[{"url":"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920","title":"Register your company with confidence","subtitle":"End-to-end incorporation, licensing and compliance for local and foreign investors.","ctaLabel":"Explore our services","ctaHref":"/services"},{"url":"https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1920","title":"Every permit, one desk","subtitle":"Business licences, work permits and statutory filings handled by specialists.","ctaLabel":"Talk to a consultant","ctaHref":"/contacts"},{"url":"https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920","title":"Plans that get funded","subtitle":"Bankable business plans and feasibility studies built on real market data.","ctaLabel":"See how we work","ctaHref":"/about-us"}]}'),
('contacts', '{"companyName":"Baleyna Company Ltd","addressLines":["KKKT Ground, Kurasini","Opposite Immigration HQ","P.O. Box 5614 Dar es Salaam, Tanzania"],"phones":["+255 655 865 905","+255 744 866 050"],"emails":["info@baleyna.co.tz"],"hours":[{"label":"Monday - Friday","value":"8:00am - 5:00pm"},{"label":"Saturday","value":"8:30am - 1:30pm"},{"label":"Sunday & Public Holidays","value":"Closed"}],"map":{"enabled":true,"query":"Kurasini, Dar es Salaam, Tanzania","zoom":15}}'),
('about', '{"heading":"About Us","paragraphs":["Baleyna Secretarial Company Ltd offers investment and business consultancy in the whole process of setting up business or company and other related services. From company registration to different licenses, permits, and incentives, we help locals and foreigners to invest in Tanzania.","If you are looking for business consultants then Baleyna Secretarial Company Ltd is your business consulting company that helps businesses like yours. Based in Dar es Salaam, we offer business and investment consultancy and promotion services in the field of set up and allied services.","At Baleyna Secretarial we assist businesses and investors in all steps of investing and doing business in Tanzania. We have a team of qualified experts with knowledge of regulatory business matters."],"highlight":"Our main task is to assist business and investors in all stages or steps of doing business here in Tanzania.","image":"https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80&fit=crop","customersServed":500}');