# LinearViz — 线性代数可视化教学网站

> 以交互式可视化方式学习线性代数，从原理到工程应用

## 在线访问

**GitHub Pages**: https://你的用户名.github.io/linear-algebra-viz/

## 项目特色

- **知识点原理拆解**：向量、矩阵、线性变换、行列式、特征值与特征向量
- **工程落地应用**：计算机图形学、机器学习、信号处理、数据压缩
- **交互式可视化**：Canvas 实时渲染，可拖拽参数调节
- **答题评估系统**：14道分级习题，实时掌握度追踪
- **悦耳音效**：Tone.js 驱动的交互音效

## 技术栈

- HTML5 + CSS3 + Vanilla JavaScript
- Canvas 2D 可视化引擎
- GSAP + ScrollTrigger 动画
- Tone.js 音效系统
- KaTeX 数学公式渲染

## 本地运行

```bash
# 方式一：直接打开
open index.html

# 方式二：本地服务器
cd linear-algebra-viz
python -m http.server 8080
```

## 目录结构

```
linear-algebra-viz/
├── index.html          # 主页面
├── css/
│   └── styles.css      # 全局样式
├── js/
│   ├── main.js         # 入口文件
│   ├── engine.js       # 可视化引擎
│   ├── audio.js        # 音效系统
│   ├── topics/         # 知识点模块
│   │   ├── vectors.js
│   │   ├── matrices.js
│   │   ├── transforms.js
│   │   ├── determinants.js
│   │   ├── eigen.js
│   │   └── applications.js
│   └── components/
│       └── playground.js
├── apps/               # 工程应用详情页
│   ├── graphics.html
│   ├── ml.html
│   ├── signal.html
│   └── data.html
├── assets/
│   ├── icon.svg
│   └── audio/
├── manifest.json
└── sw.js
```

## 部署为 PWA

网站已配置 Web App Manifest 和 Service Worker，支持：
- 离线缓存浏览
- 添加到手机主屏幕（像原生 App）
- 全屏无地址栏体验

## 许可

MIT License
