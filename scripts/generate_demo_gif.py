from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "docs" / "assets" / "demo.gif"
W, H = 960, 540
FPS = 8


COLORS = {
    "bg": "#f6f8fb",
    "sidebar": "#172033",
    "sidebar_soft": "#253149",
    "panel": "#ffffff",
    "line": "#dbe3ef",
    "text": "#162033",
    "muted": "#67748a",
    "blue": "#2563eb",
    "blue_soft": "#dbeafe",
    "green": "#0f9f6e",
    "green_soft": "#dcfce7",
    "amber": "#d97706",
    "amber_soft": "#fef3c7",
    "red": "#dc2626",
    "red_soft": "#fee2e2",
    "purple": "#7c3aed",
    "purple_soft": "#ede9fe",
}


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size, index=1 if bold else 0)
            except OSError:
                continue
    return ImageFont.load_default()


F = {
    "xs": font(12),
    "sm": font(14),
    "body": font(16),
    "body_b": font(16, True),
    "h3": font(20, True),
    "h2": font(24, True),
    "h1": font(30, True),
}


def ease(x: float) -> float:
    return 0.5 - math.cos(max(0, min(1, x)) * math.pi) / 2


def mix(a: tuple[int, int], b: tuple[int, int], t: float) -> tuple[int, int]:
    k = ease(t)
    return (round(a[0] + (b[0] - a[0]) * k), round(a[1] + (b[1] - a[1]) * k))


def base(step: int, title: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), COLORS["bg"])
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((18, 18, 178, H - 18), radius=16, fill=COLORS["sidebar"])
    d.ellipse((38, 42, 76, 80), fill=COLORS["blue"])
    d.text((51, 49), "J", fill="white", font=F["h3"])
    d.text((86, 44), "求职作战台", fill="white", font=F["body_b"])
    d.text((86, 66), "Job Hunt CRM", fill="#a7b5cc", font=F["xs"])

    nav = ["概览", "岗位", "简历", "面试", "统计", "设置"]
    active = ["设置", "岗位", "岗位", "概览", "岗位", "统计"][step - 1]
    y = 122
    for item in nav:
        fill = COLORS["sidebar_soft"] if item == active else COLORS["sidebar"]
        d.rounded_rectangle((34, y, 162, y + 36), radius=9, fill=fill)
        d.text((52, y + 9), item, fill="white" if item == active else "#a7b5cc", font=F["body"])
        y += 44

    d.text((210, 28), "本地优先 · 无登录 · 无云同步", fill=COLORS["muted"], font=F["sm"])
    d.text((210, 52), title, fill=COLORS["text"], font=F["h1"])
    d.rounded_rectangle((808, 44, 918, 84), radius=10, fill=COLORS["blue"])
    d.text((831, 55), "新增岗位", fill="white", font=F["body_b"])
    return img, d


def card(d: ImageDraw.ImageDraw, box: tuple[int, int, int, int], title: str = "", fill: str = COLORS["panel"]):
    d.rounded_rectangle(box, radius=12, fill=fill, outline=COLORS["line"])
    if title:
        d.text((box[0] + 18, box[1] + 16), title, fill=COLORS["text"], font=F["h3"])


def pill(d: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, fill: str, fg: str = COLORS["text"]):
    x, y = xy
    w = max(54, int(d.textlength(text, font=F["sm"])) + 24)
    d.rounded_rectangle((x, y, x + w, y + 26), radius=13, fill=fill)
    d.text((x + 12, y + 5), text, fill=fg, font=F["sm"])
    return w


def cursor(d: ImageDraw.ImageDraw, pos: tuple[int, int], click: bool = False):
    x, y = pos
    if click:
        d.ellipse((x - 16, y - 16, x + 16, y + 16), outline=COLORS["blue"], width=3)
    pts = [(x, y), (x, y + 28), (x + 8, y + 20), (x + 15, y + 36), (x + 22, y + 33), (x + 14, y + 18), (x + 26, y + 18)]
    d.polygon(pts, fill="white", outline="#0f172a")


def progress(d: ImageDraw.ImageDraw, step: int):
    x = 214
    for i in range(1, 7):
        fill = COLORS["blue"] if i <= step else "#dbe3ef"
        d.ellipse((x, 506, x + 14, 520), fill=fill)
        if i < 6:
            d.line((x + 17, 513, x + 62, 513), fill=fill, width=3)
        x += 66
    d.text((628, 503), f"Step {step}/6", fill=COLORS["muted"], font=F["sm"])


