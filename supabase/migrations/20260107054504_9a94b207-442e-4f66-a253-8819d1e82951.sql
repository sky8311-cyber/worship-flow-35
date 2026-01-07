-- Create enums for legal documents
CREATE TYPE legal_document_type AS ENUM ('terms', 'privacy', 'copyright', 'trademark');
CREATE TYPE legal_language AS ENUM ('ko', 'en');

-- Create legal_documents table
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type legal_document_type NOT NULL,
  language legal_language NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraint: only ONE active document per type + language
CREATE UNIQUE INDEX idx_legal_documents_active 
  ON public.legal_documents (type, language) 
  WHERE is_active = true;

-- Create legal_acceptances table
CREATE TABLE public.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type legal_document_type NOT NULL,
  version TEXT NOT NULL,
  language legal_language NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT
);

CREATE INDEX idx_legal_acceptances_user ON public.legal_acceptances(user_id);
CREATE INDEX idx_legal_acceptances_user_type ON public.legal_acceptances(user_id, document_type);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- RLS for legal_documents: public read access for active documents
CREATE POLICY "Anyone can view active legal documents"
  ON public.legal_documents
  FOR SELECT
  USING (is_active = true);

-- RLS for legal_acceptances: users can read/insert their own
CREATE POLICY "Users can view their own acceptances"
  ON public.legal_acceptances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own acceptances"
  ON public.legal_acceptances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed Terms of Service - Korean
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'terms',
  'ko',
  '1.0',
  'Kworship 이용약관',
  '제1조 (운영사 및 소유권)
Kworship 플랫폼은 Goodpapa Inc.가 소유 및 운영합니다.
Goodpapa Inc.는 캐나다 연방법(Canada Business Corporations Act)에 따라 설립된 연방 법인이며,
본 서비스와 관련된 모든 권리, 소유권 및 이익은 전적으로 Goodpapa Inc.에 귀속됩니다.

제2조 (플랫폼의 협업적 성격 및 데이터 공유)
Kworship는 공동체 기반 협업 플랫폼입니다.
이용자는 플랫폼에 등록·수정된 곡 정보, 예배 세트, 메타데이터 및 사용 이력이
권한 설정에 따라 다른 사용자 및 관리자에게 공유될 수 있음에 동의합니다.

제3조 (데이터 소유권 및 활용)
이용자가 제출한 원본 콘텐츠의 저작권은 이용자에게 귀속됩니다.
그러나 이용자는 Goodpapa Inc.에 대하여 해당 콘텐츠를 서비스 운영,
데이터 분석, 익명화된 통계 및 교회와 사역 공동체의 유익을 위한
연구 목적에 사용할 수 있는 영구적·무상 사용권을 부여합니다.
모든 집계 데이터, 분석 결과 및 시스템 인사이트의 소유권은
Goodpapa Inc.에 귀속됩니다.

제4조 (지식재산권 및 영업비밀)
Kworship의 시스템 구조, 데이터베이스 스키마, 알고리즘,
추천 로직, UI/UX 흐름은 Goodpapa Inc.의 보호된 저작물 및 영업비밀입니다.
역설계, 모방, 경쟁 서비스 개발 목적의 사용을 금합니다.

제5조 (유료 서비스)
일부 기능은 유료로 제공될 수 있으며, 요금은 선불을 원칙으로 합니다.
별도 고지 없는 한 환불은 제공되지 않습니다.

제6조 (면책)
본 서비스는 "있는 그대로(as is)" 제공되며,
특정 사역 성과나 결과를 보장하지 않습니다.',
  CURRENT_DATE,
  true
);

-- Seed Terms of Service - English
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'terms',
  'en',
  '1.0',
  'Kworship Terms of Service',
  'Ownership and Operation
Kworship is owned and operated by Goodpapa Inc., a federal corporation of Canada.
All rights, title, and interest in the platform, including systems, data, and intellectual property,
are exclusively owned by Goodpapa Inc.

