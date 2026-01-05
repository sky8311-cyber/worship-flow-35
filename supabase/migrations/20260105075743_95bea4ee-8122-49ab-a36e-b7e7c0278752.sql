-- Update email templates with actual production HTML content

-- Update Welcome Email Template (Korean)
UPDATE email_templates 
SET 
  html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2b4b8a; margin: 0; font-size: 28px;">K-Worship</h1>
    <p style="color: #666; margin-top: 8px;">혼자 짜던 콘티에서, 함께 나누는 콘티로</p>
  </div>
  
  <div style="background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin-bottom: 30px;">
    <h2 style="margin: 0 0 15px 0; font-size: 24px;">환영합니다, {{user_name}}님! 🎉</h2>
    <p style="margin: 0; font-size: 16px; opacity: 0.95;">K-Worship 가입을 진심으로 환영합니다.</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
    <h3 style="color: #2b4b8a; margin-top: 0; font-size: 18px;">이제 시작하세요</h3>
    <ul style="padding-left: 20px; margin: 15px 0;">
      <li style="margin-bottom: 10px;">📚 <strong>찬양 라이브러리</strong>를 탐색하고 나만의 즐겨찾기 목록을 만드세요</li>
      <li style="margin-bottom: 10px;">🎼 <strong>워십세트</strong>를 만들어 예배 흐름을 설계하세요</li>
      <li style="margin-bottom: 10px;">👥 <strong>예배공동체</strong>에 가입하거나 새로운 공동체를 만드세요</li>
      <li style="margin-bottom: 10px;">🤝 팀원들과 함께 협업하며 예배를 준비하세요</li>
    </ul>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{app_url}}" style="display: inline-block; background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">지금 시작하기</a>
  </div>

  <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 5px 0;">질문이나 도움이 필요하신가요?</p>
    <p style="margin: 5px 0;">언제든지 연락 주세요 💬</p>
    <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">© 2025 K-Worship. All rights reserved.</p>
  </div>
</body>
</html>',
  subject = 'K-Worship에 오신 것을 환영합니다! 🎵',
  updated_at = now()
WHERE slug = 'welcome';

-- Update Community Invitation Template (Korean)
UPDATE email_templates 
SET 
  html_content = '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2b4b8a, #d16265); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">K-Worship 초대</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p>안녕하세요,</p>
        <p><strong>{{inviter_name}}</strong>님이 <strong>{{community_name}}</strong> 예배공동체에 초대하셨습니다.</p>
        <p>K-Worship은 예배 흐름을 설계하고 팀과 함께 예배를 준비하는 도구입니다.</p>
        <div style="text-align: center;">
          <a href="{{invite_link}}" style="display: inline-block; background: #2b4b8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">초대 수락하기</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">이 초대는 7일 후 만료됩니다.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">버튼이 작동하지 않으면 다음 링크를 복사하여 브라우저에 붙여넣으세요:<br>{{invite_link}}</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p>K-Worship - 예배의 흐름을 짜는 찬양 콘티</p>
        <p style="font-size: 12px;">이 이메일은 {{community_name}}의 초대로 발송되었습니다.</p>
      </div>
    </div>
  </body>
</html>',
  subject = '{{community_name}}에 초대되었습니다',
  updated_at = now()
WHERE slug = 'community-invite-ko';

-- Update Community Invitation Template (English)
UPDATE email_templates 
SET 
  html_content = '<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2b4b8a, #d16265); padding: 30px; text-align: center; color: white; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">K-Worship Invitation</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p>Hello,</p>
        <p><strong>{{inviter_name}}</strong> has invited you to join <strong>{{community_name}}</strong> worship community.</p>
        <p>K-Worship is a tool for designing worship flows and preparing services with your team.</p>
        <div style="text-align: center;">
          <a href="{{invite_link}}" style="display: inline-block; background: #2b4b8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">If the button doesn''t work, copy and paste this link into your browser:<br>{{invite_link}}</p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p>K-Worship - Worship Setlist Management</p>
        <p style="font-size: 12px;">This email was sent by invitation from {{community_name}}.</p>
      </div>
    </div>
  </body>
</html>',
  subject = 'You''ve been invited to join {{community_name}}',
  updated_at = now()
WHERE slug = 'community-invite-en';

-- Update Referral Invitation Template (Korean)
UPDATE email_templates 
SET 
  html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #8B5CF6; margin-bottom: 10px;">K-Worship</h1>
  </div>
  
  <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); border-radius: 16px; padding: 30px; text-align: center; color: white; margin-bottom: 30px;">
    <h2 style="margin: 0 0 15px 0; font-size: 24px;">🎵 {{inviter_name}}님이 초대했습니다!</h2>
    <p style="margin: 0; font-size: 16px; opacity: 0.9;">K-Worship에서 함께 예배를 준비해요</p>
  </div>
  
  <p style="font-size: 16px; margin-bottom: 20px;">
    K-Worship은 예배 리더와 팀을 위한 최고의 협업 플랫폼입니다. 
    곡 라이브러리, 예배 세트 빌더, 팀 협업 등 다양한 기능을 무료로 이용하세요!
  </p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{referral_link}}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">지금 가입하기</a>
  </div>
  
  <p style="font-size: 14px; color: #666; text-align: center;">
    또는 이 링크를 복사하세요: <a href="{{referral_link}}" style="color: #8B5CF6;">{{referral_link}}</a>
  </p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="font-size: 12px; color: #999; text-align: center;">
    이 이메일은 {{inviter_name}}님의 초대로 발송되었습니다.
  </p>
</body>
</html>',
  subject = '{{inviter_name}}님이 K-Worship에 초대했습니다!',
  updated_at = now()
WHERE slug = 'referral-invite';

-- Update Broadcast Template with K-Worship branding
UPDATE email_templates 
SET 
  html_content = '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2b4b8a; margin: 0; font-size: 28px;">K-Worship</h1>
    <p style="color: #666; margin-top: 8px;">혼자 짜던 콘티에서, 함께 나누는 콘티로</p>
  </div>
  
  <div style="background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin-bottom: 30px;">
    <h2 style="margin: 0 0 15px 0; font-size: 24px;">{{subject}}</h2>
  </div>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 25px; margin-bottom: 25px;">
    {{content}}
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{app_url}}" style="display: inline-block; background: linear-gradient(135deg, #2b4b8a 0%, #d16265 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">K-Worship 방문하기</a>
  </div>

  <div style="border-top: 2px solid #e9ecef; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 5px 0;">질문이나 도움이 필요하신가요?</p>
    <p style="margin: 5px 0;">언제든지 연락 주세요 💬</p>
    <p style="margin: 15px 0 5px 0; color: #999; font-size: 12px;">© 2025 K-Worship. All rights reserved.</p>
  </div>
</body>
</html>',
  subject = '{{subject}}',
  updated_at = now()
WHERE slug = 'broadcast';