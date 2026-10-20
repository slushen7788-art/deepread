"use client";
import { useEffect } from "react";
import { site } from "@/lib/site";

// 【已停用】手动广告位组件：站长决定用 AdSense 自动广告自己找位置，全站不再手动放广告位。
// 本文件保留备用，不要在页面里引用它。
// 没配 NEXT_PUBLIC_ADSENSE_CLIENT 时显示占位框（预览版式用），配好后自动换成真实广告
export default function AdSlot({
  slot,
  format = "auto",
}: {
  slot?: string;
  format?: string;
}) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || site.adsClient;
  useEffect(() => {
    if (!client) return;
    try {
      // @ts-expect-error adsbygoogle 全局
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [client]);
  if (!client) {
    return (
      <div className="ad-slot ad-placeholder" aria-hidden>
        广告位 · AdSense{slot ? ` · ${slot}` : ""}（填好发布商 ID 后显示真实广告）
      </div>
    );
  }
  return (
    <ins
      className="adsbygoogle ad-slot"
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
