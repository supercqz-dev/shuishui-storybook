# character_refs 目录规范

## 文件分类

```
character_refs/
├── shuishui.png       # canonical (当前定稿)
├── papa.png           # canonical
├── mama.png           # canonical
├── laolao.png         # canonical
├── family.png         # canonical
├── CONVENTIONS.md     # 本文件
└── iterations/        # 历史所有测试样例
    └── YYYY-MM-DD-{character}-{topic}/
        ├── *.png      # 该轮所有产出(包括失败的中间版本)
        └── log.txt    # prompt + moderation 状态记录
```

## 硬规则(写脚本必读)

1. **禁止覆盖 canonical 文件**。所有生成脚本只能写到 `iterations/<date>-<topic>/<variant-name>.png`。
2. **canonical 升级必须显式人工动作**。要么用户在 UI 里点"采纳",要么人手 `cp iterations/.../foo.png character_refs/foo.png`。脚本不能自动做这一步。
3. **每次实验必须新建 iteration 子目录**,带日期 + 主题 (如 `2026-05-27-mama-stepup`)。不要往老目录里塞新东西混淆时间线。
4. **每张图必须有同名 prompt 记录**。要么所有 prompt 写在该子目录的 `log.txt`,要么每张图配一个 `*.prompt.txt`。能查到"这张图当时是怎么生出来的"。
5. **失败也要记录**。moderation_blocked 的 prompt 同样写进 log,这是负样本数据,下次写 prompt 要参考。

## 为什么这样规定

2026-05-27 实测踩坑:Azure content filter 跨日不可重复,昨天通过的 prompt 今天可能被卡。如果脚本直接覆盖 canonical 图,一旦今天的版本不如昨天,就再也回不去了——昨天的图丢失,昨天的 prompt 即便有也跑不出当时的图。

iterations 目录是回归基线,canonical 是发布产出。两者必须严格分离。

## promote 流程示例

```bash
# 决定把某轮的某张图升级为新 canonical 之前,先备份当前 canonical
cp character_refs/mama.png character_refs/iterations/$(date +%Y-%m-%d)-mama-prev/mama.png
# 然后 promote
cp character_refs/iterations/2026-05-27-mama-stepup/su-rabbit-dress-bigflowers.png character_refs/mama.png
```
