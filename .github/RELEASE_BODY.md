## Installation / 安装说明

### macOS

If you see **"'EasyClaw' is damaged and can't be opened"** — this is macOS Gatekeeper blocking an unsigned app. The file is not actually damaged.

如果提示 **"'EasyClaw' 已损坏，无法打开"**，这是 macOS Gatekeeper 安全机制拦截了未签名应用，并非文件真的损坏。

**Fix / 解决方法：**

1. Open **Terminal** (press `Cmd + Space`, search "Terminal")
2. Run the following command / 运行以下命令：

```bash
sudo xattr -r -d com.apple.quarantine /Applications/EasyClaw.app
```

3. Enter your login password (characters won't be displayed), press Enter / 输入开机密码（不显示字符），按回车
4. Re-open the app / 重新打开应用即可

### Windows

If **Windows SmartScreen** shows "Windows protected your PC" / 如果 SmartScreen 提示"已保护你的电脑"：

1. Click **"More info"** / 点击 **"更多信息"**
2. Click **"Run anyway"** / 点击 **"仍要运行"**

This is normal for apps without a digital signature. / 这是无数字签名应用的正常现象。
