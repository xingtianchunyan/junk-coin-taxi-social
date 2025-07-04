import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendAccessCodeRequest {
  email: string;
  accessCode: string;
  roles: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, accessCode, roles }: SendAccessCodeRequest = await req.json();

    if (!email || !accessCode || !roles) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const roleText = roles.map(role => {
      switch(role) {
        case 'passenger': return '乘客';
        case 'driver': return '司机';
        case 'owner': return '车主';
        default: return role;
      }
    }).join('、');

    const emailResponse = await resend.emails.send({
      from: "垃圾币打车 <onboarding@resend.dev>",
      to: [email],
      subject: "您的访问码 - 垃圾币打车",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a; text-align: center;">垃圾币打车</h1>
          <h2 style="color: #333;">您的访问码已生成</h2>
          <p>您好！</p>
          <p>您已成功选择身份：<strong>${roleText}</strong></p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h3 style="margin: 0; color: #333;">您的访问码</h3>
            <div style="font-size: 24px; font-weight: bold; color: #16a34a; letter-spacing: 2px; margin: 10px 0;">
              ${accessCode}
            </div>
            <p style="margin: 0; color: #666; font-size: 14px;">请妥善保管此访问码</p>
          </div>
          <p>使用此访问码，您可以：</p>
          <ul>
            <li>在网站内编辑和查看您的数据</li>
            <li>访问与您身份相关的功能</li>
            <li>管理您的个人信息</li>
          </ul>
          <p style="color: #ef4444; font-weight: bold;">⚠️ 请务必保存此访问码，丢失后将无法找回您的数据。</p>
          <p>如果您没有进行此操作，请忽略此邮件。</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            此邮件由垃圾币打车系统自动发送，请勿回复。
          </p>
        </div>
      `,
    });

    console.log("Access code email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-access-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);