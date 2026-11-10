# -*- coding: utf-8 -*-
"""组件同步构建脚本（可选工具，非必交材料）。

用途：
    components/ 目录是页头、导航、页脚的唯一数据源。运行本脚本后，
    根目录下每个 .html 页面中的 AUTO-INJECT 区块会被自动替换成组件内容。

为什么要它：
    纯静态 HTML 没有原生的 include 机制。用 fetch 注入组件在 file://
    协议下会被浏览器拦截，双击打开就会白屏；而逐页手工复制组件又违背
    「一次开发，全站复用」。本脚本给出第三条路：页面本身是可以直接双击
    打开的成品，组件保持一致由构建脚本保证，改一处即可全站同步。

用法：
    python build.py          # 同步所有页面
    新增页面时：复制任一页面 → 保留 AUTO-INJECT 注释块 → 改正文 → 运行本脚本。

注意：
    页面里 AUTO-INJECT 区块之间的内容会被覆盖，请勿手工编辑该区间。
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
COMPONENT_DIR = ROOT / "components"
SLOT_NAV = "<!-- @slot:nav -->"
BLOCK_RE = re.compile(
    r"(<!-- BEGIN AUTO-INJECT: ([a-z-]+) -->)(.*?)(<!-- END AUTO-INJECT -->)",
    re.DOTALL,
)


def read_component(name):
    """读取组件片段，去掉首尾空行，保持内部缩进不变。"""
    path = COMPONENT_DIR / (name + ".html")
    if not path.is_file():
        raise FileNotFoundError("找不到组件文件：%s" % path)
    return path.read_text(encoding="utf-8").strip("\n")


def indent_lines(text, indent):
    """为组件每行补上页面中的缩进，保证生成结果缩进整齐。"""
    return "\n".join(
        (indent + line) if line.strip() else line for line in text.splitlines()
    )


def render(name):
    """渲染组件；SiteHeader 内部通过 @slot:nav 组合 MainNav。"""
    html = read_component(name)
    if name == "header" and SLOT_NAV in html:
        slot_indent = ""
        for line in html.splitlines():
            if SLOT_NAV in line:
                slot_indent = line[: len(line) - len(line.lstrip())]
                break
        nav = indent_lines(read_component("nav"), slot_indent)
        html = html.replace(slot_indent + SLOT_NAV, nav)
    return html


def sync_page(page):
    source = page.read_text(encoding="utf-8")

    def replace_block(match):
        opening, name, _, closing = match.groups()
        line_start = source.rfind("\n", 0, match.start()) + 1
        prefix = source[line_start:match.start()]
        indent = re.match(r"[ \t]*", prefix).group(0)
        body = indent_lines(render(name), indent)
        return opening + "\n" + body + "\n" + indent + closing

    updated, count = BLOCK_RE.subn(replace_block, source)
    if count == 0:
        return 0
    if updated != source:
        page.write_text(updated, encoding="utf-8")
    return count


def main():
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        print("未找到页面文件，请先创建 index.html。")
        return
    total = 0
    for page in pages:
        count = sync_page(page)
        total += count
        print("[同步] %-16s %d 个组件区块" % (page.name, count))
    print("完成：%d 个页面，%d 个组件区块，数据源 components/。" % (len(pages), total))


if __name__ == "__main__":
    main()
