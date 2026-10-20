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
      <h2>每篇精读怎么做</h2>
      <p>第一步定主线：这篇文章表面在说什么、实际在说什么、最有价值的是哪一点，一句话说清。</p>
      <p>第二步拆机制：回到原文和一手材料，搞清它讲的东西到底怎么运转；读不到依据的地方会明确标为推测。</p>
      <p>第三步给判断：用核实过的事实和真实做过的项目来对照。解读里出现的经历都真实，文末会附原文出处。</p>
      <h2>联系</h2>
      <p>
        投稿、纠错、合作：<a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
      </p>
    </div>
  );
}
