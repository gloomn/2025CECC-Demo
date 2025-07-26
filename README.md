<img width="2000" height="360" alt="banner-001" src="https://github.com/user-attachments/assets/d14e87c6-f9ff-46fa-931b-d7af58ac5ea9" />
# 2025 Computer Education Coding Contest Server & Client

본 프로젝트는 2025년 컴퓨터교육과 코딩 콘테스트를 위한 서버와 클라이언트입니다.
기술 스택은 html, css, js이고, 웹 애플리케이션 프레임워크 electron.js를 사용하였습니다.

C언어 컴파일러는 portable gcc를 사용하였습니다.


## Getting started

To get started with the `GlobalKeyBoardHookLib` package, follow these steps:

### Step 1: Install the Package

You can install the `GlobalKeyBoardHookLib` package using the NuGet Package Manager in Visual Studio or via the .NET CLI.

#### Option 1: Using Visual Studio
1. Right-click on your project in the **Solution Explorer**.
2. Select **Manage NuGet Packages**.
3. In the **Browse** tab, search for `GlobalKeyBoardHookLib` made by Lee Ki Joon.
4. Click **Install** to add the package to your project.

#### Option 2: Using the .NET CLI
You can also install the package using the .NET CLI with the following command:
```bash
(https://github.com/gloomn/2025-CECC-Server-Client.git)
```
### Step 2: Add the Required Using Statement

In your project, you don't need to use `using` statement to use Global Keyboard Hook Library.

## Prerequisites

Before using the `GlobalKeyBoardHookLib` package, make sure your environment meets the following prerequisites:

1. **.NET Framework**: This package requires .NET Framework 4.7.2 or higher.
   - Make sure your project targets at least `.NET Framework 4.7.2` or a newer version.
   
2. **Windows Operating System**: This package works on Windows operating systems (Windows 7 and later).
   - It utilizes system-level hooks, so it is designed for Windows environments only.
   
3. **Visual Studio**: It is recommended to use Visual Studio 2017 or newer for seamless integration.
   
4. **Permissions**: Since this package uses global keyboard hooks, your application may need elevated privileges (Administrator) for certain functionality, depending on the system configuration.

5. **External Dependencies**: 
   - None.

## Usage

Example Code

```
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace ColorPicker
{
    public partial class main : Form
    {
        private GlobalKeyboardHook _keyboardHook;
        public main()
        {
            InitializeComponent();
            // Initialize global keyboard hook
            _keyboardHook = new GlobalKeyboardHook(); //Generate GlobalKeyboardHook Instance
            _keyboardHook.KeyDownEvent += OnGlobalKeyDown;

            this.FormClosing += MainForm_FormClosing;
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            _keyboardHook.Dispose();
        }

        private void OnGlobalKeyDown(Keys key)
        {
            // Check for a specific key combination (e.g., Ctrl+Shift+C)
            if (key == Keys.C && ModifierKeys.HasFlag(Keys.Control) && ModifierKeys.HasFlag(Keys.Shift))
            {
                // Display the color in a message box (or update a UI element)
                MessageBox.Show("Key Detected!", "Global Keyboard Hook Library Test", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }
    }
}

```
mirror code 저작권 표시
## Feedback

Email: ithan0704@naver.com

