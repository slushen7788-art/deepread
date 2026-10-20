import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "关于" };

export default function About() {
  return (
    <div className="static-page">
      <h1>关于{site.name}</h1>
      <p>
        {site.name}是一个技术精读站。网上的原文越来越长，真正值得读的比例却越来越低——这里每天挑一篇值得读的，
        替你读完，并且给出判断，而不是摘要和复述。
      </p>
      <h2>联系</h2>
      <p>
        投稿、纠错、合作：<a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      </p>
    </div>
  );
}
