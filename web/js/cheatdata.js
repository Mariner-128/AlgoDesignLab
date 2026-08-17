/* cheatdata.js — 速查表静态内容 */
"use strict";
const CHEAT_DATA = [
  {
    title: "渐近记号速查",
    html: `<table>
<tr><th>记号</th><th>含义</th><th>直觉</th></tr>
<tr><td class="mono">f(n)=O(g(n))</td><td>∃c&gt;0, n₀: 对所有 n≥n₀, 0≤f(n)≤c·g(n)</td><td>f 增长不快于 g(上界)</td></tr>
<tr><td class="mono">f(n)=Ω(g(n))</td><td>∃c&gt;0, n₀: 对所有 n≥n₀, f(n)≥c·g(n)≥0</td><td>f 增长不慢于 g(下界)</td></tr>
<tr><td class="mono">f(n)=Θ(g(n))</td><td>f=O(g) 且 f=Ω(g)</td><td>同阶</td></tr>
<tr><td class="mono">f(n)=o(g(n))</td><td>lim f/g = 0</td><td>严格慢于(上界不紧)</td></tr>
<tr><td class="mono">f(n)=ω(g(n))</td><td>lim f/g = ∞</td><td>严格快于(下界不紧)</td></tr>
</table>
<p>常用运算规则: 若 f=O(h), g=O(h) 则 f+g=O(h); 若 f=O(g) 则 c·f=O(g); 比较 n^a^ 与 n^b^ 看指数; 指数函数 &gt; 多项式 &gt; 对数多项式。注意 O 记号只关心 n→∞ 的增长趋势, 与具体常数无关。</p>`
  },
  {
    title: "常见复杂度函数对比",
    html: `<div class="comp-row"><span class="lab">O(1)</span><div class="bar"><i style="width:2%"></i></div></div>
<div class="comp-row"><span class="lab">O(log n)</span><div class="bar"><i style="width:8%"></i></div></div>
<div class="comp-row"><span class="lab">O(√n)</span><div class="bar"><i style="width:14%"></i></div></div>
<div class="comp-row"><span class="lab">O(n)</span><div class="bar"><i style="width:22%"></i></div></div>
<div class="comp-row"><span class="lab">O(n log n)</span><div class="bar"><i style="width:32%"></i></div></div>
<div class="comp-row"><span class="lab">O(n²)</span><div class="bar"><i style="width:48%"></i></div></div>
<div class="comp-row"><span class="lab">O(n³)</span><div class="bar"><i style="width:64%"></i></div></div>
<div class="comp-row"><span class="lab">O(2ⁿ)</span><div class="bar"><i style="width:82%"></i></div></div>
<div class="comp-row"><span class="lab">O(n!)</span><div class="bar"><i style="width:98%"></i></div></div>
<p class="muted small">经验: 现代计算机 1 秒约可执行 10^8 次简单运算。n=10^6 时 O(n log n) 可行, O(n²) 勉强, O(2ⁿ) 仅适用于 n≤25 左右。</p>`
  },
  {
    title: "主定理(Master Theorem)",
    html: `<p>对递推式 <b>T(n) = aT(n/b) + f(n)</b> (a≥1, b&gt;1):</p>
<table>
<tr><th>情形</th><th>条件</th><th>解</th></tr>
<tr><td>1</td><td>f(n)=O(n^(log~b~a−ε)), ε&gt;0</td><td>T(n)=Θ(n^(log~b~a))</td></tr>
<tr><td>2</td><td>f(n)=Θ(n^(log~b~a) · log^k n)</td><td>T(n)=Θ(n^(log~b~a) · log^(k+1) n)</td></tr>
<tr><td>3</td><td>f(n)=Ω(n^(log~b~a+ε)) 且 a·f(n/b) ≤ c·f(n) (c&lt;1)</td><td>T(n)=Θ(f(n))</td></tr>
</table>
<p>典型应用: 归并排序 T(n)=2T(n/2)+Θ(n) → Θ(n log n); 二分 T(n)=T(n/2)+Θ(1) → Θ(log n); Strassen T(n)=7T(n/2)+Θ(n²) → Θ(n^log~2~7^)≈Θ(n^2.81^)。若 f(n) 与 n^(log~b~a) 之间差一个多项式因子, 主定理不适用, 用递归树/代入法。</p>`
  },
  {
    title: "排序算法对比",
    html: `<table>
<tr><th>算法</th><th>最好</th><th>平均</th><th>最坏</th><th>空间</th><th>稳定</th></tr>
<tr><td>插入排序</td><td>O(n)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>✔</td></tr>
<tr><td>归并排序</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td>✔</td></tr>
<tr><td>快速排序</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n²)</td><td>O(log n)</td><td>✘</td></tr>
<tr><td>堆排序</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>✘</td></tr>
<tr><td>计数/基数/桶</td><td colspan="3">O(n+k) / O(d(n+k)) / O(n) 平均</td><td>O(n+k)</td><td>✔</td></tr>
</table>
<p class="small muted">基于比较的排序下界 Ω(n log n)(决策树)。需要稳定性时优先归并/插入; 大规模随机数据用快排; 需要原地且保证最坏 O(n log n) 用堆排。</p>`
  },
  {
    title: "图算法复杂度",
    html: `<table>
<tr><th>问题</th><th>算法</th><th>复杂度(V=n, E=m)</th></tr>
<tr><td>BFS/DFS</td><td>—</td><td>O(n+m)</td></tr>
<tr><td>拓扑排序</td><td>Kahn / DFS</td><td>O(n+m)</td></tr>
<tr><td>强连通分量</td><td>Kosaraju / Tarjan</td><td>O(n+m)</td></tr>
<tr><td>最小生成树</td><td>Prim(二叉堆) / Kruskal</td><td>O(m log n) / O(m log m)</td></tr>
<tr><td>单源最短路</td><td>Dijkstra(堆) / Bellman-Ford</td><td>O(m log n) / O(nm)</td></tr>
<tr><td>全源最短路</td><td>Floyd-Warshall</td><td>O(n³)</td></tr>
<tr><td>最大流</td><td>Edmonds-Karp / Dinic</td><td>O(nm²) / O(n²m)</td></tr>
<tr><td>二分图最大匹配</td><td>匈牙利</td><td>O(nm)</td></tr>
</table>`
  },
  {
    title: "动态规划设计套路",
    html: `<ol>
<li><b>定义状态</b>: 明确 dp[i] / dp[i][j] 的含义(通常为「前 i 个… 且以…结尾」);</li>
<li><b>写转移方程</b>: 找到最后一步的所有可能, 建立递推关系;</li>
<li><b>确定初值与边界</b>: 初始化 dp 数组, 注意下标越界;</li>
<li><b>选择计算顺序</b>: 自底向上(迭代)或备忘录(自顶向下递归+记忆化);</li>
<li><b>优化(可选)</b>: 滚动数组压维、单调队列/斜率优化、四边形不等式;</li>
<li><b>构造方案</b>: 记录 choice 数组回溯。</li>
</ol>
<p class="small">两大要素: <b>最优子结构</b>(全局最优含局部最优)与<b>重叠子问题</b>(子问题被反复求解, 才有记忆化价值)。若子问题不重叠, 分治更合适; 若每一步只做局部最优且可证明安全, 贪心更合适。</p>`
  },
  {
    title: "五大算法设计策略",
    html: `<table>
<tr><th>策略</th><th>核心思想</th><th>典型问题</th><th>关键点</th></tr>
<tr><td>分治</td><td>分解→求解→合并</td><td>归并排序、最近点对、Strassen</td><td>子问题独立; 用主定理分析</td></tr>
<tr><td>动态规划</td><td>子问题重叠, 记录最优解</td><td>LCS、背包、矩阵链</td><td>最优子结构 + 重叠子问题</td></tr>
<tr><td>贪心</td><td>每步局部最优</td><td>活动选择、Huffman、Dijkstra</td><td>需证明贪心选择安全(交换论证)</td></tr>
<tr><td>回溯</td><td>深度搜索解空间+剪枝</td><td>N皇后、图着色、子集和</td><td>约束函数 + 限界函数</td></tr>
<tr><td>分支限界</td><td>广度/优先队列搜索+剪枝</td><td>0-1背包、TSP</td><td>上下界估计决定剪枝力度</td></tr>
</table>`
  },
  {
    title: "正确性证明方法",
    html: `<ul>
<li><b>循环不变式</b>: 初始化(循环前成立)、保持(迭代后仍成立)、终止(循环结束时不变式给出有用性质);</li>
<li><b>数学归纳法</b>: 对规模 n 归纳, 常用于递归算法与 DP 正确性;</li>
<li><b>交换论证</b>: 证明贪心解与最优解的任意差异可通过交换消除, 常用于贪心正确性;</li>
<li><b>剪枝/割性质</b>: 对 MST 用「割性质」, 对最大流用「最大流最小割定理」;</li>
<li><b>反证法</b>: 假设存在更优解导出矛盾。</li>
</ul>`
  },
  {
    title: "经典问题 → 推荐算法",
    html: `<table>
<tr><th>问题特征</th><th>推荐方法</th></tr>
<tr><td>有序数组中查找</td><td>二分查找 O(log n)</td></tr>
<tr><td>第 k 小 / 中位数</td><td>快速选择(期望 O(n)) / 堆 O(n log k)</td></tr>
<tr><td>子数组最大和</td><td>Kadane O(n)(分治 O(n log n))</td></tr>
<tr><td>两个串的相似度</td><td>编辑距离 DP O(nm)</td></tr>
<tr><td>无权图最短路</td><td>BFS O(n+m)</td></tr>
<tr><td>正权图单源最短路</td><td>Dijkstra + 堆 O(m log n)</td></tr>
<tr><td>含负权(无负环)最短路</td><td>Bellman-Ford O(nm)</td></tr>
<tr><td>每对点最短路</td><td>Floyd-Warshall O(n³)</td></tr>
<tr><td>字符串匹配</td><td>KMP O(n+m) / Rabin-Karp 期望 O(n+m)</td></tr>
<tr><td>区间最值/求和+区间修改</td><td>线段树(懒标记) / 树状数组</td></tr>
<tr><td>动态连通性</td><td>并查集(路径压缩+按秩合并) α(n)</td></tr>
<tr><td>NP 难问题小规模</td><td>回溯/分支限界/状态压缩 DP</td></tr>
<tr><td>NP 难问题大规模</td><td>近似算法 / 启发式 / 参数化</td></tr>
</table>`
  },
  {
    title: "P / NP / NPC 关系",
    html: `<p><b>P</b>: 能在多项式时间内<b>求解</b>的判定问题; <b>NP</b>: 能在多项式时间内<b>验证</b>解的问题。显然 P ⊆ NP, 但 P=NP 是否成立是千禧年难题(悬而未决)。</p>
<p><b>NP 完全(NPC)</b>: 属于 NP, 且所有 NP 问题都能多项式归约到它。已知 NPC 问题若有一个能在多项式时间内解决, 则 P=NP。</p>
<p>经典 NPC 问题: SAT、3-SAT、团(CLIQUE)、顶点覆盖、哈密顿回路、TSP、子集和、背包(判定版)、图着色(3-着色)。</p>
<p class="small">归约链示例: SAT → 3-SAT → CLIQUE(或 VERTEX-COVER) → HAM-CYCLE → TSP。遇到实际问题若可归约到 NPC, 就不要追求多项式精确解, 转而用近似/启发式。</p>`
  }
];
