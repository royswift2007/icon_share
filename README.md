# Symbol & Emoji Collection

一个可搜索、可分类浏览、支持一键复制的符号与 Emoji 静态网页工具。  
A searchable, categorized symbol and emoji collection built as a simple static web page with one-click copy support.

## 中文介绍

这个项目整理了常用 Unicode 符号、特殊字符、Emoji、国旗和组合表情，适合在论坛、社交平台、文档、聊天和网页编辑中快速查找与复制。页面支持关键词搜索、分类筛选、左侧分类导航、当前分类高亮，以及点击任意符号后一键复制。

## English Introduction

This project is a lightweight static website for browsing, searching, and copying Unicode symbols, special characters, emoji, country flags, and combined emoji sequences. It is useful for forums, social platforms, documents, chats, and web editing. The page includes keyword search, category filters, sidebar navigation, active category highlighting, and one-click copy for each symbol.

## Features / 功能特点

- Search symbols and emoji by keyword / 支持关键词搜索符号和 Emoji
- Browse by category / 支持按分类浏览
- One-click copy / 点击即可复制
- Sidebar category navigation / 左侧分类导航
- Active category highlight / 当前分类高亮显示
- Includes country flags and combined emoji sequences / 包含国旗和组合 Emoji
- Deduplicated and normalized symbol data / 符号数据经过去重与归一化整理
- No backend required / 无需后端，直接作为静态页面使用

## Usage / 使用方法

1. Clone or download this repository. / 克隆或下载本仓库。
2. Open [index.html](index.html) in a browser. / 用浏览器打开 [index.html](index.html)。
3. Search, browse categories, and click any symbol to copy it. / 搜索或浏览分类，点击任意符号即可复制。

## Project Files / 项目文件

- [index.html](index.html): main static web page / 主页面
- [symbols-data.json](symbols-data.json): categorized symbol data / 分类符号数据
- [tools/dedupe-symbols.js](tools/dedupe-symbols.js): data cleanup and rebuild script / 数据去重与重建脚本
- [tools/apply-forum-markers.js](tools/apply-forum-markers.js): special marker generation script / 特殊边框标记生成脚本

## Topics / 标签

symbols, emoji, unicode, special-characters, character-map, copy-to-clipboard, searchable, categorized, static-site