def scene_1(t: float):
    img, d = base(1, "设置 / 一键填充示例数据")
    card(d, (210, 118, 910, 430), "数据导入导出")
    d.text((230, 160), "所有数据保存在本机浏览器 IndexedDB，可导出 JSON 备份。", fill=COLORS["muted"], font=F["body"])
    buttons = [("导出 JSON", 230), ("导入 JSON", 348), ("加载示例数据", 466)]
    for label, x in buttons:
        fill = COLORS["blue"] if label == "加载示例数据" else "#eef2f7"
        fg = "white" if label == "加载示例数据" else COLORS["text"]
        d.rounded_rectangle((x, 205, x + 110 if label != "加载示例数据" else x + 138, 244), radius=10, fill=fill)
        d.text((x + 18, 216), label, fill=fg, font=F["body_b"])
    if t > 0.45:
        k = ease((t - 0.45) / 0.55)
        d.rounded_rectangle((230, 282, 525, 348), radius=12, fill=COLORS["green_soft"], outline="#86efac")
        d.text((252, 301), "示例数据已加载：12 个岗位 / 4 份简历 / 6 条面试", fill="#166534", font=F["body_b"])
        for i, (label, value) in enumerate([("岗位记录", "12"), ("简历版本", "4"), ("面试记录", "6")]):
            x = 570 + i * 110
            d.rounded_rectangle((x, 282, x + 92, 348), radius=12, fill="white", outline=COLORS["line"])
            d.text((x + 14, 298), label, fill=COLORS["muted"], font=F["xs"])
            d.text((x + 18, 316), str(round(int(value) * k)), fill=COLORS["text"], font=F["h3"])
    cursor(d, mix((618, 218), (535, 226), min(1, t * 1.8)), click=0.35 < t < 0.48)
    progress(d, 1)
    return img


