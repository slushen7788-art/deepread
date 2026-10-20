import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "隐私政策" };

export default function Privacy() {
  return (
    <div className="static-page">
      <h1>隐私政策</h1>
      <p>本页说明本站如何处理访问者的信息。</p>
      <h2>我们收集什么</h2>
      <p>
        本站不提供账号注册，不主动收集姓名、电话等个人身份信息。服务器与统计服务可能记录 IP 地址、浏览器类型、
        访问页面与时间等常规日志信息，用于安全与流量分析。
      </p>
      <h2>Cookie 与第三方广告</h2>
      <p>
        本站使用 Google AdSense 投放广告。Google 及其合作伙伴会使用 Cookie（包括 DoubleClick Cookie）
        根据你此前访问本站或其他网站的情况投放广告。你可以访问 Google 广告设置页面选择停用个性化广告，
        也可以在浏览器设置中禁用 Cookie。
      </p>
      <h2>外部链接</h2>
      <p>本站包含指向原文出处等第三方网站的链接，这些网站的隐私做法与本站无关，请自行查阅其政策。</p>
      <h2>联系我们</h2>
      <p>
        对本政策有疑问：<a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      </p>
    </div>
  );
}
