# -*- coding: utf-8 -*-
"""静态资源压缩脚本（第三阶段 · 性能优化，可重复运行）。

策略：**保守压缩** —— 只移除块注释、行注释、空行与行首缩进，
不改写任何代码 token、不合并选择器、不做变量重命名，因此不需要
构建工具与依赖，压缩前后语义完全一致，可直接用 node --check 校验。

用法：
    python build_assets.py        # 由 css/style.css、js/script.js 生成 .min 版本

页面（index.html / about.html / 404.html）引用的是压缩产物；
带完整中文注释的源文件保留在同目录，供课堂评审阅读与对照。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def minify(text, is_js=False):
    """移除注释与空白；不改变任何一行代码的内容。"""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if is_js and stripped.startswith("//"):
            continue
        lines.append(stripped)
    return "\n".join(lines) + "\n"


def build(src_rel, dst_rel, is_js=False):
    src = ROOT / src_rel
    dst = ROOT / dst_rel
    dst.write_text(minify(src.read_text(encoding="utf-8"), is_js), encoding="utf-8")
    a, b = src.stat().st_size, dst.stat().st_size
    print("  %-18s %6d B -> %-18s %6d B   -%.1f%%" %
          (src_rel, a, dst_rel, b, (1 - b / a) * 100))


def main():
    print("生成压缩资源（源文件保持不变）：")
    build("css/style.css", "css/style.min.css")
    build("js/script.js", "js/script.min.js", is_js=True)
    print("完成。可用 node --check js/script.min.js 验证语法。")


if __name__ == "__main__":
    main()