def scene_2(t: float):
    img, d = base(2, "岗位 / 粘贴 JD 自动建档")
    card(d, (210, 118, 488, 430), "岗位列表")
    d.rounded_rectangle((232, 170, 466, 204), radius=8, fill="#eef2f7")
    d.text((246, 179), "搜索公司 / 岗位 / JD...", fill=COLORS["muted"], font=F["sm"])
    card(d, (510, 118, 910, 430), "新增岗位")
    fields = [("公司", "字节跳动"), ("岗位", "Flutter 高级开发"), ("渠道", "BOSS直聘"), ("城市", "上海"), ("薪资", "30-45K"), ("工作方式", "混合办公")]
    for i, (label, value) in enumerate(fields):
        x = 532 + (i % 2) * 178
        y = 170 + (i // 2) * 58
        active = t > 0.38 and i in {0, 1, 2, 3, 4}
        d.text((x, y - 18), label, fill=COLORS["muted"], font=F["xs"])
        d.rounded_rectangle((x, y, x + 158, y + 34), radius=8, fill=COLORS["amber_soft"] if active else "white", outline="#f59e0b" if active else COLORS["line"], width=2 if active else 1)
        shown = value[: max(0, round(len(value) * ease((t - 0.28) / 0.42)))] if t > 0.28 else ""
        d.text((x + 10, y + 8), shown, fill=COLORS["text"], font=F["sm"])
    d.text((532, 336), "JD 原文", fill=COLORS["muted"], font=F["xs"])
    d.rounded_rectangle((532, 354, 888, 410), radius=8, fill="white", outline=COLORS["line"])
    jd = "【BOSS直聘】上海 · Flutter 高级开发 · 30-45K\n负责跨端架构、性能优化、AI 工具产品..."
    d.multiline_text((544, 363), jd[: round(len(jd) * ease(t / 0.55))], fill=COLORS["text"], font=F["sm"], spacing=4)
    if t > 0.48:
        d.text((646, 337), "已自动填充：公司、岗位、渠道、城市、薪资", fill=COLORS["amber"], font=F["xs"])
    cursor(d, mix((842, 70), (584, 374), min(1, t * 1.5)), click=0.16 < t < 0.24)
    progress(d, 2)
    return img


def scene_3(t: float):
    img, d = base(3, "岗位 / 点击状态标签快速流转")
    card(d, (210, 118, 488, 430), "岗位列表")
    apps = [
        ("字节跳动", "Flutter 高级开发", "BOSS直聘", "已投递"),
        ("小红书", "移动端架构师", "内推", "面试中"),
        ("米哈游", "AI 应用工程师", "脉脉", "待评估"),
    ]
    for i, (company, role, channel, status) in enumerate(apps):
        y = 168 + i * 74
        selected = i == 0
        d.rounded_rectangle((228, y, 468, y + 58), radius=11, fill="#eef6ff" if selected else "white", outline=COLORS["line"])
        status_text = "面试中" if i == 0 and t > 0.45 else status
        fill = COLORS["purple_soft"] if status_text == "面试中" else COLORS["blue_soft"]
        fg = COLORS["purple"] if status_text == "面试中" else COLORS["blue"]
        pill(d, (242, y + 16), status_text, fill, fg)
        d.text((316, y + 10), company, fill=COLORS["text"], font=F["body_b"])
        d.text((316, y + 31), role, fill=COLORS["muted"], font=F["sm"])
        d.text((410, y + 31), channel, fill=COLORS["muted"], font=F["xs"])
    card(d, (510, 118, 910, 430), "字节跳动")
    d.text((532, 155), "Flutter 高级开发", fill=COLORS["muted"], font=F["body"])
    d.text((532, 205), "快速更新状态", fill=COLORS["muted"], font=F["sm"])
    d.rounded_rectangle((532, 230, 870, 268), radius=9, fill="white", outline=COLORS["line"])
    d.text((548, 241), "面试中" if t > 0.45 else "已投递", fill=COLORS["text"], font=F["body_b"])
    if t > 0.45:
        d.rounded_rectangle((532, 294, 870, 350), radius=12, fill=COLORS["purple_soft"])
        d.text((554, 313), "状态已更新：下一步准备面试问题和项目素材", fill=COLORS["purple"], font=F["body_b"])
    cursor(d, mix((396, 197), (263, 198), min(1, t * 1.4)), click=0.32 < t < 0.45)
    progress(d, 3)
    return img


def scene_4(t: float):
    img, d = base(4, "概览 / 今日行动台与智能提醒")
    for i, (label, value, color) in enumerate([("活跃岗位", "9", COLORS["blue"]), ("面试中", "3", COLORS["purple"]), ("待跟进", "4", COLORS["amber"])]):
        x = 210 + i * 150
        card(d, (x, 118, x + 132, 190))
        d.text((x + 16, 134), label, fill=COLORS["muted"], font=F["sm"])
        d.text((x + 18, 154), value, fill=color, font=F["h2"])
    card(d, (210, 214, 560, 430), "今日行动台")
    actions = [("高", "跟进 BOSS 直聘 2 个超期岗位"), ("高", "今晚 20:00 准备字节二面"), ("中", "补全 3 个岗位的 JD 原文")]
    for i, (level, text) in enumerate(actions):
        y = 264 + i * 48
        fill = COLORS["red_soft"] if level == "高" else COLORS["amber_soft"]
        fg = COLORS["red"] if level == "高" else COLORS["amber"]
        pill(d, (232, y), level, fill, fg)
        d.text((286, y + 5), text, fill=COLORS["text"], font=F["body"])
    card(d, (584, 214, 910, 430), "智能提醒")
    alerts = [("停滞 5 天", "小红书岗位建议今天追问进度"), ("薄弱点重合", "Flutter 性能优化在历史面试中反复出现")]
    for i, (title, desc) in enumerate(alerts):
        y = 264 + i * 70
        d.rounded_rectangle((606, y, 888, y + 54), radius=12, fill=COLORS["blue_soft"] if i == 0 else COLORS["amber_soft"])
        d.text((624, y + 9), title, fill=COLORS["text"], font=F["body_b"])
        d.text((624, y + 31), desc, fill=COLORS["muted"], font=F["xs"])
    cursor(d, mix((80, 226), (74, 142), min(1, t * 1.6)), click=0.2 < t < 0.33)
    progress(d, 4)
    return img


def scene_5(t: float):
    img, d = base(5, "岗位详情 / 关联简历并生成匹配建议")
    card(d, (210, 118, 488, 430), "岗位列表")
    d.rounded_rectangle((228, 168, 468, 226), radius=11, fill="#eef6ff", outline=COLORS["line"])
    pill(d, (242, 184), "面试中", COLORS["purple_soft"], COLORS["purple"])
    d.text((316, 178), "字节跳动", fill=COLORS["text"], font=F["body_b"])
    d.text((316, 199), "Flutter 高级开发", fill=COLORS["muted"], font=F["sm"])
    card(d, (510, 118, 910, 430), "字节跳动")
    d.text((532, 155), "Flutter 高级开发 · 上海 · 30-45K", fill=COLORS["muted"], font=F["body"])
    d.text((532, 198), "关联简历版本", fill=COLORS["muted"], font=F["sm"])
    d.rounded_rectangle((532, 222, 870, 260), radius=9, fill="white", outline=COLORS["line"])
    d.text((548, 233), "移动端架构版 · Flutter/AI 工具" if t > 0.25 else "暂不关联", fill=COLORS["text"], font=F["body_b"])
    if t > 0.45:
        d.rounded_rectangle((532, 282, 870, 320), radius=10, fill=COLORS["blue"])
        d.text((602, 293), "生成简历匹配建议", fill="white", font=F["body_b"])
    if t > 0.62:
        items = [("可直接讲", "跨端架构、性能优化、复杂状态管理"), ("缺口", "AI 工具链落地案例需要补强"), ("差异化", "把海外产品增长数据放到项目开头")]
        for i, (label, text) in enumerate(items):
            y = 336 + i * 30
            pill(d, (532, y), label, [COLORS["green_soft"], COLORS["amber_soft"], COLORS["purple_soft"]][i], [COLORS["green"], COLORS["amber"], COLORS["purple"]][i])
            d.text((622, y + 5), text, fill=COLORS["text"], font=F["sm"])
    cursor(d, mix((278, 194), (826, 242), min(1, t * 1.2)), click=0.22 < t < 0.32 or 0.5 < t < 0.6)
    progress(d, 5)
    return img


def scene_6(t: float):
    img, d = base(6, "统计 / 瓶颈提示与高频薄弱点")
    card(d, (210, 118, 560, 430), "投递漏斗")
    levels = [("投递", 100, COLORS["blue"]), ("回复", 58, COLORS["green"]), ("面试", 32, COLORS["purple"]), ("Offer", 8, COLORS["amber"])]
    for i, (label, pct, color) in enumerate(levels):
        y = 170 + i * 54
        d.text((232, y), label, fill=COLORS["text"], font=F["body_b"])
        d.rounded_rectangle((302, y + 4, 520, y + 24), radius=10, fill="#edf2f7")
        d.rounded_rectangle((302, y + 4, 302 + round(218 * pct / 100 * ease(min(1, t * 1.4))), y + 24), radius=10, fill=color)
        d.text((526, y + 2), f"{pct}%", fill=COLORS["muted"], font=F["sm"])
    card(d, (584, 118, 910, 250), "瓶颈提示")
    d.rounded_rectangle((606, 166, 888, 218), radius=12, fill=COLORS["amber_soft"])
    d.text((624, 178), "回复率低于近期均值", fill="#92400e", font=F["sm"])
    d.text((624, 198), "建议优先优化 BOSS 首句开场", fill="#92400e", font=F["sm"])
    card(d, (584, 272, 910, 430), "高频薄弱点")
    weak = [("Flutter 性能优化", 3), ("系统设计取舍", 2), ("AI 工具链落地", 2)]
    for i, (label, count) in enumerate(weak):
        y = 320 + i * 34
        d.text((606, y), label, fill=COLORS["text"], font=F["body"])
        d.rounded_rectangle((760, y + 4, 868, y + 20), radius=8, fill="#edf2f7")
        d.rounded_rectangle((760, y + 4, 760 + count * 30, y + 20), radius=8, fill=COLORS["red"] if i == 0 else COLORS["purple"])
        d.text((876, y - 1), f"{count} 次", fill=COLORS["muted"], font=F["sm"])
    cursor(d, mix((74, 318), (74, 318), t), click=0.12 < t < 0.25)
    progress(d, 6)
    return img


SCENES = [scene_1, scene_2, scene_3, scene_4, scene_5, scene_6]


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    frames: list[Image.Image] = []
    scene_frames = [24, 30, 24, 24, 32, 28]
    for fn, count in zip(SCENES, scene_frames):
        for i in range(count):
            frames.append(fn(i / max(1, count - 1)))

    frames[0].save(
        OUTPUT,
        save_all=True,
        append_images=frames[1:],
        duration=round(1000 / FPS),
        loop=0,
        optimize=True,
    )
    print(f"Wrote {OUTPUT} ({len(frames)} frames, {len(frames) / FPS:.1f}s)")


if __name__ == "__main__":
    main()