Collaborative Platform
Kworship is a collaborative ministry platform.
Users acknowledge that songs, worship sets, metadata, and usage information
may be shared with other authorized users and administrators.

Data Rights
Users retain ownership of original content they submit.
However, users grant Goodpapa Inc. a perpetual, royalty-free license
to use such content for platform operation, analytics,
and data-driven research for the benefit of churches and ministries.
All aggregated data and system insights are owned by Goodpapa Inc.

Intellectual Property
All platform architecture, schemas, algorithms, workflows, and UI/UX
are protected intellectual property and trade secrets.
Reverse engineering or competitive use is prohibited.

Paid Services
Certain features may require payment.
Fees are billed in advance and are non-refundable unless otherwise stated.

Disclaimer
The service is provided "as is" without guarantees of specific ministry outcomes.',
  CURRENT_DATE,
  true
);

-- Seed Privacy Policy - Korean
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'privacy',
  'ko',
  '1.0',
  '개인정보 처리방침',
  'Kworship는 서비스 제공을 위해 이름, 이메일, 계정 정보 및 이용 기록을 수집합니다.
수집된 개인정보는 서비스 운영, 보안, 통계 분석 및 기능 개선을 위해 사용됩니다.
개인정보는 법령에 따라 안전하게 보호되며,
익명화된 데이터는 교회와 사역 공동체의 유익을 위한 분석에 활용될 수 있습니다.',
  CURRENT_DATE,
  true
);

-- Seed Privacy Policy - English
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'privacy',
  'en',
  '1.0',
  'Privacy Policy',
  'Kworship collects personal information such as name, email,
account identifiers, and usage logs to operate the service.
Personal data is protected and may be anonymized for analytics
to improve ministry-related tools and insights.',
  CURRENT_DATE,
  true
);

-- Seed Copyright Policy - Korean
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'copyright',
  'ko',
  '1.0',
  '저작권 및 콘텐츠 정책',
  'Kworship에 표시되는 곡 정보와 유튜브 링크는
공개적으로 접근 가능한 자료를 기반으로 한 참조 정보입니다.
Kworship는 음악, 악보, 영상의 저작권을 소유하지 않습니다.

이용자는 독점적 유료 사용권이 있는 악보, 음원 또는
공유가 금지된 저작물을 업로드해서는 안 됩니다.
저작권 침해가 의심되는 콘텐츠는 관리자에게 즉시 신고해야 하며,
Kworship는 합리적이고 신속하게 검토 및 삭제 조치를 진행합니다.

모든 음악 참조는 유튜브 검색 및 공개 데이터베이스 기반 링크입니다.',
  CURRENT_DATE,
  true
);

-- Seed Copyright Policy - English
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'copyright',
  'en',
  '1.0',
  'Copyright & Content Policy',
  'Song information and YouTube links on Kworship are public references.
Kworship does not own or host copyrighted music, scores, or videos.

Users must not upload copyrighted materials with exclusive paid rights.
Suspected infringement must be reported to administrators.
Kworship will promptly review and remove infringing content.
All music references are based on YouTube search and public databases.',
  CURRENT_DATE,
  true
);

-- Seed Trademark Notice - Korean
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'trademark',
  'ko',
  '1.0',
  '상표 고지',
  'Kworship™, K-Seed™ 및 관련 명칭과 로고는
Goodpapa Inc.의 상표 또는 서비스표입니다.
사전 서면 동의 없는 사용을 금합니다.',
  CURRENT_DATE,
  true
);

-- Seed Trademark Notice - English
INSERT INTO public.legal_documents (type, language, version, title, content, effective_date, is_active)
VALUES (
  'trademark',
  'en',
  '1.0',
  'Trademark Notice',
  'Kworship™, K-Seed™, and related names and logos
are trademarks or service marks of Goodpapa Inc.
Unauthorized use is prohibited.',
  CURRENT_DATE,
  true
);